'use client';

import { X } from 'lucide-react';
import { STRINGS } from '@/core/constants.js';

/** Reusable modal dialog. Click outside or the close button to close. */
export default function Modal({ title, children, footer, onClose }) {
  return (
    <div className="modal__overlay" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__x" onClick={onClose} aria-label={STRINGS.CLOSE}>
            <X size={18} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
