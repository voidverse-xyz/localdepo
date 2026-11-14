import { defineService, fp } from '../service-definition.js';

export default defineService({
  id: 'sonarr',
  name: 'Sonarr',
  ports: [8989],
  match: (p) => fp.ok(p) && fp.body(p, /sonarr/i),
});
