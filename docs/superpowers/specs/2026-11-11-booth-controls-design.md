# Controles que se ofrecen al toque

## Objetivo

En la cabina, tres controles se leen como lo que son. El campo de «Abrir en el TV», vacío y enfocado, muestra que está listo para escribir. **Abrir** se lee como un sello. **Pantalla completa** se lee como una tecla chica de metal.

El pozo, la marcha, el volumen, **Saltar**, el JSON, los colores, las texturas y los comandos quedan como están.

## Dónde vive

El cambio está en `web/index.html` y `web/style.css`. `web/main.ts` no se toca.

Siguen igual la habilitación al conectar, Enter en el campo disparando Abrir, y el estado «Pegá una URL de YouTube» cuando el campo está vacío. **Pantalla completa** conserva `id="fullscreen"`, `type="button"` y el texto **Pantalla completa**. **Abrir** conserva `id="open-url"`, `type="button"` y el texto **Abrir**.

## Pantalla completa

El botón deja la clase `mark-btn` y usa `transport` más un modificador `key-secondary`.

Comparte con la marcha el metal, el canto de `1px` `#111`, el brillo interior y el labio `0 3px 0 #111`. Al pulsar, baja `3px` y el labio desaparece, con la misma regla `:active:not(:disabled)` de `.transport`. `min-height` es `2.55rem` y el tipo es `1.05rem`, con el tracking de `0.16em` de la marcha. Queda debajo del volumen y arriba de la hoja.

`.mark-btn` se borra: no tiene otro uso.

## Abrir

El botón deja el subrayado de `.bench button` y usa la clase `stamp`. Esa clase gana en borde, fondo, tipo y sombra, así que la línea del campo no le queda debajo.

Es un bloque de tinta `#1d1918` con el tipo en color placa `#e4dccb`, Barlow Condensed a `1.05rem`, mayúsculas y tracking `0.14em`. Borde `1px` `#111`, brillo `inset 0 1px 0 rgb(255 255 255 / 0.2)` y labio `0 2px 0 #111`. Al pulsar, y solo si no está deshabilitado, baja `2px`. `min-height` es `2.5rem`. La fila sigue con `align-items: end`: el sello apoya su base en la línea del campo, no en el rótulo.

## Campo

Los dos campos de la hoja, con `:focus`, pasan la línea de abajo de `1px` a `2px` en tinta `#1d1918`. Al perder el foco, la línea vuelve a `1px`. El cursor sigue en tinta. Esto vale con el campo vacío o con texto. Un toque en el teléfono cuenta como `:focus`. El contorno ámbar sigue en `:focus-visible`.

En el enlace, el `placeholder` sigue siendo `youtube.com/watch?v=… o el id`. Vacío y sin foco, se ve en `#5c4e38`. Vacío y con `:focus`, `:focus::placeholder` lo esconde con `color: transparent` y la línea queda libre para el cursor.

La misma frase vive además en un `span` dentro del `label` de «Abrir en el TV», siempre visible, en Courier y en su caja original (`text-transform: none`). El rótulo de la hoja sigue en mayúsculas; el ejemplo no. Con el campo vacío y desenfocado se leen las dos: la del rótulo y la del placeholder. Al enfocar, queda solo la del rótulo.

El token no tiene placeholder ni ejemplo. Solo gana la línea de `2px` al enfocarse.

## Estados

Desconectados, la tecla y el sello usan la opacidad `0.55` que ya tienen los controles deshabilitados, y no se hunden. Conectados, los dos se pueden pulsar.

`prefers-reduced-motion: reduce` ya anula la transición de `.transport`, así que la tecla chica queda cubierta. El sello entra en esa misma consulta.

`button:focus-visible` e `input:focus-visible` siguen con el contorno ámbar.

## Comprobación

No hay lógica nueva. La prueba es visual:

- enlace vacío y enfocado: sin placeholder dentro de la línea, con cursor, línea de `2px` y el ejemplo todavía bajo el rótulo
- enlace vacío y desenfocado: el placeholder vuelve, y el ejemplo del rótulo sigue
- token enfocado: línea de `2px`
- **Abrir** se ve como sello y se hunde al pulsar
- **Pantalla completa** se ve como tecla chica y se hunde `3px`
- sin conexión, los dos están atenuados y no se hunden
