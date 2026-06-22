# LocalDepo

Customizable, self-hosted navigation page for your home server. It **auto-discovers**
running services on your LAN (Jellyfin, Plex, Sonarr, …), shows each as a clickable
tile, and lets an admin rearrange, edit, and theme the dashboard — all persisted to a
single JSON file.

## Features

- **Auto-discovery** — scans your subnet and fingerprints known services.
- **Service plugins** — add a detectable service by dropping one file in
  `src/core/services/catalog/`.
- **Three view modes** — *custom* (free drag + resize, desktop-icon style),
  *grid* (auto-arranged), and *list*.
- **Admin editing** — add / edit / delete services and save layouts, all gated by
  an admin password (set via env). Viewing is open; editing requires unlock.
- **Composable backgrounds** — color + image + animated effect (space stars, rain)
  + a readability overlay, all active at once and individually adjustable.
- **Persistent** — config and uploads live in `/data` (mount it as a volume).

## Run in production

```bash
cp .env.example .env        # set ADMIN_PASSWORD and SESSION_SECRET
docker compose -f docker-compose.prod.yml up -d --build
```

Open `http://<host>:3000`. Click **Edit**, enter the admin password, then
**Scan network** to discover services.

> The production compose uses host networking (`network_mode: host`) so the
> scanner can reach the LAN. To scan a specific range instead, set `SCAN_CIDR`
> (e.g. `192.168.1.0/24`).

Two Dockerfiles back this:

- `Dockerfile` — optimized multi-stage **production** image (`next build` +
  standalone output, non-root).
- `Dockerfile.local` — **development** image that runs `next dev` with hot reload.

## Configuration (env)

| Variable         | Required | Description                                            |
| ---------------- | -------- | ------------------------------------------------------ |
| `ADMIN_PASSWORD` | yes      | Password to unlock editing.                            |
| `SESSION_SECRET` | yes      | Secret used to sign the session cookie.                |
| `SCAN_CIDR`      | no       | Subnet to scan; auto-detected from the host if unset.  |
| `DATA_DIR`       | no       | Where config + uploads live (default `/data`).         |

## Adding a service plugin

Create `src/core/services/catalog/<name>.js`:

```js
import { defineService, fp } from '../service-definition.js';

export default defineService({
  id: 'myapp',
  name: 'My App',
  category: 'Tools',
  ports: [1234],
  path: '/',                       // optional landing path
  match: (probe) => fp.ok(probe) && fp.body(probe, /myapp/i),
});
```

Then add it to the list in `src/core/services/registry.js`.

## Adding a background effect

Create `src/components/backgrounds/effects/<name>.jsx` exporting a component that
takes an `options` prop (use the `useCanvasAnimation` hook for canvas effects),
then register it in `src/components/backgrounds/effects/registry.js`.

## Architecture

- `src/core/` — framework-agnostic domain logic (storage, services, scanner,
  auth). Unit-testable without React/Next.
- `src/app/api/` — thin HTTP layer over `core/`.
- `src/components/`, `src/hooks/`, `src/lib/` — the UI.
- All strings, defaults, ports, and enums live in `src/core/constants.js`.

## Development

Everything runs through Docker (no host Node required). The dev compose builds
`Dockerfile.local` and runs `next dev`; **Compose watch** syncs your edits into
the running container for hot reload:

```bash
docker compose watch        # build, start, and live-sync code changes
```

Then open `http://localhost:3000`. Edits under `src/` and `public/` hot-reload;
changing `package.json` rebuilds the image automatically.

Without watch (plain build + run):

```bash
docker compose up --build
```

Run the unit tests (pure `core/` logic — no dependencies needed):

```bash
docker run --rm -v "$PWD":/app -w /app node:22-alpine npm test
```

> Note: this repo's working directory is on a filesystem that doesn't support
> symlinks, so `npm install` against a bind mount fails. Dependency install and
> `next build` therefore happen **inside** the image (Docker's overlay fs), which
> is exactly what the Dockerfiles do.
