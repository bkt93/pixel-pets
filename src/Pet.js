import { getPet } from './registry.js';
import { rasterize, Z_GLYPH } from './sprite.js';

const DEFAULTS = {
  scale: 4,          // tamaño de cada píxel del sprite en px de pantalla
  x: null,           // posición horizontal inicial en px (por defecto: centro)
  bottom: 0,         // distancia al borde inferior del contenedor en px
  facing: 'right',
  state: 'sit',
  autoplay: false,   // comportamiento autónomo
  interactive: true, // click: maúlla / despierta
  colors: {},        // reemplazos de la paleta, p. ej. { 'o': '#ffd34d' }
  zIndex: 10,
};

export class Pet {
  constructor(type, container, options = {}) {
    this.def = getPet(type);
    this.container = container;
    this.opts = { ...DEFAULTS, ...options };
    this.scale = this.opts.scale;
    this.facing = this.opts.facing;
    this.state = null;
    this._listeners = {};
    this._frames = {};
    for (const [name, rows] of Object.entries(this.def.frames)) {
      this._frames[name] = rasterize(rows, this.def.palette, this.opts.colors);
    }
    this._zColor = this.opts.colors.z ?? this.def.palette.z ?? '#8a93b8';
    this._zGlyph = rasterize(Z_GLYPH, { '#': this._zColor });
    this._mount();
    this.x = this.opts.x ?? Math.max(0, (this._bounds() - this.width) / 2);
    this._last = performance.now();
    this._raf = requestAnimationFrame((t) => this._tick(t));
    this._setState(this.opts.state);
    if (this.opts.autoplay) this.autoplay(true);
  }

  get width() { return this.def.width * this.scale; }
  get height() { return this.def.height * this.scale; }

  // ---- Comandos -----------------------------------------------------------

  sit() { this._setState('sit'); return Promise.resolve(this); }

  sleep() { this._setState('sleep'); return Promise.resolve(this); }

  wake() { return this.state === 'sleep' ? this.sit() : Promise.resolve(this); }

  // walk()               deambula y rebota en los bordes
  // walk('left'|'right') camina en esa dirección
  // walk({ to: 120 })    camina hasta x = 120 px y se sienta (la promesa resuelve al llegar)
  walk(arg) {
    const target = typeof arg === 'object' && arg !== null ? arg.to : null;
    if (typeof arg === 'string') this.face(arg);
    this._resolveWalk?.(this);
    this._walkTarget = target == null ? null : this._clamp(target);
    if (this._walkTarget != null && this._walkTarget !== this.x) {
      this.face(this._walkTarget < this.x ? 'left' : 'right');
    }
    this._setState('walk');
    if (this._walkTarget == null) return Promise.resolve(this);
    return new Promise((resolve) => { this._resolveWalk = resolve; });
  }

  walkTo(x) { return this.walk({ to: x }); }

  face(dir) {
    if (dir === 'left' || dir === 'right') this.facing = dir;
    return this;
  }

  say(text, ms = 1800) {
    clearTimeout(this._bubbleTimer);
    this.bubble.textContent = text;
    this.bubble.style.display = 'block';
    this._bubbleTimer = setTimeout(() => { this.bubble.style.display = 'none'; }, ms);
    return this;
  }

  autoplay(on = true) {
    clearTimeout(this._autoTimer);
    this._auto = on;
    if (on) this._scheduleAuto(1500);
    return this;
  }

  on(event, fn) {
    (this._listeners[event] ??= new Set()).add(fn);
    return () => this._listeners[event].delete(fn);
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    clearTimeout(this._autoTimer);
    clearTimeout(this._bubbleTimer);
    this._ro?.disconnect();
    this.el.remove();
  }

  // ---- Internos -----------------------------------------------------------

  _emit(event, data) {
    this._listeners[event]?.forEach((fn) => fn(data, this));
  }

