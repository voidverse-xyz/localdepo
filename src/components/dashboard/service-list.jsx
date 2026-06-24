'use client';

import { memo, useMemo, useState } from 'react';
import { Pencil, Trash2, LayoutGrid } from 'lucide-react';
import ServiceIcon from './service-icon.jsx';
import { STRINGS } from '@/core/constants.js';

/**
 * One list row. Memoized so that toggling a single service's grid membership
 * only re-renders that row — not the whole (potentially large) list. This keeps
 * the "Add to grid" highlight snappy. All callbacks from the parent are stable.
 */
const ServiceRow = memo(function ServiceRow({
  service,
  editMode,
  authed,
  onGrid,
  onEdit,
  onDelete,
  onAddToGrid,
  onRemoveFromGrid,
}) {
  const body = (
    <>
      <ServiceIcon service={service} size={32} />
      <span className="list__name">{service.name}</span>
    </>
  );

  return (
    <li className="list__row">
      {editMode ? (
        <div className="list__main">{body}</div>
      ) : (
        <a className="list__main" href={service.url} target="_blank" rel="noreferrer noopener">
          {body}
        </a>
      )}

      {authed && editMode ? (
        <div className="list__actions">
          <button
            className="btn btn--ghost btn--icon"
            onClick={() => onEdit(service)}
            title={STRINGS.EDIT}
            aria-label={STRINGS.EDIT}
          >
            <Pencil size={16} />
          </button>
          <button
            className={`btn btn--ghost btn--icon${onGrid ? ' btn--active' : ''}`}
            onClick={() => (onGrid ? onRemoveFromGrid(service) : onAddToGrid(service))}
            title={onGrid ? STRINGS.REMOVE_FROM_GRID : STRINGS.ADD_TO_GRID}
            aria-label={onGrid ? STRINGS.REMOVE_FROM_GRID : STRINGS.ADD_TO_GRID}
            aria-pressed={onGrid || undefined}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className="btn btn--ghost btn--icon btn--danger"
            onClick={() => onDelete(service)}
            title={STRINGS.DELETE}
            aria-label={STRINGS.DELETE}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : null}
    </li>
  );
});

/**
 * The master catalog. Every service lives here; the grid is a curated subset
 * promoted from this list.
 *
 * - Search filters by name/url.
 * - Mutating controls only render for an unlocked (authed) session in edit mode.
 */
export default function ServiceList({
  services,
  editMode,
  authed,
  gridIds,
  onEdit,
  onDelete,
  onAddToGrid,
  onRemoveFromGrid,
}) {
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter(
      (s) => !q || [s.name, s.url].some((v) => (v || '').toLowerCase().includes(q)),
    );
  }, [services, query]);

  return (
    <div className="list-wrap">
      <input
        className="field list__search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={STRINGS.SEARCH}
        aria-label={STRINGS.SEARCH}
      />

      {rows.length === 0 ? (
        <p className="list__empty">{query ? 'No matches.' : STRINGS.NO_SERVICES}</p>
      ) : (
        <ul className="list">
          {rows.map((service) => (
            <ServiceRow
              key={service.id}
              service={service}
              editMode={editMode}
              authed={authed}
              onGrid={Boolean(gridIds?.has(service.id))}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddToGrid={onAddToGrid}
              onRemoveFromGrid={onRemoveFromGrid}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
