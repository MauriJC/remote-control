# YouTube deja de reproducir ~40–45 s

## Síntoma

- En el monitor, el video **se congela** hacia el **segundo 40–45** (a veces con overlay *“Se produjo un error…”*).
- La PWA puede seguir mostrando `duration` correcta (p. ej. 76 min) pero `playing: false` y el tiempo clavado (~44 s).
- **No hace falta** tocar seek, volumen ni sliders del celular; puede pasar solo reproduciendo.

Ejemplo verificado: [ny3C3klmlFo](https://www.youtube.com/watch?v=ny3C3klmlFo).

## Qué **no** era

En el caso depurado (nov 2025):

| Descartado | Evidencia |
|------------|-----------|
| Comando `seek` / reload `&t=` desde la PWA | Solo `openUrl` al abrir; ningún `seek` en el server. |
| Duración mal leída (~44 s) | `getDuration()` devolvía la duración real (p. ej. 4567 s). |
| Bug de Etapa 6 (`openUrl`) | El fallo ocurre durante playback normal tras abrir el video. |

El **reproductor interno de YouTube** pasa a estado de error (`getPlayerState() === -1`); el remote solo **lee** ese estado por poll.

## Causas habituales (dos caminos distintos)

### 1. Bloqueadores (uBO, etc.)

uBlock u otras extensiones que bloquean requests del player → `net::ERR_BLOCKED_BY_CLIENT` y error ~40–45 s.

- Típico con **`LOAD_EXTENSIONS=true`** en Playwright Chromium.
- También puede afectar perfiles Chrome con uBO instalado a mano.

Ver [extensions/README.md](../extensions/README.md).

### 2. Detección de automatización (Playwright + Chrome)

Playwright lanza Chrome con flags de automatización por defecto:

- `--enable-automation` (barra *“Chrome está siendo controlado…”*).
- `navigator.webdriver === true`.

YouTube puede **cortar la reproducción** en el mismo rango de tiempo aunque **no** haya adblock. Esto ocurrió con:

```env
BROWSER_CHANNEL=chrome
LOAD_EXTENSIONS=false
PLAYER_MODE=youtube
```

## Solución en este repo

Para **`BROWSER_CHANNEL=chrome`** (y canales Edge equivalentes), `src/browser.ts`:

1. **`ignoreDefaultArgs`** incluye `--enable-automation` (además de `--disable-extensions` y `--no-sandbox` que ya usábamos).
2. **`--disable-blink-features=AutomationControlled`** en `args`.
3. **`addInitScript`**: oculta `navigator.webdriver` en páginas nuevas.

Reiniciá el server (`pnpm start`) después de actualizar; hace falta **cerrar y reabrir** la ventana de Chrome que levanta Playwright.

Comprobación rápida:

- La barra de “controlado por software automatizado” **no** debería aparecer (o debería desaparecer en lanzamientos nuevos).
- El mismo video debe pasar de 44 s sin congelarse.

## Si sigue fallando

1. Confirmá **`LOAD_EXTENSIONS=false`** y que el perfil no tenga uBO activo en `chrome://extensions`.
2. Probá perfil limpio: borrá `USER_DATA_DIR` y volvé a arrancar.
3. Compará **Chrome real** abierto a mano vs el que levanta el proyecto (misma red, mismo video).
4. Revisá consola del server: warnings de extensiones en `src/index.ts`.

## Referencia de código

- Lanzamiento TV / anti-detección: [`src/browser.ts`](../src/browser.ts) (`isBrandedChannel`, `launchTvBrowser`).
- Lectura de estado (no provoca el corte): [`src/youtube-adapter.ts`](../src/youtube-adapter.ts) (`refreshState`, poll 1 s).
