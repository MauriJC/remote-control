# Extensiones para Chromium (netbook / Playwright)

Colocá acá extensiones **desempaquetadas**: cada una en **su propia subcarpeta** con un `manifest.json` adentro. El proyecto detecta automáticamente todas las subcarpetas válidas bajo `extensions/`.

**No se versionan en git** (tamaño y licencias). Ver `.gitignore`.

## uBlock Origin Lite (MV3) — recomendado

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
