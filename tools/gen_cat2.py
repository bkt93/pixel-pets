import math, sys
W, H = 32, 22
PAL = {'#': (28, 27, 31), 'g': (185, 215, 126), 'h': (122, 163, 79), 'p': (224, 143, 160), 'c': (255, 138, 31), 'd': (84, 79, 94), 'e': (110, 106, 120), '.': (235, 240, 245)}

def blank(): return [['.'] * W for _ in range(H)]
def stamp(g, rows, ox, oy):
    for r, line in enumerate(rows):
        for c, ch in enumerate(line):
            if ch != '.': g[oy + r][ox + c] = ch
def fill(g, r, c0, c1, ch='#'):
    for c in range(c0, c1 + 1): g[r][c] = ch

SIT = [
    ".....#.....#...............",
    "....#p#...#p#..............",
    "....#########..............",
    "...###########.............",
    "...###########.............",
    "..#############............",
    "..###g#####g###............",
    "..###h#####h###............",
    ".###############...........",
    ".###############...........",
    ".###############...........",
    ".###############...........",
    "#################..........",
    "#################..........",
    "#################..........",
    "#################..........",
    "#################..........",
    "#################..........",
    "#########################..",
    ".#########################.",
    "..#######################..",
]
def sit(v=None):
    rows = [list(r) for r in SIT]
    if v == 'blink':
        rows[6] = list("..#############............")
        rows[7] = list("..###h#####h###............")
    if v == 'tail':
        rows[17] = list("#################.......#..")
        rows[18] = list("#########################..")
        rows[19] = list(".########################..")
    g = blank(); stamp(g, [''.join(r) for r in rows], 3, H - len(rows)); return g

HEAD = [
    "...#.....#...",
    "..#p#...#p#..",
    "..#########..",
    ".###########.",
    "#############",
    "#############",
    "#####g####g##",
    "#####h####h##",
    "#############",
    ".###########.",
    "..#########..",
]

# Caminata: misma silueta que sentada (cabeza que se funde con el cuerpo, sin cuello,
# lados en escalones) pero de costado. Se define por columna: fila de arriba y de abajo.
X = 0   # corrimiento horizontal de todo el gato
# Cabeza: arriba igual que sentada, abajo se cierra redondeada (casi un triángulo).
WALK_HEAD = {0: [(20, 20), (26, 26)], 1: [(19, 21), (25, 27)], 2: [(19, 27)], 3: [(18, 28)],
             4: [(18, 28)], 5: [(17, 29)], 6: [(17, 29)], 7: [(17, 29)], 8: [(18, 28)], 9: [(19, 27)]}
# Cuerpo: lomo recto y pecho bajo la cabeza. Bajo la
# barbilla el pelo se mete hacia adentro para que se note la cabeza.
WALK_BODY = {7: (8, 16), 8: (7, 17), 9: (6, 18), 10: (6, 26), 11: (6, 26), 12: (6, 26),
             13: (6, 26), 14: (6, 26), 15: (6, 26), 16: (7, 25)}
WALK_OY = H - 19
WALK_FRAMES = 8
BOB = [0, 1, 1, 0, 0, 1, 1, 0]
TAILS = [   # columna de la cola por fila (de arriba hacia abajo), 3 px de grosor
    [3, 2, 2, 2, 2, 2, 3, 4, 5],
    [2, 2, 2, 2, 2, 2, 3, 4, 5],
    [1, 1, 1, 2, 2, 2, 3, 4, 5],
    [0, 0, 1, 1, 1, 2, 3, 4, 5],
]
TAIL_SEQ = [0, 1, 2, 3, 3, 2, 1, 0]

def leg_pose(phase):
    """Pasito de una patita en 8 fases: 5 apoyada yendo hacia atrás, 3 levantada volviendo."""
    if phase < 5: return [1, 1, 0, 0, -1][phase], 0
    return [-1, 0, 0][phase - 5], 1

def draw_leg(g, c, lift, ch):
    """Patita corta y redonda (frijolito) que asoma bajo el pelo de la panza."""
    bottom = H - 1 - lift
    for r in range(bottom - 2, bottom + 1):
        for cc in (c, c + 1):
            if g[r][cc] == '.': g[r][cc] = ch

def walk(i):
    g = blank()
    oy = WALK_OY - BOB[i]
    for r, c in enumerate(TAILS[TAIL_SEQ[i]]):
        fill(g, oy + r, X + c + 1, X + c + 3)
    for r, (a, b) in WALK_BODY.items(): fill(g, oy + r, X + a, X + b)
    for r, spans in WALK_HEAD.items():
        for a, b in spans: fill(g, oy + r, X + a, X + b)
    g[oy + 1][X + 20] = g[oy + 1][X + 26] = 'p'
    for c in (21, 26):
        g[oy + 6][X + c] = 'g'; g[oy + 7][X + c] = 'h'
    # patitas: primero las cercanas (negras), las lejanas (gris) solo se ven donde no hay otra
    for base, offset, ch in [(9, 4, '#'), (21, 6, '#'), (11, 0, 'd'), (23, 2, 'd')]:
        dx, lift = leg_pose((i + offset) % WALK_FRAMES)
        draw_leg(g, X + base + dx, lift, ch)
    return g

# Poses de dormir dibujadas a mano (filas 10 a 21 del frame).
CURLED = [
    "..................#.....#.......",
    ".................#p#...#p#......",
    ".........######..#########......",
    "......#####################.....",
    "....########################....",
    "...#########################....",
    "..#################ee###ee##....",
    "..##########################....",
    ".###########################....",
    ".###########################....",
    ".##########################.....",
    "##########################......",
]

def sleep_pose(rows, breath=False, ear=False):
    rows = [list(r) for r in rows]
    if ear:   # la oreja derecha se dobla un instante
        rows[0][24] = '.'
        rows[1][23:26] = list('.##')
    if breath:   # al exhalar todo lo que está sobre el piso baja 1 px
        top = rows[:8]
        rows = [list('.' * W)] + top[:-1] + rows[8:]
        rows[8] = [a if a != '.' else b for a, b in zip(rows[8], top[-1])]
    g = blank()
    stamp(g, [''.join(r) for r in rows], 0, H - len(rows))
    return g

def sleep(breath=False, ear=False): return sleep_pose(CURLED, breath, ear)

FR = {'sit': sit(), 'sitBlink': sit('blink'), 'sitTail': sit('tail'),
      **{f'walk{i + 1}': walk(i) for i in range(WALK_FRAMES)},
      'sleep1': sleep(), 'sleep2': sleep(True), 'sleepEar': sleep(ear=True)}

if sys.argv[1:2] == ['png']:
    from PIL import Image, ImageDraw
    s = 8; im = Image.new('RGB', ((W + 2) * s * 4, (H + 2) * s * 4), 'white'); d = ImageDraw.Draw(im)
    for k, n in enumerate(FR):
        ox, oy = (k % 4) * (W + 2) * s, (k // 4) * (H + 2) * s
        for r, row in enumerate(FR[n]):
            for c, ch in enumerate(row): d.rectangle([ox + c*s, oy + r*s, ox + c*s + s - 1, oy + r*s + s - 1], fill=PAL[ch])
    im.save(sys.argv[2])
else:
    for n, g in FR.items():
        print(f"    {n}: ["); [print(f"      '{''.join(r)}',") for r in g]; print("    ],")
