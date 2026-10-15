import React from 'react';
import './Toast.module.css';

const Toast = ({ show, title = 'Done!', msg = '' }) => {
  return (
    <div className={`km-toast ${show ? 'show' : ''}`}>
      <div className="km-toast-icon">
        <div className="km-toast-tick" />
      </div>
      <div className="km-toast-msg">
        <div className="km-toast-title">{title}</div>
        {msg && <div className="km-toast-sub">{msg}</div>}
      </div>
    </div>
  );
};

export default Toast;