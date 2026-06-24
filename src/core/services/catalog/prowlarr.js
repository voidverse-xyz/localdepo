import { defineService, fp } from '../service-definition.js';

export default defineService({
  id: 'prowlarr',
  name: 'Prowlarr',
  ports: [9696],
  match: (p) => fp.ok(p) && fp.body(p, /prowlarr/i),
});
