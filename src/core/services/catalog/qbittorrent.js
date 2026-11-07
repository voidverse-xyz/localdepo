import { defineService, fp } from '../service-definition.js';

export default defineService({
  id: 'qbittorrent',
  name: 'qBittorrent',
  ports: [8080],
  match: (p) => fp.ok(p) && fp.body(p, /qbittorrent/i),
});
