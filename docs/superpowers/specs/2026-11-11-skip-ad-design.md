# Saltar anuncio desde el teléfono

## Objetivo

Cuando YouTube muestra un anuncio que ya se puede saltar, el teléfono muestra un botón **Saltar**, aparte de marcha y pausa. Al tocarlo, la netbook aprieta el control de saltar del player.

Mientras el anuncio no se puede saltar, el teléfono sigue mostrando **Anuncio** y el seek sigue bloqueado. No hay salto automático.

## Protocolo

`PlayerState` suma `adSkippable: boolean`. `emptyPlayerState` lo deja en `false`.

`Command` suma `{ name: "skipAd" }`, sin argumentos. El mismo nombre entra en `OutgoingCommand` del cliente.

`PlayerAdapter` suma `skipAd(): Promise<void>`. El bus lo despacha como el resto de comandos. `FakeAdapter` y los stubs de tests implementan el método.

`FakeAdapter.skipAd` lanza `No se puede saltar el anuncio`. El player en RAM no tiene control de saltar.

## Detección

`findYouTubeSkipButton(player)` vive en `src/youtube-ad-state.ts` y devuelve el nodo o `null`. `isYouTubeAdSkippable` es ese resultado distinto de `null`. Las dos son autocontenidas para `page.evaluate`, igual que `isYouTubeAdShowing`. La lectura y el clic usan el mismo finder.

Recorre los selectores en este orden y se queda con el primero que cumpla:

1. `.ytp-skip-ad-button`
2. `.ytp-ad-skip-button`
3. `.ytp-ad-skip-button-modern`
4. `.ytp-skip-ad-button__button`

Dentro de un selector, gana el primer nodo del documento. El nodo cuenta si `getBoundingClientRect()` tiene ancho y alto mayores que 0, no tiene `disabled`, y `aria-disabled` no es `"true"`. Si ninguno cumple, el resultado es `null`. Sin player, es `null`.

`refreshState` lee `adSkippable` junto con `adPlaying` y lo guarda en el estado. Un error de lectura usa `emptyPlayerState`, así que `adSkippable` vuelve a `false`.

## Comando

`YouTubeAdapter.skipAd` corre dentro de `withPage`. Llama al finder y hace `click()` sobre ese nodo. Si el finder devuelve `null`, lanza `No se puede saltar el anuncio`. Si la página está cargando, lanza `YouTube page is loading, try again`, igual que los otros comandos. Después de un clic que entra, llama a `refreshState`.

No se oculta **Saltar** antes de que esa lectura lo diga. Un segundo toque mientras el primero sigue en cola espera en el bus.

## Interfaz

El botón va en `web/index.html`, después de `#transport` y antes del volumen. `id="skip-ad"`, `type="button"`, texto **Saltar**. Empieza con el atributo `hidden`.

Usa la clase `transport` y un modificador `skip-ad` que solo baja `min-height` a `3.25rem`. El atributo `hidden` lo saca del layout, así que no deja hueco.

Se muestra solo cuando el cliente está conectado y `state.adSkippable` es verdadero. Al desconectar, se oculta. El toque manda `{ name: "skipAd" }`.

**Anuncio** en el pozo y el seek bloqueado durante `adPlaying` no cambian. El ack con error sigue pintando el texto en la línea de estado y la lámpara en rojo.

## Documentos que describen el contrato

`PRODUCT.md` incluye `skipAd` en los comandos y `adSkippable` en el estado, y deja de decir que el protocolo no cambia. `README.md` dice que **Saltar** aparece solo cuando YouTube ya dejó saltar el anuncio.

## Tests

`isYouTubeAdSkippable`:

- sin player, `false`
- botón visible y habilitado, `true`
- rectángulo de tamaño cero, `false`
- `disabled`, `false`
- `aria-disabled="true"`, `false`
- sin botón, `false`

`CommandBus`: `skipAd` llama a `adapter.skipAd()`. Si el adapter lanza, el ack vuelve `ok: false` con ese mensaje.

`YouTubeAdapter`, sobre `tests/fixtures/fake-player.html`:

- con `ad-showing` y sin botón, `adPlaying` es `true` y `adSkippable` es `false`
- con un `.ytp-skip-ad-button` visible y habilitado, `adSkippable` es `true` y `skipAd` le hace clic
- sin ese botón, `skipAd` rechaza con `No se puede saltar el anuncio`

El botón del teléfono se comprueba a mano: visible solo con `adSkippable`, oculto y sin hueco en el resto de los casos.
