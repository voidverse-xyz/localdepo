// Vendor CSS first so our globals.css can override it (e.g. resize handle).
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './globals.css';
import { APP } from '@/core/constants.js';

export const metadata = {
  title: APP.NAME,
  description: APP.TAGLINE,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
