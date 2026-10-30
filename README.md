# YouTube Remote Control

Control remoto LAN: PWA en el teléfono, servidor Node, player (fake hoy; YouTube en etapas 3–4).

## Desarrollo (PC)

```bash
pnpm install
pnpm exec playwright install chromium
cp .env.example .env
pnpm build:web
pnpm test
pnpm start
```

PWA: `http://localhost:3000` — token = `AUTH_TOKEN` del `.env`.

## Etapa 2 — Chromium en la netbook

En Mint/XFCE (VGA):

```bash
./scripts/setup-display.sh
# YouTube estable: NO cargar uBO en Playwright Chromium (ver extensions/README.md)
# LOAD_EXTENSIONS=true  # solo si aceptás riesgo de error ~40s o usás Chrome real
LAUNCH_BROWSER=true pnpm start
```

Criterio: Chromium headed en el monitor, perfil en `USER_DATA_DIR`. **Sin `LOAD_EXTENSIONS=true`** el video aguanta reproducción larga; uBO vía flags suele cortar a ~40–45s.

## Etapa 3 — Estado live de YouTube

Con `LAUNCH_BROWSER=true` (default `PLAYER_MODE=youtube`):

```bash
pnpm start
```

1. Abrí un video en el Chromium que levanta el server (o dejá la URL de inicio en `BROWSER_START_URL`).
2. PWA conectada → deberías ver título, `playing`, tiempo, etc.
3. **Pausá en el teclado del PC** → en ~1 s el celular refleja el cambio (poll + broadcast).

Para seguir probando el fake sin YouTube: `PLAYER_MODE=fake` en `.env`.

## Etapa 4 — Play / pause desde el teléfono

Con `LAUNCH_BROWSER=true` y `PLAYER_MODE=youtube` (default al lanzar browser):

1. Abrí un **video** en el Chromium del server (`watch?v=…`).
2. Conectá la PWA con el token.
3. **Play** / **Pause** en el celular → el video en el monitor debe responder; el estado en la PWA se actualiza (ack + poll).

Sin adblock en el TV (ver [extensions/README.md](./extensions/README.md)).

## Etapa 5 — Seek, volumen, fullscreen

Con la PWA conectada y un video en reproducción:

1. **Time** — arrastrá el slider y soltá; el player salta a ese segundo.
2. **Volume** — slider 0–100 (desmutea si hace falta).
3. **Fullscreen** — fullscreen **de YouTube** (botón del player / tecla `f`), no el API del `<video>` (evita recortes raros).

Volvé a buildar la PWA tras cambios en `web/`: `pnpm build:web`.

## Roadmap

| Etapa | Estado |
|-------|--------|
| 1 LAN + fake player | Hecho |
| 2 Chromium headed + perfil | Hecho |
| 3 Leer estado YouTube | Hecho (poll 1s + fixture tests) |
| 4 Play/pause real | Hecho |
| 5 Seek, volumen, fullscreen | Hecho |
| 6 Abrir video desde el teléfono + 480p | Pendiente |

Detalle en [plan.md](./plan.md).
