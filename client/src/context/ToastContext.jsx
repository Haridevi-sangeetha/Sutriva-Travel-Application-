import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ show: false, message: '', icon: 'fa-solid fa-circle-check' });
  const timerRef = useRef(null);

  const showToast = (message, icon = 'fa-solid fa-circle-check') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ show: true, message, icon });
    timerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3200);
  };

  useEffect(() => {
    window.showToast = showToast;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
      <div className={`toast-notification ${toast.show ? 'show' : ''}`} id="toast" style={{ display: toast.show ? 'flex' : 'none' }}>
        <i className={toast.icon}></i>
        <span id="toastMsg">{toast.message}</span>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
