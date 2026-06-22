import { defineService, fp } from '../service-definition.js';

export default defineService({
  id: 'radarr',
  name: 'Radarr',
  category: 'Downloads',
  ports: [7878],
  match: (p) => fp.ok(p) && fp.body(p, /radarr/i),
});
