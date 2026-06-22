'use client';

import { Responsive, WidthProvider } from 'react-grid-layout';
import { GRID, VIEW_MODE } from '@/core/constants.js';
import ServiceTile from './service-tile.jsx';

const ResponsiveGridLayout = WidthProvider(Responsive);

/** Fallback geometry for a tile that has no saved layout entry yet. */
function defaultGrid(index) {
  const { w, h } = GRID.DEFAULT_TILE;
  const perRow = Math.max(1, Math.floor(GRID.COLS.lg / w));
  return {
    x: (index % perRow) * w,
    y: Math.floor(index / perRow) * h,
    w,
    h,
    ...GRID.MIN_TILE,
  };
}

/**
 * Draggable/resizable tile grid powering both CUSTOM (free placement) and
 * GRID (auto-compacted) view modes — the only difference is the RGL config.
 */
export default function LayoutGrid({ services, mode, editMode, layouts, onLayoutChange, onEdit, onDelete }) {
  const isCustom = mode === VIEW_MODE.CUSTOM;

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts || {}}
      breakpoints={GRID.BREAKPOINTS}
      cols={GRID.COLS}
      rowHeight={GRID.ROW_HEIGHT}
      margin={GRID.MARGIN}
      isDraggable={editMode}
      isResizable={editMode}
      compactType={isCustom ? null : 'vertical'}
      allowOverlap={isCustom}
      preventCollision={isCustom}
      draggableCancel=".no-drag"
      onLayoutChange={(_current, all) => onLayoutChange(all)}
    >
      {services.map((service, index) => (
        <div key={service.id} data-grid={defaultGrid(index)}>
          <ServiceTile service={service} editMode={editMode} onEdit={onEdit} onDelete={onDelete} />
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}
