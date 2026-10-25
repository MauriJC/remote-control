# Extensiones para Chromium (netbook)

Colocá acá las extensiones **desempaquetadas** (carpetas con `manifest.json`):

- `ublock-origin/` — uBlock Origin (bloqueo de ads en YouTube)
- `h264ify/` — fuerza h264 en lugar de VP9 (Bay Trail / Celeron)

No se versionan en git (tamaño / licencia). Descargá los `.crx` o cloná los repos de release y extraé el contenido en estas carpetas.

Alternativa: definí rutas absolutas en `.env`:

```env
EXTENSION_PATHS=/path/to/ublock,/path/to/h264ify
```

Si no hay extensiones, Chromium igual arranca; solo perdés optimización de CPU/ads.
