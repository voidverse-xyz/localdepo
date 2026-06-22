'use client';

import ServiceIcon from './service-icon.jsx';
import { STRINGS } from '@/core/constants.js';

/** Compact list view. Rows are links in view mode, with controls in edit mode. */
export default function ServiceList({ services, editMode, onEdit, onDelete }) {
  return (
    <ul className="list">
      {services.map((service) => (
        <li key={service.id} className="list__row">
          {editMode ? (
            <div className="list__main">
              <ServiceIcon service={service} size={32} />
              <span className="list__name">{service.name}</span>
              <span className="list__cat">{service.category}</span>
            </div>
          ) : (
            <a className="list__main" href={service.url} target="_blank" rel="noreferrer noopener">
              <ServiceIcon service={service} size={32} />
              <span className="list__name">{service.name}</span>
              <span className="list__cat">{service.category}</span>
            </a>
          )}

          {editMode ? (
            <div className="list__actions">
              <button className="btn btn--ghost" onClick={() => onEdit(service)}>
                {STRINGS.EDIT}
              </button>
              <button className="btn btn--ghost btn--danger" onClick={() => onDelete(service)}>
                {STRINGS.DELETE}
              </button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
