import "./Sidebar.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Sidebar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    navigate("/");
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Overlay for mobile when sidebar is open */}
      <div
        className={`sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(false)}
      />

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-logo">Budayana</div>

        <nav className="sidebar-menu">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              "sidebar-item" + (isActive ? " active" : "")
            }
            onClick={() => setIsOpen(false)} // Close on navigate
          >
            Profil
          </NavLink>

          <NavLink
            to="/results"
            className={({ isActive }) =>
              "sidebar-item" + (isActive ? " active" : "")
            }
            onClick={() => setIsOpen(false)}
          >
            Hasil
          </NavLink>

          <button className="sidebar-item sidebar-logout" onClick={handleLogout}>
            Keluar
          </button>
        </nav>
      </aside>
    </>
  );
}
