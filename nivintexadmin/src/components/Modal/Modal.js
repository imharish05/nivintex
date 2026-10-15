import { useRef, useEffect } from 'react';

export default function Modal({ open, title, fields, onClose, onSave }) {
  const formRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = () => {
    if (!formRef.current) return;
    const inputs = formRef.current.querySelectorAll('input,select');
    let valid = true;
    inputs.forEach((inp) => {
      const group = inp.closest('[data-required]');
      if (group && !inp.value.trim()) {
        inp.style.borderColor = 'var(--km-red)';
        valid = false;
      } else {
        inp.style.borderColor = '';
      }
    });
    if (!valid) { alert('Please fill in required fields'); return; }
    onSave(title.replace('Add ', ''));
    onClose();
  };

  return (
    <div
      className={`km-modal-overlay ${open ? 'open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="km-modal">
        <div className="km-modal-header">{title}</div>

        <div className="km-modal-body" ref={formRef}>
          {fields.map((f) => (
            <div key={f.l} className="km-field" data-required={f.req ? 'true' : undefined}>
              <label className="km-label">
                {f.l} {f.req && <span style={{ color: 'var(--km-orange)' }}>*</span>}
              </label>
              {f.type === 'select' ? (
                <select className="km-select">
                  {f.opts.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input className="km-input" placeholder={f.p || ''} />
              )}
            </div>
          ))}
        </div>

        <div className="km-modal-footer">
          <button className="km-modal-cancel" onClick={onClose}>Cancel</button>
          <button className="km-modal-save" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}