# Wicca, la gatita negra pixel art (estado al 25/10/2026)

Vista previa publicada: https://claude.ai/artifact/H6LE4gtc4iQ4aDypUTmHz8
(se abre también sin servidor: `demo/gatita-preview.html`)

## Qué está aprobado
- **Sentada (idle):** copiada píxel a píxel de la imagen original. Parpadeo y movimiento de cola.
- **Ojos:** finos, 1×2 px, verde salvia en dos tonos (`g` #b9d77e arriba, `h` #7aa34f abajo).
- **Orejas:** un píxel rosa (`p` #e08fa0) en el centro de cada oreja.
- **Toda negra** (`#` #1c1b1f). Sin collar.
- **Caminata (8 frames):** cabeza como sentada que se cierra redondeada abajo (casi triángulo),
  pelo hacia adentro bajo la barbilla, lomo recto, cuerpo alto y parejo (versión "cúbica",
  Gabriel prefirió esta a la de esquinas redondeadas). Patitas tipo frijolito de 2 px que
  asoman 2 px bajo el cuerpo; las lejanas en gris `d`. Cola de 3 px que se balancea, rebote de 1 px.
- **Dormir:** una sola pose, enrollada, sin cola visible, base plana apoyada en el piso,
  carita redondeada (mejilla 1 px). Respira y mueve una oreja. Z flotando.

## Qué se descartó
- Salto, collar naranja, pose de dormir con patita, líneas de contorno gris al dormir,
  ojos cuadrados 2×2, patas largas con pie.

## Archivos
- `tools/gen_cat2.py` genera todos los frames (`python3 tools/gen_cat2.py` imprime los arrays JS;
  `python3 tools/gen_cat2.py png salida.png` hace una hoja de frames).
- `src/pets/black-cat.js` paleta, frames y animaciones (pegar ahí la salida del generador).
- `src/Pet.js`, `src/registry.js`, `src/sprite.js`, `src/index.js` borrador del motor
  (canvas, estados sit/walk/sleep, autoplay, say()). Sin dependencias.
- `tools/preview.tpl.html` plantilla de la vista previa; `/*BUNDLE*/` se reemplaza con el código de src/.

## Próximos pasos
1. Seguir ajustando sprites si Gabriel quiere (la caminata es lo último que se tocó).
2. Gabriel debe crear un repo vacío en GitHub (p. ej. `pixel-pets`) para subir la librería.
3. Recién entonces armar la librería: README, package.json, demo, build.
