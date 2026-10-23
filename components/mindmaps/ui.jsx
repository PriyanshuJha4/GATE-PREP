'use client';
import { useEffect, useRef, useState } from 'react';

export function Modal({ title, onClose, children, wide = false, footer }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    const first = ref.current?.querySelector('[data-autofocus], input, textarea, button');
    first?.focus();
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('keydown', onKey, true); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="mm-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`mm-modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="mm-modal-head"><strong>{title}</strong><button className="mm-x" onClick={onClose} aria-label="Close">×</button></div>
        <div className="mm-modal-body">{children}</div>
        {footer && <div className="mm-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Dropdown({ label, items, align = 'left', className = '', title }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const down = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const key = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', down); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key); };
  }, [open]);
  return (
    <div className={`mm-dd ${className}`} ref={ref}>
      <button className="mm-dd-btn" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} title={title}>{label} <span className="mm-caret">▾</span></button>
      {open && (
        <div className={`mm-dd-menu ${align === 'right' ? 'right' : ''}`} role="menu">
          {items.map((it, i) => it.sep ? <div key={i} className="mm-dd-sep" /> : it.head ? <div key={i} className="mm-dd-head">{it.head}</div> : (
            <button key={i} role="menuitem" className={`mm-dd-item ${it.danger ? 'danger' : ''}`} disabled={it.disabled} onClick={() => { setOpen(false); it.onClick?.(); }}>
              <span className="mm-dd-ico">{it.icon || ''}</span><span className="mm-dd-label">{it.label}</span>{it.hint && <kbd>{it.hint}</kbd>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Toast({ toast, onClose }) {
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(onClose, toast.action ? 9000 : 5000); return () => clearTimeout(t); }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className={`mm-toast ${toast.kind || ''}`} role="status" aria-live="polite">
      <span>{toast.msg}</span>
      {toast.action && <button onClick={() => { toast.action.run(); onClose(); }}>{toast.action.label}</button>}
      <button className="mm-toast-x" onClick={onClose} aria-label="Dismiss">×</button>
    </div>
  );
}
