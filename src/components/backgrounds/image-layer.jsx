'use client';

import { IMAGE_FIT } from '@/core/constants.js';

const SIZE_BY_FIT = {
  [IMAGE_FIT.COVER]: 'cover',
  [IMAGE_FIT.CONTAIN]: 'contain',
  [IMAGE_FIT.CENTER]: 'auto',
  [IMAGE_FIT.TILE]: 'auto',
};

/** Middle layer: a single background image. */
export default function ImageLayer({ path, fit, blur }) {
  if (!path) return null;
  const style = {
    backgroundImage: `url(${path})`,
    backgroundRepeat: fit === IMAGE_FIT.TILE ? 'repeat' : 'no-repeat',
    backgroundSize: SIZE_BY_FIT[fit] || 'cover',
    backgroundPosition: 'center',
    filter: blur ? `blur(${blur}px)` : 'none',
    transform: blur ? 'scale(1.06)' : 'none', // hide blurred edges
  };
  return <div className="bg-layer" style={style} />;
}
