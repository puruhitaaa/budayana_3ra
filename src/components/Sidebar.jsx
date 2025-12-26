import "./Sidebar.css"
import { NavLink, useNavigate } from "react-router-dom"
import { useState } from "react"
import { authClient } from "../lib/auth-client"
import MessagePopup from "./MessagePopup"

export default function Sidebar() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  // POPUP MESSAGE
  const [popupOpen, setPopupOpen] = useState(false)
  const [popupType, setPopupType] = useState("success")
  const [popupMessage, setPopupMessage] = useState("")

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate("/login")
        },
        onError: (error) => {
          setPopupType("success")
          setPopupMessage(error.error.message || "Error during logout.")
          setPopupOpen(true)
        },
      },
    })
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const goToHome = () => {
    navigate("/home");
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button className='sidebar-toggle-btn' onClick={toggleSidebar}>
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Overlay for mobile when sidebar is open */}
      <div
        className={`sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(false)}
      />

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className='sidebar-logo'>
          <img src="/assets/budayana/islands/Budayana text.png" alt="Budayana" onClick={goToHome} />
        </div>

        <nav className='sidebar-menu'>
          <NavLink
            to='/profile'
            end
            className={({ isActive }) =>
              "sidebar-item" + (isActive ? " active" : "")
            }
            onClick={() => setIsOpen(false)} // Close on navigate
          >
            Profil
          </NavLink>

          <NavLink
            to='/profile/results'
            className={({ isActive }) =>
              "sidebar-item" + (isActive ? " active" : "")
            }
            onClick={() => setIsOpen(false)}
          >
            Hasil
          </NavLink>

          <button
            className='sidebar-item sidebar-logout'
            onClick={handleLogout}
          >
            Keluar
          </button>
        </nav>
      </aside>

      <MessagePopup
        open={popupOpen}
        type={popupType}
        message={popupMessage}
        onClose={() => {
          setPopupOpen(false)
        }}
      />
    </>
  )
}
