'use client';

/** Top layer: readability scrim (dim + optional blur) so tiles stay legible. */
export default function OverlayLayer({ dim, blur }) {
  const style = {
    background: `rgba(0, 0, 0, ${dim ?? 0})`,
    backdropFilter: blur ? `blur(${blur}px)` : 'none',
    WebkitBackdropFilter: blur ? `blur(${blur}px)` : 'none',
  };
  return <div className="bg-layer" style={style} />;
}
