'use client';

import { useState } from 'react';
import Modal from '@/components/ui/modal.jsx';
import { STRINGS, IMAGE_FIT } from '@/core/constants.js';
import { listEffects, getEffect } from '@/components/backgrounds/effects/registry.js';
import { api } from '@/lib/api.js';

/** A labelled, toggleable group of controls for one background layer. */
function Section({ label, enabled, onToggle, children }) {
  return (
    <div className="panel-section">
      <label className="panel-section__head">
        <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
        <span>{label}</span>
      </label>
      {enabled ? <div className="panel-section__body">{children}</div> : null}
    </div>
  );
}

/** Range slider with a live value readout. */
function Slider({ label, min, max, step = 1, value, onChange }) {
  return (
    <label className="slider">
      <span className="slider__label">
        {label}
        <em>{value}</em>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}

/** Edit + live-preview the four composable background layers. */
export default function BackgroundPanel({ background, onChange, onSave, onClose }) {
  const [bg, setBg] = useState(background);
  const [uploading, setUploading] = useState(false);

  // Update a layer, keep working copy, and live-preview through onChange.
  const update = (layer, patch) => {
    const next = { ...bg, [layer]: { ...bg[layer], ...patch } };
    setBg(next);
    onChange(next);
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.uploadImage(file);
      update('image', { path: result.path, enabled: true });
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
    }
  };

  const setEffectType = (type) => {
    const def = getEffect(type);
    update('effect', { type, options: def?.defaults || {} });
  };

  const setEffectOption = (key, value) =>
    update('effect', { options: { ...bg.effect.options, [key]: value } });

  return (
    <Modal
      title={STRINGS.SETTINGS}
      onClose={onClose}
      footer={
        <>
          <span style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>
            {STRINGS.CANCEL}
          </button>
          <button
            className="btn btn--primary"
            onClick={() => {
              onSave(bg);
              onClose();
            }}
          >
            {STRINGS.SAVE}
          </button>
        </>
      }
    >
      <Section label="Background color" enabled={bg.color.enabled} onToggle={(v) => update('color', { enabled: v })}>
        <input
          type="color"
          value={bg.color.value}
          onChange={(e) => update('color', { value: e.target.value })}
        />
      </Section>

      <Section label="Background image" enabled={bg.image.enabled} onToggle={(v) => update('image', { enabled: v })}>
        <input type="file" accept="image/*" onChange={onUpload} />
        {uploading ? <span className="panel-hint">Uploading…</span> : null}
        {bg.image.path ? <span className="panel-hint">{bg.image.path}</span> : null}
        <label className="field-inline">
          Fit
          <select value={bg.image.fit} onChange={(e) => update('image', { fit: e.target.value })}>
            {Object.values(IMAGE_FIT).map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <Slider label="Blur" min={0} max={20} value={bg.image.blur} onChange={(v) => update('image', { blur: v })} />
      </Section>

      <Section label="Effect" enabled={bg.effect.enabled} onToggle={(v) => update('effect', { enabled: v })}>
        <label className="field-inline">
          Type
          <select value={bg.effect.type} onChange={(e) => setEffectType(e.target.value)}>
            {listEffects().map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <Slider
          label="Density"
          min={0}
          max={1}
          step={0.05}
          value={bg.effect.options?.density ?? 0.6}
          onChange={(v) => setEffectOption('density', v)}
        />
        <Slider
          label="Speed"
          min={0}
          max={3}
          step={0.1}
          value={bg.effect.options?.speed ?? 1}
          onChange={(v) => setEffectOption('speed', v)}
        />
      </Section>

      <Section label="Readability overlay" enabled={bg.overlay.enabled} onToggle={(v) => update('overlay', { enabled: v })}>
        <Slider label="Dim" min={0} max={1} step={0.05} value={bg.overlay.dim} onChange={(v) => update('overlay', { dim: v })} />
        <Slider label="Blur" min={0} max={20} value={bg.overlay.blur} onChange={(v) => update('overlay', { blur: v })} />
      </Section>
    </Modal>
  );
}
