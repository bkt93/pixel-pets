# pixel-pets

Mascotas pixel art con comportamiento para agregar a aplicaciones web. Sin dependencias:
los sprites están definidos como grillas de caracteres en código y se pintan en un `<canvas>`.

Primera mascota: **Wicca**, una gatita negra de ojos verdes que se sienta, camina y duerme.

> Estado: se están ajustando los sprites. La librería todavía es un borrador.
> Ver [NOTAS.md](NOTAS.md) para lo decidido hasta ahora y los próximos pasos.

## Ver la vista previa

Abrir `demo/gatita-preview.html` en el navegador (no necesita servidor).

## Editar los sprites

```sh
python3 tools/gen_cat2.py                  # imprime los frames como arrays JS
python3 tools/gen_cat2.py png hoja.png     # genera una hoja con todos los frames
```

Pegar la salida en `src/pets/black-cat.js`, dentro de `frames`.
