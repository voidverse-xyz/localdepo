'use client';

import { useState } from 'react';

/** Service icon: image if provided, otherwise a letter avatar. Shared by tile + list. */
export default function ServiceIcon({ service, size = 40 }) {
  // Track per-src load failures so a dead favicon (e.g. a discovered service
  // whose host has no /favicon.ico) falls back to the letter avatar instead of
  // rendering a broken-image glyph.
  const [failedSrc, setFailedSrc] = useState(null);

  if (service.icon && service.icon !== failedSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="icon"
        src={service.icon}
        alt=""
        width={size}
        height={size}
        onError={() => setFailedSrc(service.icon)}
      />
    );
  }

  const letter = (service.name || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <span className="icon icon--letter" style={{ width: size, height: size, fontSize: size * 0.45 }}>
      {letter}
    </span>
  );
}
