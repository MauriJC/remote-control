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
# Extensiones: uBO Lite desde https://github.com/uBlockOrigin/uBOL-home/releases (ver extensions/README.md)
LAUNCH_BROWSER=true pnpm start
```

Criterio: Chromium headed en el monitor, perfil en `USER_DATA_DIR`. Con `PLAYER_MODE=fake` la PWA controla el fake; con `youtube` (default si `LAUNCH_BROWSER=true`) lee estado del tab.

## Etapa 3 — Estado live de YouTube

Con `LAUNCH_BROWSER=true` (default `PLAYER_MODE=youtube`):

```bash
pnpm start
```

1. Abrí un video en el Chromium que levanta el server (o dejá la URL de inicio en `BROWSER_START_URL`).
2. PWA conectada → deberías ver título, `playing`, tiempo, etc.
3. **Pausá en el teclado del PC** → en ~1 s el celular refleja el cambio (poll + broadcast).

Para seguir probando el fake sin YouTube: `PLAYER_MODE=fake` en `.env`.

## Roadmap

| Etapa | Estado |
|-------|--------|
| 1 LAN + fake player | Hecho |
| 2 Chromium + extensiones | Hecho |
| 3 Leer estado YouTube | Hecho (poll 1s + fixture tests) |
| 4 Play/pause real | Pendiente |

Detalle en [plan.md](./plan.md).