  _mount() {
    if (getComputedStyle(this.container).position === 'static') {
      this.container.style.position = 'relative';
    }
    const el = document.createElement('div');
    el.className = `pixel-pet pixel-pet--${this.def.name}`;
    Object.assign(el.style, {
      position: 'absolute', left: '0', bottom: `${this.opts.bottom}px`,
      width: `${this.width}px`, height: `${this.height}px`,
      zIndex: String(this.opts.zIndex), cursor: this.opts.interactive ? 'pointer' : '',
      userSelect: 'none', willChange: 'transform',
    });
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.style.display = 'block';
    canvas.style.imageRendering = 'pixelated';
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    const bubble = document.createElement('div');
    bubble.className = 'pixel-pet__bubble';
    Object.assign(bubble.style, {
      position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
      display: 'none', whiteSpace: 'nowrap', marginBottom: '6px',
      padding: `${this.scale}px ${this.scale * 2}px`,
      font: `bold ${Math.max(12, this.scale * 3)}px ui-monospace, "Courier New", monospace`,
      background: '#fff', color: '#1f1f1f', border: `${Math.max(2, this.scale / 2)}px solid #1f1f1f`,
      borderRadius: `${this.scale}px`, letterSpacing: '1px',
    });
    el.append(bubble, canvas);
    this.container.appendChild(el);
    this.el = el;
    this.canvas = canvas;
    this.bubble = bubble;

    el.addEventListener('click', (e) => {
      this._emit('click', e);
      if (!this.opts.interactive) return;
      if (this.state === 'sleep') { this.sit(); this.say('mrr?'); }
      else this.say('MEOW!');
    });

    if ('ResizeObserver' in window) {
      this._ro = new ResizeObserver(() => { this.x = this._clamp(this.x); });
      this._ro.observe(this.container);
    }
  }

  _bounds() { return this.container.clientWidth; }

  _clamp(x) { return Math.min(Math.max(0, x), Math.max(0, this._bounds() - this.width)); }

  _setState(state) {
    if (state !== 'walk') { this._resolveWalk?.(this); this._resolveWalk = null; this._walkTarget = null; }
    if (state !== 'sleep') this._zs = [];
    const prev = this.state;
    this.state = state;
    this._animT = 0;
    this._zTimer = 0;
    if (prev !== state) this._emit('statechange', { from: prev, to: state });
  }

  _scheduleAuto(delay) {
    this._autoTimer = setTimeout(() => {
      if (!this._auto) return;
      const r = Math.random();
      if (this.state === 'sleep') {
        if (r < 0.35) this.sit();
      } else if (this.state === 'sit') {
        if (r < 0.45) this.walkTo(Math.random() * (this._bounds() - this.width));
        else if (r < 0.65) this.sleep();
      }
      this._scheduleAuto(2500 + Math.random() * 4000);
    }, delay);
  }

  _currentFrame() {
    const anims = this.def.animations;
    const seq = anims[this.state];
    const total = seq.reduce((s, [, d]) => s + d, 0);
    let t = this._animT % total;
    for (const [frame, d] of seq) {
      if (t < d) return frame;
      t -= d;
    }
    return seq[0][0];
  }

  _tick(now) {
    const dt = Math.min(100, now - this._last);
    this._last = now;
    this._animT += dt;
    const step = this.def.walkSpeed * this.scale * (dt / 1000);
    const dir = this.facing === 'right' ? 1 : -1;

    if (this.state === 'walk') {
      if (this._walkTarget != null) {
        const remaining = this._walkTarget - this.x;
        if (Math.abs(remaining) <= step) {
          this.x = this._walkTarget;
          const resolve = this._resolveWalk;
          this._resolveWalk = null;
          this._setState('sit');
          resolve?.(this);
        } else {
          this.x += Math.sign(remaining) * step;
        }
      } else {
        const next = this.x + dir * step;
        const max = Math.max(0, this._bounds() - this.width);
        if (next <= 0 || next >= max) this.face(dir > 0 ? 'left' : 'right');
        this.x = Math.min(Math.max(0, next), max);
      }
    } else if (this.state === 'sleep') {
      this._zTimer += dt;
      if (this._zTimer > 900) {
        this._zTimer = 0;
        this._zs.push({ age: 0 });
      }
      for (const z of this._zs) z.age += dt;
      this._zs = this._zs.filter((z) => z.age < 2400);
    }

    this._draw();
    this.el.style.transform = `translate(${Math.round(this.x)}px, 0px)`;
    this._raf = requestAnimationFrame((t) => this._tick(t));
  }

  _draw() {
    const { ctx, scale } = this;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.save();
    if (this.facing === 'left') {
      ctx.translate(this.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(this._frames[this._currentFrame()], 0, 0, this.width, this.height);
    ctx.restore();

    if (this.state === 'sleep' && this._zs.length) {
      const [ax, ay] = this.def.anchors?.sleepZ ?? [this.def.width / 2, 4];
      for (const z of this._zs) {
        const p = z.age / 2400;
        let px = Math.round(ax + p * 6 + Math.sin(p * 6) * 1);
        const py = Math.round(ay - p * 6);
        if (this.facing === 'left') px = this.def.width - px - 3;
        ctx.globalAlpha = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
        ctx.drawImage(this._zGlyph, px * scale, py * scale, 3 * scale, 3 * scale);
      }
      ctx.globalAlpha = 1;
    }
  }
}
