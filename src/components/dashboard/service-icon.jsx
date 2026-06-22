'use client';

/** Service icon: image if provided, otherwise a letter avatar. Shared by tile + list. */
export default function ServiceIcon({ service, size = 40 }) {
  if (service.icon) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="icon" src={service.icon} alt="" width={size} height={size} />;
  }
  const letter = (service.name || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <span className="icon icon--letter" style={{ width: size, height: size, fontSize: size * 0.45 }}>
      {letter}
    </span>
  );
}
