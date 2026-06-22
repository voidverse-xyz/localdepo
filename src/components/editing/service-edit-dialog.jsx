'use client';

import { useState } from 'react';
import Modal from '@/components/ui/modal.jsx';
import { STRINGS } from '@/core/constants.js';

/** Add (initial = {}) or edit (initial = service) a service. */
export default function ServiceEditDialog({ initial, onSave, onCancel, onDelete }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState({
    name: initial?.name || '',
    url: initial?.url || '',
    icon: initial?.icon || '',
    category: initial?.category || '',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

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
      <label className="form-label">
        {STRINGS.FIELD_ICON}
        <input className="field" value={form.icon} onChange={set('icon')} placeholder="https://…/icon.png" />
      </label>
      <label className="form-label">
        {STRINGS.FIELD_CATEGORY}
        <input className="field" value={form.category} onChange={set('category')} />
      </label>
    </Modal>
  );
}
