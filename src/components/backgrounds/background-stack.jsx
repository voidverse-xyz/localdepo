'use client';

import ColorLayer from './color-layer.jsx';
import ImageLayer from './image-layer.jsx';
import EffectLayer from './effect-layer.jsx';
import OverlayLayer from './overlay-layer.jsx';

/**
 * Composes the four background layers (back to front). Every layer is
 * independently toggleable, so any combination can be active at once.
 */
export default function BackgroundStack({ background }) {
  if (!background) return null;
  const { color, image, effect, overlay } = background;

  return (
    <div className="bg-stack" aria-hidden="true">
      {color?.enabled ? <ColorLayer value={color.value} /> : null}
      {image?.enabled && image.path ? (
        <ImageLayer path={image.path} fit={image.fit} blur={image.blur} />
      ) : null}
      {effect?.enabled ? <EffectLayer type={effect.type} options={effect.options} /> : null}
      {overlay?.enabled ? <OverlayLayer dim={overlay.dim} blur={overlay.blur} /> : null}
    </div>
  );
}
