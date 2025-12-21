import "./Sign_Up.css"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import MessagePopup from "../../components/MessagePopup.jsx"

export default function SignIn() {
  const navigate = useNavigate()

  const goToLogin = () => {
    navigate("/login")
  }
  // POPUP MESSAGE
  const [popupOpen, setPopupOpen] = useState(false)
  const [popupType, setPopupType] = useState("success")
  const [popupMessage, setPopupMessage] = useState("")

  // SHOW PASSWORD
  const [passwordValue, setPasswordValue] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className='signin_page'>
      <div className='redirect'>
        <p>Sudah punya akun?</p>

        <div className='redi_button'>
          <button className='to_login' onClick={goToLogin}>
            Masuk Akun
          </button>
        </div>
      </div>

      <div className='header_form'>
        <h1>Selamat Datang di</h1>

        <img src='/assets/budayana/islands/Game Name.png' alt='Budayana'></img>

        <h2>Daftar akunmu dulu yuk!</h2>
      </div>

      <div className='signin_form'>
        <form
          onSubmit={async (e) => {
            e.preventDefault()

            const name = document.getElementById("name").value
            const grade = document.getElementById("kelas").value
            const username = document.getElementById("username").value
            const password = passwordValue
            const emailWali = document.getElementById("emailWali").value

            try {
              const response = await fetch(
                "http://localhost:4000/api/auth/register",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    full_name: name,
                    grade: grade,
                    username: username,
                    password: password,
                    guardian_email: emailWali,
                  }),
                }
              )

              const data = await response.json()

              if (data.ok) {
                setPopupType("success")
                setPopupMessage("Pendaftaran berhasil! Silakan masuk ya.")
                setPopupOpen(true)
              } else {
                setPopupType("error")
                setPopupMessage(
                  data.message || "Pendaftaran gagal, coba lagi ya."
                )
                setPopupOpen(true)
              }
            } catch (err) {
              console.error(err)
              setPopupType("error")
              setPopupMessage("Terjadi kesalahan koneksi ke server.")
              setPopupOpen(true)
            }
          }}
        >
          <div className='field'>
            <label htmlFor='name'>Nama</label>
            <input type='text' id='name' placeholder='Nama Kamu' required />
          </div>

          <div className='field'>
            <label htmlFor='kelas'>Kelas</label>
            <input
              type='number'
              id='kelas'
              placeholder='Kelas Kamu (contoh : 4)'
              required
            />
          </div>

          <div className='field'>
            <label htmlFor='username'>Username</label>
            <input
              type='text'
              id='username'
              placeholder='Username Kamu'
              required
            />
          </div>

          <div className='field'>
            <label htmlFor='password'>Password</label>
            <div className='password-wrapper'>
              <input
                type={showPassword ? "text" : "password"}
                id='password'
                placeholder=' Password Kamu (6+ karakter)'
                required
                minLength='6'
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
              />
              {passwordValue && (
                <button
                  type='button'
                  className='password-toggle'
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              )}
            </div>
          </div>

          <div className='field'>
            <label htmlFor='emailWali'>Email Wali</label>
            <input
              type='email'
              id='emailWali'
              placeholder='Email Wali (contoh: emailwali@gmail.com'
              required
            />
          </div>

          <div className='submit'>
            <button type='submit' className='register'>
              Mulai!
            </button>
          </div>
        </form>
      </div>

      <div className='background'>
        <div className='grass'>
          <img className='rumput' src='/images/Rumput.png'></img>
        </div>

        <div className='animals'>
          <div className='animals_right'>
            <img
              className='buaya'
              src='/assets/budayana/islands/Buaya.png'
            ></img>
            <img
              className='monyet'
              src='/assets/budayana/islands/Monyet.png'
            ></img>
          </div>

          <div className='animals_left'>
            <img
              className='badak'
              src='/assets/budayana/islands/Badak.png'
            ></img>
            <img
              className='harimau'
              src='/assets/budayana/islands/Harimau.png'
            ></img>
          </div>
        </div>
      </div>

      <MessagePopup
        open={popupOpen}
        type={popupType}
        message={popupMessage}
        onClose={() => {
          setPopupOpen(false)
          if (popupType === "success") {
            navigate("/login")
          }
        }}
      />
    </div>
  )
}
