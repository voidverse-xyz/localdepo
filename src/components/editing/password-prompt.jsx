'use client';

import { useState } from 'react';
import Modal from '@/components/ui/modal.jsx';
import { STRINGS } from '@/core/constants.js';

export default function PasswordPrompt({ onSubmit, onCancel, error, busy }) {
  const [value, setValue] = useState('');

  const submit = (e) => {
    e.preventDefault();
    onSubmit(value);
  };

  return (
    <Modal
      title={STRINGS.PASSWORD_TITLE}
      onClose={onCancel}
      footer={
        <>
          <span style={{ flex: 1 }} />
          <button className="btn" onClick={onCancel}>
            {STRINGS.CANCEL}
          </button>
          <button className="btn btn--primary" onClick={submit} disabled={busy}>
            {STRINGS.UNLOCK}
          </button>
        </>
      }
    >
      <form onSubmit={submit}>
        <input
          className="field"
          type="password"
          autoFocus
          placeholder={STRINGS.PASSWORD_PLACEHOLDER}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {error ? <p className="form-error">{error}</p> : null}
      </form>
    </Modal>
  );
}
