'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Pencil,
  Check,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Image as ImageIcon,
  Sun,
  Moon,
  GripVertical,
  X,
} from 'lucide-react';
import { STRINGS, VIEW_MODE, THEME } from '@/core/constants.js';

const ICON = 18;

function IconButton({ title, active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      className={`icon-btn${active ? ' icon-btn--active' : ''}`}
      title={title}
      aria-label={title}
      aria-pressed={active || undefined}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/**
 * Right-edge control rail. Opens on load then auto-hides; a grip tab at the
 * edge reveals it again (hover on desktop, tap on mobile). Click/tap outside
 * closes it. Buttons: Grid, List, Edit, Theme (+ add/scan/background in edit).
 */
export default function Toolbar({
  authed,
  requireAuth,
  viewMode,
  onViewMode,
  editMode,
  onToggleEdit,
  onAdd,
  onScan,
  onBackground,
  scanning,
  theme,
  onToggleTheme,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Close when tapping/clicking anywhere outside the rail.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [open]);

  // Opening the rail is gated: the first time, it prompts for the admin
  // password; once the session is unlocked it just opens.
  const requestOpen = () => requireAuth(() => setOpen(true));

  // Hover reveal is mouse-only and only once unlocked, so an idle visitor isn't
  // nagged for a password just by moving the cursor near the edge. Touch/locked
  // users open via tapping the tab (which runs the auth gate).
  const onMouseShow = (e) => {
    if (e.pointerType === 'mouse' && authed) setOpen(true);
  };
  const onMouseHide = (e) => {
    if (e.pointerType === 'mouse') setOpen(false);
  };

  return (
    <div className={`rail${open ? ' rail--open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="rail__tab"
        title={STRINGS.SHOW_CONTROLS}
        aria-label={STRINGS.SHOW_CONTROLS}
        onPointerEnter={onMouseShow}
        onClick={() => (open ? setOpen(false) : requestOpen())}
      >
        <GripVertical size={ICON} />
      </button>

      <div className="rail__panel" onPointerEnter={onMouseShow} onPointerLeave={onMouseHide}>
        <IconButton title={STRINGS.TOGGLE_THEME} onClick={onToggleTheme}>
          {theme === THEME.DARK ? <Sun size={ICON} /> : <Moon size={ICON} />}
        </IconButton>
        <div className="rail__sep" />

        {/* The rail itself is unlocked behind the password, so these actions are
            always available — toggling edit mode no longer hides them. */}
        <IconButton title={STRINGS.ADD_SERVICE} onClick={onAdd}>
          <Plus size={ICON} />
        </IconButton>
        <IconButton title={STRINGS.SCAN_NOW} onClick={onScan} disabled={scanning}>
          <RefreshCw size={ICON} className={scanning ? 'spin' : undefined} />
        </IconButton>
        <IconButton title={STRINGS.SETTINGS} onClick={onBackground}>
          <ImageIcon size={ICON} />
        </IconButton>
        <div className="rail__sep" />

        <IconButton
          title={STRINGS.VIEW_GRID}
          active={viewMode === VIEW_MODE.GRID}
          onClick={() => onViewMode(VIEW_MODE.GRID)}
        >
          <LayoutGrid size={ICON} />
        </IconButton>
        <IconButton
          title={STRINGS.VIEW_LIST}
          active={viewMode === VIEW_MODE.LIST}
          onClick={() => onViewMode(VIEW_MODE.LIST)}
        >
          <List size={ICON} />
        </IconButton>
        <div className="rail__sep" />
        <IconButton title={editMode ? STRINGS.DONE : STRINGS.EDIT} active={editMode} onClick={onToggleEdit}>
          {editMode ? <Check size={ICON} /> : <Pencil size={ICON} />}
        </IconButton>
        <div className="rail__sep" />
        <IconButton title={STRINGS.CLOSE} onClick={() => setOpen(false)}>
          <X size={ICON} />
        </IconButton>
      </div>
    </div>
  );
}
