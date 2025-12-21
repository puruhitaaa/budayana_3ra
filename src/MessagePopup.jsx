import "./MessagePopup.css";

export default function MessagePopup({ open, type = "success", message, onClose }) {
  if (!open) return null;

  return (
    <div className="msg-overlay" onClick={onClose}>
      <div
        className={`msg-card msg-${type}`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="msg-text">{message}</p>
        <button className="msg-button" onClick={onClose}>
          Oke
        </button>
      </div>
    </div>
  );
}