import React from 'react';
import styles from './Toast.module.css';

const Toast = ({ show, title = 'Done!', msg = '' }) => {
  return (
    <div className={`${styles['km-toast']} ${show ? styles.show : ''}`} role="status" aria-live="polite" aria-atomic="true">
      <div className={styles['km-toast-icon']}>
        <div className={styles['km-toast-tick']} />
      </div>
      <div className={styles['km-toast-msg']}>
        <div className={styles['km-toast-title']}>{title}</div>
        {msg && <div className={styles['km-toast-sub']}>{msg}</div>}
      </div>
    </div>
  );
};

export default Toast;
