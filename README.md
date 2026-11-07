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
docker compose -f compose.prod.yaml up -d --build
```

Open `http://<host>:3000`. Click **Edit**, enter the admin password, then
**Scan network** to discover services.

> The production compose uses host networking (`network_mode: host`) so the
> scanner can reach the LAN. To scan a specific range instead, set `SCAN_CIDR`
> (e.g. `192.168.1.0/24`).

Two container build files back this:

- `Containerfile` — optimized multi-stage **production** image (`next build` +
  standalone output, non-root).
- `Containerfile.local` — **development** image that runs `next dev` with hot reload.

## Configuration (env)

| Variable         | Required | Description                                            |
| ---------------- | -------- | ------------------------------------------------------ |
| `ADMIN_PASSWORD` | yes      | Password to unlock editing.                            |
| `SESSION_SECRET` | yes      | Secret used to sign the session cookie.                |
| `SCAN_CIDR`      | no       | Subnet to scan; auto-detected from the host if unset.  |
| `DATA_DIR`       | no       | Where config + uploads live (default `/data`).         |
| `DEV_PORT`       | no       | Development host port (default `3001`).               |
| `PORT`           | no       | Production host port (default `3000`).                |

Compose passes `SCAN_CIDR` from `.env` into the container. Set it for LAN scans
in development, where bridge networking cannot detect the host's subnet.
Production requires nonempty `ADMIN_PASSWORD` and `SESSION_SECRET` values.

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

The app uses Next.js 16, React 19, and Tailwind CSS 4. Local tooling requires
Node.js 22 or newer; the container images supply Node.js 22.

Everything runs through Docker (no host Node required). The dev compose builds
`Containerfile.local` and runs `next dev`; **Compose watch** syncs your edits into
the running container for hot reload:

```bash
cp .env.example .env        # set ADMIN_PASSWORD, SESSION_SECRET, and SCAN_CIDR
docker compose up --build --watch app
```

Then open `http://<host>:3001` (or the port set by `DEV_PORT`). Source and public
assets hot-reload; configuration changes restart the service. Changes to either
package manifest or `Containerfile.local` rebuild the image automatically.

Without watch (plain build + run):

```bash
docker compose up --build app
```

Run the unit tests in the running development service:

```bash
docker compose exec app npm test
```

HTTP integration tests cover authentication, service/layout persistence, and
uploaded-image routes. Run these only against a disposable test instance: they
change its grid layout and leave an uploaded test image behind.

```bash
docker compose exec \
  -e TEST_BASE_URL=http://127.0.0.1:3000 \
  -e TEST_ADMIN_PASSWORD='<test-admin-password>' \
  app npm run test:integration
```

To include fake services for discovery testing:

```bash
docker compose -f compose.yaml -f compose.fixtures.yaml up -d --build
```

### Upgrading the Compose setup

The default file is now `compose.yaml`, the production file is
`compose.prod.yaml`, and the service is named `app`. Stop an existing deployment
with its previous Compose files before upgrading so two instances do not write
the same config. Both setups continue to use `./data:/data`, preserving existing
config and uploads. The default development host port changes from 3000 to 3001;
set `DEV_PORT=3000` to use the previous port.

### Code style

JavaScript uses two-space indentation, single quotes, semicolons, and trailing
commas in multiline lists. JSX with more than three props uses one prop per line.
Keep shared UI text in `STRINGS` and effect-specific labels in their catalog files.

`npm run lint` checks source, tests, and JavaScript configuration files and fails
on warnings. Run `npm run lint:fix` in a checkout with dependencies installed to
apply automatic style fixes, then review the diff. To check through Docker:

```bash
docker compose run --rm --build app npm run lint
```

Lint rules live in `eslint.config.mjs`. ESLint stays on the latest 9.x release
while `eslint-plugin-react` does not support ESLint 10. The scoped `minimatch`
override keeps TypeScript-ESLint's transitive matcher on a patched release until
its declared dependency range includes that release.

> Note: this repo's working directory is on a filesystem that doesn't support
> symlinks, so `npm install` against a bind mount fails. Dependency install and
> `next build` therefore happen **inside** the image (Docker's overlay fs), which
> is exactly what the Containerfiles do.
