# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Quien mira YouTube en la netbook (monitor VGA) y tiene el teléfono en la mano, en la misma LAN. El uso fuerte es de una mano, con el pulgar, a menudo en una pieza donde la luz fuerte es el monitor. La misma persona sigue depurando desde el teléfono.

## Product Purpose

El teléfono controla la reproducción de YouTube que corre en otra máquina y muestra el estado en vivo. El éxito es play, pausa, seek y volumen sin tocar el teclado de la netbook. La imagen no viaja al teléfono.

## Positioning

No es la app de YouTube ni un player. Es un control de transporte sobre un único player remoto: el teléfono empuja comandos y recibe estado, incluso cuando la pausa ocurrió en la netbook.

## Operating Context

PWA en el teléfono, servidor Node en la netbook, Chromium con YouTube en el monitor. Un token de LAN abre el canal. Durante un video, lo que importa es el transporte. El JSON del estado queda en la misma pantalla, legible, sin un toque extra.

## Capabilities and Constraints

Comandos: play, pause, seek, setVolume, fullscreen, openUrl, skipAd. Estado en vivo: playing, buffering, title, videoId, currentTime, duration, volume, adPlaying, adSkippable, quality, error. No hay miniatura. Durante un anuncio el seek se deshabilita. Saltar aparece solo cuando adSkippable es verdadero.

Interfaz en español. Un solo control de play/pausa según `playing`. Token y “Abrir en el TV” no ocupan la zona del pulgar; viven con el diagnóstico. El JSON permanece visible en monospace.

Stack fijo: TypeScript y Vite, sin React, Vue, Tailwind ni app nativa.

## Evidence on Hand

Contrato en `src/protocol.ts`. La UI actual (`web/index.html`, `web/style.css`) es un formulario de depuración: token, botones, sliders y un `<pre>` con el JSON. No hay marca, logo ni paleta previa que conservar. No inventar miniaturas, métricas ni funciones que el protocolo no tiene.

## Product Principles

- El transporte manda: play/pausa, tiempo y volumen ocupan la zona del pulgar.
- La imagen se queda en el monitor. El título es una línea de contexto.
- El diagnóstico no se esconde. El JSON se lee en la misma pantalla, debajo del control.
- La pantalla del teléfono no debe ser una lámpara en la pieza.
- Un objetivo grande, alcanzable con el pulgar, vale más que un panel de botones.
