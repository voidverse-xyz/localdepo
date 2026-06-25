'use client';

import { Pencil, X } from 'lucide-react';
import { STRINGS } from '@/core/constants.js';
import { clamp } from '@/lib/math.js';
import ServiceIcon from './service-icon.jsx';

const INNER =
  'flex flex-col items-center justify-center gap-2 w-full h-full p-2.5 rounded ' +
  'bg-surface border border-line shadow-card backdrop-blur text-center ' +
  'transition-[border-color,transform] duration-150 hover:border-accent hover:-translate-y-0.5';

const BTN =
  'inline-flex items-center justify-center w-6 h-6 rounded-[7px] border border-line ' +
  'bg-surface-solid text-fg leading-none';

/** Render a `#rrggbb` background at the given opacity (0–100) as an `rgba()` string. */
function bgColor(hex, opacity) {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex || '');
  if (!match) return hex || undefined; // non-hex value: use as-is, no opacity
  const rgb = parseInt(match[1], 16);
  const percent = Number.isFinite(opacity) ? opacity : 100;
  const alpha = clamp(percent, 0, 100) / 100;
  return `rgba(${(rgb >> 16) & 255}, ${(rgb >> 8) & 255}, ${rgb & 255}, ${alpha})`;
}

/**
 * A single service tile. In view mode it's a link that opens the service; in
 * edit mode it exposes edit + remove-from-grid controls and is draggable by
 * react-grid-layout. Removing only takes the tile off the grid — the service
 * itself stays in the master list.
 */
export default function ServiceTile({ service, editMode, onEdit, onRemoveFromGrid }) {
  // Per-service colour overrides; empty values fall back to the theme defaults.
  const style = {
    background: service.bg ? bgColor(service.bg, service.bgOpacity) : undefined,
    color: service.fg || undefined,
  };

  const body = (
    <>
      <ServiceIcon service={service} size={44} />
      <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold">
        {service.name}
      </span>
    </>
  );

  const innerClass = `${INNER}${editMode ? ' border-dashed cursor-grab' : ''}`;

  return (
    <div className="relative h-full w-full">
      {editMode ? (
        <div className={innerClass} style={style}>
          {body}
        </div>
      ) : (
        <a className={innerClass} style={style} href={service.url} target="_blank" rel="noreferrer noopener">
          {body}
        </a>
      )}

      {editMode ? (
        <div className="no-drag absolute right-1.5 top-1.5 flex gap-1">
          <button className={BTN} onClick={() => onEdit(service)} title={STRINGS.EDIT} aria-label={STRINGS.EDIT}>
            <Pencil size={14} />
          </button>
          <button
            className={`${BTN} text-danger`}
            onClick={() => onRemoveFromGrid(service)}
            title={STRINGS.REMOVE_FROM_GRID}
            aria-label={STRINGS.REMOVE_FROM_GRID}
          >
            <X size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
