import React from 'react';
import styles from './Toast.module.css';

export default function ConfirmToast({ request, onResolve }) {
  if (!request) return null;

  return (
    <div className={styles['km-confirm-toast']} role="alertdialog" aria-modal="true" aria-label="Confirm action">
      <div className={styles['km-toast-icon']} aria-hidden="true">
        <span className={styles['km-confirm-toast-mark']}>!</span>
      </div>
      <div className={styles['km-toast-msg']}>
        <div className={styles['km-toast-title']}>{request.title || 'Confirm action'}</div>
        <div className={styles['km-toast-sub']}>{request.message}</div>
        <div className={styles['km-confirm-toast-actions']}>
          <button type="button" className={styles['km-confirm-toast-cancel']} onClick={() => onResolve(false)}>Cancel</button>
          <button type="button" className={styles['km-confirm-toast-accept']} onClick={() => onResolve(true)}>{request.confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
