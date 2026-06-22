'use client';

import ServiceIcon from './service-icon.jsx';

/**
 * A single service tile. In view mode it's a link that opens the service; in
 * edit mode it exposes edit/delete controls and is draggable by react-grid-layout.
 */
export default function ServiceTile({ service, editMode, onEdit, onDelete }) {
  const body = (
    <>
      <ServiceIcon service={service} size={44} />
      <span className="tile__name">{service.name}</span>
      {service.category ? <span className="tile__cat">{service.category}</span> : null}
    </>
  );

  return (
    <div className={`tile${editMode ? ' tile--edit' : ''}`}>
      {editMode ? (
        <div className="tile__inner">{body}</div>
      ) : (
        <a className="tile__inner" href={service.url} target="_blank" rel="noreferrer noopener">
          {body}
        </a>
      )}

      {editMode ? (
        <div className="tile__actions no-drag">
          <button className="tile__btn" onClick={() => onEdit(service)} title="Edit" aria-label="Edit">
            ✎
          </button>
          <button
            className="tile__btn tile__btn--danger"
            onClick={() => onDelete(service)}
            title="Delete"
            aria-label="Delete"
          >
            ✕
          </button>
        </div>
      ) : null}
    </div>
  );
}
