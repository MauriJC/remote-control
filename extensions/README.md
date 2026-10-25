# Extensiones para Chromium (netbook)

Colocá acá las extensiones **desempaquetadas**: cada una en **su propia subcarpeta** con un `manifest.json` adentro.

Ejemplos de nombres (cualquiera sirve; el proyecto detecta todas las carpetas válidas):

- `uBlock0.chromium/` — zip Chromium de [uBlock releases](https://github.com/gorhill/uBlock/releases)
- `h264ify/` — [h264ify](https://github.com/erkserkserks/h264ify)

No se versionan en git (tamaño / licencia). Descargá los `.crx` o cloná los repos de release y extraé el contenido en estas carpetas.

Alternativa: definí rutas absolutas en `.env`:

```env
EXTENSION_PATHS=/path/to/ublock,/path/to/h264ify
```

Si no hay extensiones, Chromium igual arranca; solo perdés optimización de CPU/ads.
