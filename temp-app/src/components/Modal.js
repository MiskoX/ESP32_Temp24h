import React, { useEffect } from "react";
import "./Modal.css"; // Plik CSS do stylów modala

const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null; // Modal nie jest wyświetlany, jeśli isOpen jest fałszywe

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        {children} {/* Wyświetlenie komunikatu błędu */}
      </div>
    </div>
  );
};

export default Modal;
