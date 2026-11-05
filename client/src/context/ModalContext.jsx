import React, { createContext, useContext, useState, useEffect } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState({});

  const openModal = (modalName, data = {}) => {
    setModalData(data);
    setActiveModal(modalName);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData({});
  };

  // Wire window-level modal triggers for compatibility
  useEffect(() => {
    window.openAboutUsModal = () => openModal('aboutUsModal');
    window.closeAboutUsModal = closeModal;
    window.openQuizModal = () => openModal('quizModal');
    window.closeQuizModal = closeModal;
    window.openGovtBusModal = (bus) => openModal('govtBusModal', bus);
    window.closeGovtBusModal = closeModal;
    window.openSutrivaToolModal = (tool) => openModal('sutrivaToolModal', tool);
    window.closeSutrivaToolModal = closeModal;
  }, []);

  return (
    <ModalContext.Provider value={{ activeModal, modalData, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModals = () => useContext(ModalContext);

