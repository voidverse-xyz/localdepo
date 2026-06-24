'use client';

import { Pencil, X } from 'lucide-react';
import { STRINGS } from '@/core/constants.js';
import ServiceIcon from './service-icon.jsx';

/**
 * A single service tile. In view mode it's a link that opens the service; in
 * edit mode it exposes edit + remove-from-grid controls and is draggable by
 * react-grid-layout. Removing only takes the tile off the grid — the service
 * itself stays in the master list.
 */
export default function ServiceTile({ service, editMode, onEdit, onRemoveFromGrid }) {
  // Per-service colour overrides; empty values fall back to the theme defaults.
  const style = {
    background: service.bg || undefined,
    color: service.fg || undefined,
  };

  const body = (
    <>
      <ServiceIcon service={service} size={44} />
      <span className="tile__name">{service.name}</span>
    </>
  );

  return (
    <div className={`tile${editMode ? ' tile--edit' : ''}`}>
      {editMode ? (
        <div className="tile__inner" style={style}>{body}</div>
      ) : (
        <a className="tile__inner" style={style} href={service.url} target="_blank" rel="noreferrer noopener">
          {body}
        </a>
      )}

      {editMode ? (
        <div className="tile__actions no-drag">
          <button className="tile__btn" onClick={() => onEdit(service)} title={STRINGS.EDIT} aria-label={STRINGS.EDIT}>
            <Pencil size={14} />
          </button>
          <button
            className="tile__btn tile__btn--danger"
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
