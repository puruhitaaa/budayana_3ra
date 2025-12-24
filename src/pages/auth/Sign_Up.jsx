import "./Sign_Up.css"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import MessagePopup from "../../components/MessagePopup.jsx"
import { authClient } from "../../lib/auth-client"
import { useInitializeProgress } from "../../hooks/useProgress"

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

  // Form State
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [grade, setGrade] = useState("")
  const [username, setUsername] = useState("")
  const [guardianEmail, setGuardianEmail] = useState("")

  // Progress initialization hook
  const initializeProgress = useInitializeProgress()

  const registerMutation = useMutation({
    mutationFn: async (formData) => {
      const { data, error } = await authClient.signUp.email(
        {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          username: formData.username,
          grade: formData.grade,
          guardianEmail: formData.guardianEmail,
        },
        {
          onSuccess: async () => {
            try {
              await initializeProgress.mutateAsync()

              setPopupType("success")
              setPopupMessage("Pendaftaran berhasil! Silakan masuk ya.")
              setPopupOpen(true)
            } catch (e) {
              console.warn("Progress initialization failed:", e)
            }
          },
          onError: () => {
            setPopupType("error")
            setPopupMessage(
              error.message || "Terjadi kesalahan koneksi ke server."
            )
            setPopupOpen(true)
          },
        }
      )

      if (error) {
        throw new Error(error.message || "Pendaftaran gagal, coba lagi ya.")
      }
      return data
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    registerMutation.mutate({
      email: email,
      name: name,
      grade: Number(grade),
      username: username,
      password: passwordValue,
      guardianEmail: guardianEmail,
    })
  }

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
        <form onSubmit={handleSubmit}>
          <div className='field'>
            <label htmlFor='name'>Nama</label>
            <input
              type='text'
              id='name'
              placeholder='Nama Kamu'
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className='field'>
            <label htmlFor='email'>Email</label>
            <input
              type='email'
              id='email'
              placeholder='Email Kamu'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className='field'>
            <label htmlFor='kelas'>Kelas</label>
            <input
              type='number'
              id='kelas'
              placeholder='Kelas Kamu (contoh : 4)'
              required
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>

          <div className='field'>
            <label htmlFor='username'>Username</label>
            <input
              type='text'
              id='username'
              placeholder='Username Kamu'
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
            <label htmlFor='guardianEmail'>Email Wali</label>
            <input
              type='email'
              id='guardianEmail'
              placeholder='Email Wali (contoh: emailwali@gmail.com'
              required
              value={guardianEmail}
              onChange={(e) => setGuardianEmail(e.target.value)}
            />
          </div>

          <div className='submit'>
            <button
              type='submit'
              className='register'
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Loading..." : "Mulai!"}
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
