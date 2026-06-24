import { defineService, fp } from '../service-definition.js';

export default defineService({
  id: 'jellyfin',
  name: 'Jellyfin',
  ports: [8096],
  path: '/web',
  match: (p) => fp.ok(p) && (fp.body(p, /jellyfin/i) || fp.header(p, 'x-jellyfin-version')),
});
