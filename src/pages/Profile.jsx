import "./Profile.css"
import Sidebar from "../components/Sidebar.jsx"
import { authClient } from "../lib/auth-client"

export default function Profile() {
  const { data: session, isPending, error } = authClient.useSession()
  const user = session?.user

  if (isPending) {
    return (
      <div className='profile-layout'>
        <Sidebar />
        <main className='profile-main'>
          <p>Memuat profil...</p>
        </main>
      </div>
    )
  }

  if (error) {
    console.error("Session error:", error)
  }

  if (!user) {
    return (
      <div className='profile-layout'>
        <Sidebar />
        <main className='profile-main'>
          <p>Silakan login untuk melihat profil.</p>
        </main>
      </div>
    )
  }

  const displayedPassword = "••••••••"

  return (
    <div className='profile-layout'>
      <Sidebar />

      <main className='profile-main'>
        {/* Header */}
        <section className='profile-top'>
          <div className='profile-avatar-circle'>
            <img
              src={user.image || "/images/Profile.png"}
              alt='Avatar'
              className='profile-avatar-img'
            />
          </div>

          <div className='profile-top-text'>
            <h1 className='profile-name'>{user.name}</h1>
            <div className='profile-grade-badge'>Kelas {user.grade || "-"}</div>
          </div>
        </section>

        <hr className='profile-divider' />

        <h1 className='data-info'>*Data tidak bisa diganti</h1>

        <div className='form_profile'>
          <section className='profile-form'>
            <div className='profile-field'>
              <label>Nama</label>
              <input type='text' value={user.name} readOnly />
            </div>

            <div className='profile-field'>
              <label>Kelas</label>
              <input type='text' value={user.grade || ""} readOnly />
            </div>

            <div className='profile-field'>
              <label>Username</label>
              <input type='text' value={user.username || ""} readOnly />
            </div>

            <div className='profile-field profile-password-row'>
              <label>Password</label>
              <div className='profile-password-wrapper'>
                <input type='text' value={displayedPassword} readOnly />
              </div>
            </div>

            <div className='profile-field'>
              <label>Email Wali</label>
              <input
                type='text'
                value={user.guardian_email || user.email || ""}
                readOnly
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
