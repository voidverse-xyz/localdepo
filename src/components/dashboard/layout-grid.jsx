'use client';

import RGL, { WidthProvider } from 'react-grid-layout/legacy';
import { GRID } from '@/core/constants.js';
import ServiceTile from './service-tile.jsx';

const GridLayout = WidthProvider(RGL);

/**
 * Geometry for a default tile slot: row-major placement (left-to-right, top-to-
 * bottom) for the Nth tile. Shared so the grid's fallback and the dashboard's
 * "add to grid" stay in lockstep.
 */
export function gridSlot(id, index) {
  const { w, h } = GRID.DEFAULT_TILE;
  const perRow = Math.max(1, Math.floor(GRID.COLUMNS / w));
  return {
    i: id,
    x: (index % perRow) * w,
    y: Math.floor(index / perRow) * h,
    w,
    h,
    ...GRID.MIN_TILE,
  };
}

/**
 * Build the controlled layout array for the on-grid services. Every service
 * passed here is already a grid member (the dashboard filters to services with
 * a saved `layout.grid` entry), so it reuses that geometry; the default-slot
 * fallback only covers the brief window before a freshly added entry arrives.
 */
function buildLayout(services, saved) {
  const byId = new Map((Array.isArray(saved) ? saved : []).map((item) => [item.i, item]));

  return services.map((service, index) => {
    const existing = byId.get(service.id);
    if (existing) {
      return {
        i: service.id,
        x: existing.x,
        y: existing.y,
        w: existing.w,
        h: existing.h,
        ...GRID.MIN_TILE,
      };
    }
    return gridSlot(service.id, index);
  });
}

/**
 * Free-placement, desktop-icon-style tile grid (single controlled layout).
 * Tiles stay where you put them and keep their size; draggable/resizable only
 * in edit mode.
 */
export default function LayoutGrid({
  services,
  editMode,
  layout,
  onLayoutChange,
  onEdit,
  onRemoveFromGrid,
}) {
  const computed = buildLayout(services, layout);

  return (
    // Width cap: below it the grid uses full width (tiles shrink); above it the
    // grid stays fixed (tiles keep their size). WidthProvider measures this box.
    <div className="layout-wrap" style={{ maxWidth: GRID.MAX_WIDTH }}>
      <GridLayout
        // RGL's stylesheet puts `transition: all 200ms` on every item, so when
        // the tiles settle on load (hydration -> width measurement) their width
        // and height animate — the glitchy "grow-in". We only want that
        // animation while the user is actually dragging/resizing, so the class
        // enables transitions in edit mode only; on initial (view-mode) load
        // tiles snap straight to their saved geometry. See globals.css.
        className={`layout${editMode ? ' layout--edit' : ''}`}
        layout={computed}
        cols={GRID.COLUMNS}
        rowHeight={GRID.ROW_HEIGHT}
        margin={GRID.MARGIN}
        isDraggable={editMode}
        isResizable={editMode}
        compactType={null}
        allowOverlap
        preventCollision={false}
        draggableCancel=".no-drag"
        resizeHandles={['se']}
        onLayoutChange={onLayoutChange}
      >
        {services.map((service) => (
          <div key={service.id}>
            <ServiceTile
              service={service}
              editMode={editMode}
              onEdit={onEdit}
              onRemoveFromGrid={onRemoveFromGrid}
            />
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
