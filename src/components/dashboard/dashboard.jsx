'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { STRINGS, VIEW_MODE, THEME } from '@/core/constants.js';
import { api } from '@/lib/api.js';
import { debounce } from '@/lib/debounce.js';
import Toolbar from '@/components/editing/toolbar.jsx';
import PasswordPrompt from '@/components/editing/password-prompt.jsx';
import ServiceEditDialog from '@/components/editing/service-edit-dialog.jsx';
import BackgroundPanel from '@/components/editing/background-panel.jsx';
import BackgroundStack from '@/components/backgrounds/background-stack.jsx';
import LayoutGrid, { gridSlot } from './layout-grid.jsx';
import ServiceList from './service-list.jsx';

/**
 * Top-level client orchestrator. Owns dashboard state (services, view mode,
 * layout, background) and the auth/edit gating. Children stay presentational.
 */
export default function Dashboard({ initialConfig }) {
  const [services, setServices] = useState(initialConfig.services || []);
  // Only Grid and List are user-facing; the list is the master catalog and the
  // default, so anything that isn't an explicit Grid preference falls back to List.
  const [viewMode, setViewMode] = useState(
    initialConfig.view?.mode === VIEW_MODE.GRID ? VIEW_MODE.GRID : VIEW_MODE.LIST,
  );
  const [layout, setLayout] = useState(initialConfig.layout || { grid: [] });
  // Mirror layout in a ref so the grid handlers can read the latest value
  // without depending on it — that keeps them stable so memoized list rows
  // don't all re-render on every add/remove.
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const [background, setBackground] = useState(initialConfig.background);
  // 'system' (default) follows the OS preference; 'dark'/'light' force a theme.
  const [theme, setTheme] = useState(initialConfig.ui?.theme || THEME.SYSTEM);
  const [systemDark, setSystemDark] = useState(true); // matched on the client below

  const [authed, setAuthed] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const pendingAction = useRef(null);

  const [dialog, setDialog] = useState(null); // null=closed, {}=add, service=edit
  const [bgPanelOpen, setBgPanelOpen] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Hold the content hidden for the first couple of frames so react-grid-layout
  // can measure and settle its tiles off-screen, then fade everything in. This
  // hides the brief reflow that's otherwise visible as a load glitch.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  // Restore an existing session (cookie) so edit mode can skip the prompt.
  useEffect(() => {
    api.checkAuth().then((r) => setAuthed(Boolean(r?.authed))).catch(() => {});
  }, []);

  // Track the OS colour-scheme so the toggle icon can reflect what 'system' resolves to.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mq.matches);
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // What the current theme resolves to (system -> the OS preference).
  const effectiveTheme = theme === THEME.SYSTEM ? (systemDark ? THEME.DARK : THEME.LIGHT) : theme;

  // Drive the <html data-theme> attribute. In 'system' mode we leave it off so
  // the CSS prefers-color-scheme media query takes over (no flash, no JS needed).
  useEffect(() => {
    const root = document.documentElement;
    if (theme === THEME.SYSTEM) root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);

  // --- auth gate ---
  const requireAuth = useCallback(
    (action) => {
      if (authed) {
        action();
        return;
      }
      pendingAction.current = action;
      setPwError('');
      setPwOpen(true);
    },
    [authed],
  );

  const submitPassword = useCallback(async (password) => {
    setPwBusy(true);
    setPwError('');
    try {
      await api.login(password);
      setAuthed(true);
      setPwOpen(false);
      const action = pendingAction.current;
      pendingAction.current = null;
      if (action) action();
    } catch {
      setPwError(STRINGS.WRONG_PASSWORD);
    } finally {
      setPwBusy(false);
    }
  }, []);

  const cancelPassword = useCallback(() => {
    setPwOpen(false);
    pendingAction.current = null;
  }, []);

  // --- layout persistence (debounced; only when actively editing) ---
  const saveLayoutDebounced = useMemo(
    () => debounce((payload) => api.saveLayout(payload).catch(() => {}), 600),
    [],
  );

  const handleLayoutChange = useCallback(
    (items) => {
      setLayout((prev) => {
        const next = { ...prev, [viewMode]: items };
        if (editMode && authed) saveLayoutDebounced({ layout: next });
        return next;
      });
    },
    [viewMode, editMode, authed, saveLayoutDebounced],
  );

  // --- theme (persisted in ui prefs when unlocked) ---
  // Toggling picks the opposite of whatever is showing now, as an explicit
  // override (so it sticks even if the OS preference later changes).
  const toggleTheme = useCallback(() => {
    const next = effectiveTheme === THEME.DARK ? THEME.LIGHT : THEME.DARK;
    setTheme(next);
    if (authed) api.saveLayout({ ui: { theme: next } }).catch(() => {});
  }, [effectiveTheme, authed]);

  // The sidebar (and so every control) is unlocked behind the password, so by
  // the time a view toggle happens the session is authed and the choice saves.
  const handleViewMode = useCallback(
    (mode) => {
      setViewMode(mode);
      if (authed) api.saveLayout({ view: { mode } }).catch(() => {});
    },
    [authed],
  );

  // --- edit toggle ---
  const toggleEdit = useCallback(() => {
    if (editMode) {
      setEditMode(false);
      return;
    }
    requireAuth(() => setEditMode(true));
  }, [editMode, requireAuth]);

  // --- service CRUD ---
  const closeDialog = useCallback(() => setDialog(null), []);

  const saveService = useCallback(async (data) => {
    const isNew = !data.id;
    try {
      const result = isNew ? await api.addService(data) : await api.updateService(data);
      setServices(result.services);
      setDialog(null);
      // A brand-new service lands in the master catalog, so surface it there.
      if (isNew) setViewMode(VIEW_MODE.LIST);
    } catch {
      /* errors surfaced via disabled UX; kept silent for v1 */
    }
  }, []);

  const deleteService = useCallback(async (service) => {
    if (!window.confirm(STRINGS.CONFIRM_DELETE)) return;
    try {
      const result = await api.deleteService(service.id);
      setServices(result.services);
      // Drop any stale grid entry locally so the tile/membership state matches
      // the now-deleted service (the server prunes it too).
      setLayout((prev) => ({ ...prev, grid: (prev.grid || []).filter((g) => g.i !== service.id) }));
      setDialog(null);
    } catch {
      /* ignore */
    }
  }, []);

  // --- grid membership (a service is "on the grid" iff it has a layout.grid entry) ---
  // Persisting the change lives outside the setLayout updater so the updater
  // stays pure (no duplicate PUTs under React's double-invoke).
  const persistGrid = useCallback((next) => {
    setLayout(next);
    api.saveLayout({ layout: next }).catch(() => {});
  }, []);

  const addToGrid = useCallback(
    (service) => {
      requireAuth(() => {
        const cur = layoutRef.current;
        const grid = Array.isArray(cur.grid) ? cur.grid : [];
        if (grid.some((g) => g.i === service.id)) return; // already on the grid
        // Drop the new tile in the next row-major slot below whatever's there.
        persistGrid({ ...cur, grid: [...grid, gridSlot(service.id, grid.length)] });
      });
    },
    [requireAuth, persistGrid],
  );

  const removeFromGrid = useCallback(
    (service) => {
      requireAuth(() => {
        const cur = layoutRef.current;
        const grid = (Array.isArray(cur.grid) ? cur.grid : []).filter((g) => g.i !== service.id);
        persistGrid({ ...cur, grid });
      });
    },
    [requireAuth, persistGrid],
  );

  // --- discovery ---
  const runScan = useCallback(async () => {
    setScanning(true);
    try {
      const result = await api.scan();
      setServices(result.services);
    } catch {
      /* ignore */
    } finally {
      setScanning(false);
    }
  }, []);

  // --- background ---
  const persistBackground = useCallback(async (bg) => {
    setBackground(bg);
    try {
      const result = await api.saveSettings(bg);
      setBackground(result.background);
    } catch {
      /* ignore */
    }
  }, []);

  const isList = viewMode === VIEW_MODE.LIST;
  const gridLayout = Array.isArray(layout.grid) ? layout.grid : [];
  const gridIds = useMemo(() => new Set(gridLayout.map((g) => g.i)), [gridLayout]);
  // Only services that are both still present and pinned to the grid show as tiles.
  const gridServices = services.filter((s) => gridIds.has(s.id));

  return (
    <div className="app">
      <BackgroundStack background={background} />

      <Toolbar
        authed={authed}
        requireAuth={requireAuth}
        viewMode={viewMode}
        onViewMode={handleViewMode}
        editMode={editMode}
        onToggleEdit={toggleEdit}
        onAdd={() => setDialog({})}
        onScan={runScan}
        onBackground={() => setBgPanelOpen(true)}
        scanning={scanning}
        theme={effectiveTheme}
        onToggleTheme={toggleTheme}
      />

      <div className={`app__content${ready ? ' app__content--ready' : ''}`}>
        {services.length === 0 ? (
          <p className="empty">{STRINGS.NO_SERVICES}</p>
        ) : isList ? (
          <ServiceList
            services={services}
            editMode={editMode}
            authed={authed}
            gridIds={gridIds}
            onEdit={setDialog}
            onDelete={deleteService}
            onAddToGrid={addToGrid}
            onRemoveFromGrid={removeFromGrid}
          />
        ) : gridServices.length === 0 ? (
          <div className="grid-empty">
            <p className="grid-empty__row">
              <ArrowLeft size={20} aria-hidden="true" />
              {STRINGS.GRID_EMPTY}
            </p>
          </div>
        ) : (
          <LayoutGrid
            services={gridServices}
            editMode={editMode}
            layout={gridLayout}
            onLayoutChange={handleLayoutChange}
            onEdit={setDialog}
            onRemoveFromGrid={removeFromGrid}
          />
        )}
      </div>

      {pwOpen ? (
        <PasswordPrompt onSubmit={submitPassword} onCancel={cancelPassword} error={pwError} busy={pwBusy} />
      ) : null}

      {dialog ? (
        <ServiceEditDialog
          initial={dialog}
          theme={effectiveTheme}
          onSave={saveService}
          onCancel={closeDialog}
          onDelete={deleteService}
        />
      ) : null}

      {bgPanelOpen ? (
        <BackgroundPanel
          background={background}
          onChange={setBackground}
          onSave={persistBackground}
          onClose={() => setBgPanelOpen(false)}
        />
      ) : null}
    </div>
  );
}
