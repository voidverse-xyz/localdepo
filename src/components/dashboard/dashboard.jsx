'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { APP, STRINGS, VIEW_MODE } from '@/core/constants.js';
import { api } from '@/lib/api.js';
import { debounce } from '@/lib/debounce.js';
import Toolbar from '@/components/editing/toolbar.jsx';
import PasswordPrompt from '@/components/editing/password-prompt.jsx';
import ServiceEditDialog from '@/components/editing/service-edit-dialog.jsx';
import BackgroundPanel from '@/components/editing/background-panel.jsx';
import BackgroundStack from '@/components/backgrounds/background-stack.jsx';
import LayoutGrid from './layout-grid.jsx';
import ServiceList from './service-list.jsx';

/**
 * Top-level client orchestrator. Owns dashboard state (services, view mode,
 * layout, background) and the auth/edit gating. Children stay presentational.
 */
export default function Dashboard({ initialConfig }) {
  const [services, setServices] = useState(initialConfig.services || []);
  const [viewMode, setViewMode] = useState(initialConfig.view?.mode || VIEW_MODE.GRID);
  const [layout, setLayout] = useState(initialConfig.layout || { custom: {}, grid: {} });
  const [background, setBackground] = useState(initialConfig.background);

  const [authed, setAuthed] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const pendingAction = useRef(null);

  const [dialog, setDialog] = useState(null); // null=closed, {}=add, service=edit
  const [bgPanelOpen, setBgPanelOpen] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Restore an existing session (cookie) so edit mode can skip the prompt.
  useEffect(() => {
    api.checkAuth().then((r) => setAuthed(Boolean(r?.authed))).catch(() => {});
  }, []);

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
    (allLayouts) => {
      setLayout((prev) => {
        const next = { ...prev, [viewMode]: allLayouts };
        if (editMode && authed) saveLayoutDebounced({ layout: next });
        return next;
      });
    },
    [viewMode, editMode, authed, saveLayoutDebounced],
  );

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
    try {
      const result = data.id ? await api.updateService(data) : await api.addService(data);
      setServices(result.services);
      setDialog(null);
    } catch {
      /* errors surfaced via disabled UX; kept silent for v1 */
    }
  }, []);

  const deleteService = useCallback(async (service) => {
    if (!window.confirm(STRINGS.CONFIRM_DELETE)) return;
    try {
      const result = await api.deleteService(service.id);
      setServices(result.services);
      setDialog(null);
    } catch {
      /* ignore */
    }
  }, []);

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

  const activeLayouts = layout[viewMode] || {};
  const isGridView = viewMode === VIEW_MODE.CUSTOM || viewMode === VIEW_MODE.GRID;

  return (
    <div className="app">
      <BackgroundStack background={background} />

      <div className="app__content">
        <Toolbar
          appName={APP.NAME}
          viewMode={viewMode}
          onViewMode={handleViewMode}
          editMode={editMode}
          onToggleEdit={toggleEdit}
          onAdd={() => setDialog({})}
          onScan={runScan}
          onBackground={() => setBgPanelOpen(true)}
          scanning={scanning}
        />

        {services.length === 0 ? (
          <p className="empty">{STRINGS.NO_SERVICES}</p>
        ) : isGridView ? (
          <LayoutGrid
            services={services}
            mode={viewMode}
            editMode={editMode}
            layouts={activeLayouts}
            onLayoutChange={handleLayoutChange}
            onEdit={setDialog}
            onDelete={deleteService}
          />
        ) : (
          <ServiceList
            services={services}
            editMode={editMode}
            onEdit={setDialog}
            onDelete={deleteService}
          />
        )}
      </div>

      {pwOpen ? (
        <PasswordPrompt onSubmit={submitPassword} onCancel={cancelPassword} error={pwError} busy={pwBusy} />
      ) : null}

      {dialog ? (
        <ServiceEditDialog
          initial={dialog}
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
