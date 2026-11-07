'use client';

/** Bottom layer: solid (or CSS gradient) color fill. */
export default function ColorLayer({ value }) {
  return <div className="bg-layer" style={{ background: value }} />;
}
