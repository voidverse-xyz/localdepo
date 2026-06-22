'use client';

import { STRINGS, VIEW_MODE } from '@/core/constants.js';

const VIEW_OPTIONS = [
  { mode: VIEW_MODE.CUSTOM, label: STRINGS.VIEW_CUSTOM },
  { mode: VIEW_MODE.GRID, label: STRINGS.VIEW_GRID },
  { mode: VIEW_MODE.LIST, label: STRINGS.VIEW_LIST },
];

export default function Toolbar({
  appName,
  viewMode,
  onViewMode,
  editMode,
  onToggleEdit,
  onAdd,
  onScan,
  onBackground,
  scanning,
}) {
  return (
    <header className="toolbar">
      <div className="toolbar__brand">{appName}</div>

      <div className="toolbar__views">
        {VIEW_OPTIONS.map((opt) => (
          <button
            key={opt.mode}
            className={`btn${viewMode === opt.mode ? ' btn--active' : ''}`}
            onClick={() => onViewMode(opt.mode)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="toolbar__actions">
        {editMode ? (
          <>
            <button className="btn" onClick={onAdd}>
              {STRINGS.ADD_SERVICE}
            </button>
            <button className="btn" onClick={onScan} disabled={scanning}>
              {scanning ? STRINGS.SCANNING : STRINGS.SCAN_NOW}
            </button>
            <button className="btn" onClick={onBackground}>
              {STRINGS.SETTINGS}
            </button>
          </>
        ) : null}
        <button className="btn btn--primary" onClick={onToggleEdit}>
          {editMode ? STRINGS.DONE : STRINGS.EDIT}
        </button>
      </div>
    </header>
  );
}
