# Extensiones para Chromium (netbook / Playwright)

## Decisión de producto: sin adblock en el TV

**uBO / adblock no es viable** con YouTube estable en Chromium (ni vía `LOAD_EXTENSIONS`, ni en perfil Chrome): el video suele cortar ~40–50 s. Para el control remoto priorizamos **playback largo** → **`LOAD_EXTENSIONS=false`** (default) y **sin bloqueadores en el navegador del TV**. Alternativas: YouTube Premium, bloqueo DNS en el router (Pi-hole, etc.).

El resto de este doc queda como referencia técnica si probás extensiones (p. ej. h264ify); no es el camino recomendado para uBO.

Colocá acá extensiones **desempaquetadas**: cada una en **su propia subcarpeta** con un `manifest.json` adentro. El proyecto detecta automáticamente todas las subcarpetas válidas bajo `extensions/`.

**No se versionan en git** (tamaño y licencias). Ver `.gitignore`.

## Playwright Chromium vs Google Chrome

El binario **Chromium de Playwright** (default, sin `BROWSER_CHANNEL`) **no es** el Chrome de tu PC:

| Acción | Playwright Chromium | `BROWSER_CHANNEL=chrome` |
|--------|---------------------|---------------------------|
| Chrome Web Store | *La instalación no está habilitada* | Sí |
| Cargar descomprimida en `chrome://extensions` | Suele decir “cargada” pero la **lista queda vacía** | Sí, persiste en el perfil |
| uBO vía `extensions/` + `LOAD_EXTENSIONS=true` | **Sí** (forma soportada por Playwright) | También |

Para uBO en el TV con Playwright, usá la carpeta `extensions/` abajo. Para instalar “como en el navegador de todos los días”, usá Chrome real.

## Instalación manual (solo con Google Chrome)

1. `.env`: `BROWSER_CHANNEL=chrome`, `LOAD_EXTENSIONS=false`, perfil aparte p. ej. `USER_DATA_DIR=./data/chrome-tv-profile`.
2. `pnpm start` → ventana de **Google Chrome** (tenelo instalado).
3. Store o `chrome://extensions` → Cargar descomprimida (uBO Lite).
4. Afiná uBO en YouTube (modo **Óptimo**) y probá playback >2 min.

## uBlock Origin Lite (MV3) — vía carpeta `extensions/`

Playwright usa Chromium reciente, que **no carga** uBlock clásico (Manifest V2). Usá **uBO Lite**:

1. Abrí **[uBlockOrigin/uBOL-home — Releases](https://github.com/uBlockOrigin/uBOL-home/releases)** (release más reciente).
2. Descargá el asset **`uBOLite_….chromium.zip`** (no Firefox `.xpi`, no Edge-only si no es el zip chromium).
3. Descomprimí en una carpeta, por ejemplo `extensions/uBOLite.chromium/`.
4. Comprobá que exista `extensions/uBOLite.chromium/manifest.json` con `"manifest_version": 3`.

No uses `uBlock0_….chromium.zip` de [gorhill/uBlock](https://github.com/gorhill/uBlock/releases): es MV2 y en Chromium nuevo falla con “error al cargar la extensión”.

## h264ify (opcional)

Fuerza h264 en lugar de VP9 (útil en Celeron / netbook). Buscá un build compatible con Chromium MV3 o desempaquetado reciente:

- [erkserkserks/h264ify](https://github.com/erkserkserks/h264ify)

Si no carga, podés omitirlo al principio; uBO Lite ya ayuda con ads.

## Rutas custom

```env
EXTENSION_PATHS=D:\ruta\uBOLite.chromium,D:\ruta\h264ify
```

Rutas separadas por coma. Si no hay extensiones, `LAUNCH_BROWSER=true` igual abre Chromium.

## Después de cambiar extensiones

Si ya arrancaste con un perfil viejo, borrá el perfil y reiniciá:

```powershell
Remove-Item -Recurse -Force .\data\chromium-profile
pnpm start
```

En consola deberías ver: `Loading extensions: [ '...' ]`. Verificá en `chrome://extensions`.

## Reproducción estable en YouTube (importante)

**Confirmado:** uBO Lite cargada con **`LOAD_EXTENSIONS=true`** (`--load-extension`) en **Playwright Chromium** suele romper el video a **~40–45 s** (*“Se produjo un error…”*, `net::ERR_BLOCKED_BY_CLIENT`). El remote control **no** es la causa; el bloqueador corta requests que el player necesita.

**Recomendado para control remoto + YouTube:**

| Objetivo | Config |
|----------|--------|
| Playback largo estable | No pongas `LOAD_EXTENSIONS=true` (default del proyecto) |
| uBO + Store / perfil normal | `BROWSER_CHANNEL=chrome`, perfil aparte, uBO en modo **Óptimo** en youtube.com |
| Ads sin uBO en el TV | Premium, Pi-hole/DNS en la red, etc. |

Ajustar el popup de uBO en un perfil Playwright **no** suele bastar: el fallo aparece igual con flags. Si insistís con uBO, probá **Chrome real** (`BROWSER_CHANNEL=chrome`), no el Chromium empaquetado de Playwright.

Tras cambiar estrategia, a veces conviene borrar `USER_DATA_DIR` y empezar limpio.
