import "../../pages/Profile.css"
import { authClient } from "../../lib/auth-client"
import Sidebar from "../Sidebar"
import { Outlet } from "react-router-dom"

export default function ProfileLayout() {
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

  return (
    <div className='profile-layout'>
      <Sidebar />
      <main className='profile-main'>
        <section className='profile-top'>
          <div className='profile-avatar-circle'>
            <img
              src={user.image || "/assets/budayana/islands/Profile.png"}
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

        <Outlet />
      </main>
    </div>
  )
}
