import { defineService, fp } from '../service-definition.js';

export default defineService({
  id: 'plex',
  name: 'Plex',
  ports: [32400],
  path: '/web',
  match: (p) => fp.ok(p) && (fp.header(p, 'x-plex-protocol') || fp.body(p, /plex/i)),
});
