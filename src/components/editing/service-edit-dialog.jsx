'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import Modal from '@/components/ui/modal.jsx';
import Slider from '@/components/ui/slider.jsx';
import { STRINGS, THEME } from '@/core/constants.js';
import { api } from '@/lib/api.js';

/** Add (initial = {}) or edit (initial = service) a service. */
export default function ServiceEditDialog({ initial, theme, onSave, onCancel, onDelete }) {
  // A service with no custom colour follows the theme surface/text, so the
  // "unset" swatches preview those defaults for the active (incl. system) theme.
  const isLight = theme === THEME.LIGHT;
  const bgFallback = isLight ? '#ffffff' : '#141a26';
  const fgFallback = isLight ? '#1a2230' : '#e8edf5';
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState({
    name: initial?.name || '',
    url: initial?.url || '',
    icon: initial?.icon || '',
    bg: initial?.bg || '',
    fg: initial?.fg || '',
    bgOpacity: initial?.bgOpacity ?? 100,
  });
  const [uploading, setUploading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setValue = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // Clearing the background colour also resets its opacity, so a stale value
  // can't linger on a service that no longer has a custom background.
  const setBg = (value) =>
    setForm((f) => ({ ...f, bg: value, bgOpacity: value ? f.bgOpacity : 100 }));

  const onIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.uploadImage(file);
      setForm((f) => ({ ...f, icon: result.path }));
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
    }
  };

  const save = () => {
    if (!form.name.trim() || !form.url.trim()) return;
    onSave({ ...initial, ...form });
  };

  return (
    <Modal
      title={isEdit ? STRINGS.EDIT_SERVICE : STRINGS.ADD_SERVICE}
      onClose={onCancel}
      footer={
        <>
          {isEdit ? (
            <button className="btn btn--danger" onClick={() => onDelete(initial)}>
              {STRINGS.DELETE}
            </button>
          ) : null}
          <span style={{ flex: 1 }} />
          <button className="btn" onClick={onCancel}>
            {STRINGS.CANCEL}
          </button>
          <button className="btn btn--primary" onClick={save}>
            {STRINGS.SAVE}
          </button>
        </>
      }
    >
      <label className="form-label">
        {STRINGS.FIELD_NAME}
        <input className="field" value={form.name} onChange={set('name')} autoFocus />
      </label>
      <label className="form-label">
        {STRINGS.FIELD_URL}
        <input className="field" value={form.url} onChange={set('url')} placeholder="http://host:port" />
      </label>
      <div className="form-label">
        {STRINGS.FIELD_ICON}
        <div className="icon-row">
          {form.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="icon-preview" src={form.icon} alt="" />
          ) : (
            <span className="icon-preview icon-preview--empty" />
          )}
          <input className="field" value={form.icon} onChange={set('icon')} placeholder="https://…/icon.png" />
          <label className="btn btn--ghost icon-upload">
            <Upload size={14} /> {uploading ? STRINGS.UPLOADING : STRINGS.UPLOAD_ICON}
            <input type="file" accept="image/*" hidden onChange={onIconUpload} />
          </label>
        </div>
      </div>

      <div className="color-row">
        <ColorField
          label={STRINGS.FIELD_BG_COLOR}
          fallback={bgFallback}
          value={form.bg}
          onChange={setBg}
        />
        <ColorField
          label={STRINGS.FIELD_FG_COLOR}
          fallback={fgFallback}
          value={form.fg}
          onChange={(v) => setValue('fg', v)}
        />
      </div>

      <Slider
        label={STRINGS.FIELD_BG_OPACITY}
        min={0}
        max={100}
        value={form.bgOpacity}
        suffix="%"
        disabled={!form.bg}
        onChange={(v) => setValue('bgOpacity', v)}
      />
    </Modal>
  );
}

/**
 * A single colour control: a swatch/picker plus a "Default" reset. An empty
 * `value` means "use the theme default", so the picker shows `fallback` but the
 * stored value stays empty until the user actively picks a colour.
 */
function ColorField({ label, value, fallback, onChange }) {
  const isSet = Boolean(value);
  return (
    <div className="color-field">
      <span className="color-field__label">{label}</span>
      <div className="color-field__controls">
        <input
          type="color"
          className="color-swatch"
          value={isSet ? value : fallback}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        />
        <button
          type="button"
          className="btn btn--ghost color-field__reset"
          onClick={() => onChange('')}
          disabled={!isSet}
        >
          {STRINGS.COLORS_DEFAULT}
        </button>
      </div>
    </div>
  );
}
