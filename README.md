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
# Copiá extensiones a extensions/ (ver extensions/README.md)
LAUNCH_BROWSER=true pnpm start
```

Criterio: Chromium headed en el monitor, perfil en `USER_DATA_DIR`, PWA sigue controlando el **FakeAdapter**.

## Roadmap

| Etapa | Estado |
|-------|--------|
| 1 LAN + fake player | Hecho |
| 2 Chromium + extensiones | En curso |
| 3 Leer estado YouTube | Pendiente |
| 4 Play/pause real | Pendiente |

Detalle en [plan.md](./plan.md).
