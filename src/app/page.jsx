import { readConfig } from '@/core/storage/config-store.js';
import Dashboard from '@/components/dashboard/dashboard.jsx';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const config = await readConfig();
  return <Dashboard initialConfig={config} />;
}
