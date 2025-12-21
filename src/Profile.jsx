import "./Profile.css";
import Sidebar from "./Sidebar.jsx";
import { useEffect, useState } from "react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const storedId = localStorage.getItem("userId");
  const userId = storedId ? parseInt(storedId, 10) : null;

  console.log("Profile userId from localStorage:", storedId, "=>", userId);

  useEffect(() => {
    if (!userId) {
      console.log("No userId, stop loading profile");
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/users/${userId}`);
        const data = await res.json();

        console.log("GET /api/users response:", res.status, data);

        if (!res.ok || !data.ok) {
          console.error(data.error || "Failed to load user");
          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading || !user) {
    return (
      <div className="profile-layout">
        <Sidebar />
        <main className="profile-main">
          <p>Memuat profil...</p>
        </main>
      </div>
    );
  }

  const displayedPassword = "••••••••";

  return (
    <div className="profile-layout">
      <Sidebar />

      <main className="profile-main">
        {/* Header */}
        <section className="profile-top">
          <div className="profile-avatar-circle">
            <img
              src="/images/Profile.png"
              alt="Avatar"
              className="profile-avatar-img"
            />
          </div>



          <div className="profile-top-text">
            <h1 className="profile-name">{user.full_name}</h1>
            <div className="profile-grade-badge">Kelas {user.grade}</div>
          </div>
        </section>

        <hr className="profile-divider" />

        <h1 className="data-info">*Data tidak bisa diganti</h1>

        <div className="form_profile">
          <section className="profile-form">
            <div className="profile-field">
              <label>Nama</label>
              <input type="text" value={user.full_name} readOnly />
            </div>

            <div className="profile-field">
              <label>Kelas</label>
              <input type="text" value={user.grade} readOnly />
            </div>

            <div className="profile-field">
              <label>Username</label>
              <input type="text" value={user.username} readOnly />
            </div>

            <div className="profile-field profile-password-row">
              <label>Password</label>
              <div className="profile-password-wrapper">
                <input type="text" value={displayedPassword} readOnly />
              </div>
            </div>

            <div className="profile-field">
              <label>Email Wali</label>
              <input
                type="text"
                value={user.guardian_email || user.email || ""}
                readOnly
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
