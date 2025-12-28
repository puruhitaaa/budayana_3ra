import "./Log_in.css"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { authClient } from "../../lib/auth-client"

export default function Login() {
  const navigate = useNavigate()

  const goToSignin = () => {
    navigate("/sign-up")
  }

  // SHOW PASSWORD
  const [username, setUsername] = useState("")
  const [passwordValue, setPasswordValue] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }) => {
      const { data, error } = await authClient.signIn.username({
        username,
        password,
      })

      if (error) {
        throw new Error(error.message || "Login failed")
      }

      return data
    },
    onSuccess: () => {
      // Preserve existing localStorage logic for compatibility
      // if (data?.user) {
      //   localStorage.setItem("userId", data.user.id)
      //   localStorage.setItem("fullName", data.user.name)
      // }

      // better-auth handles session token automatically, but if the app relies on this specific key:
      // if (data?.session?.token) {
      //   localStorage.setItem("token", data.session.token)
      // }

      alert("Login successful!")
      navigate("/home")
    },
    onError: (error) => {
      console.error(error)
      alert(error.message || "Error connecting to server")
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    loginMutation.mutate({ username, password: passwordValue })
  }

  return (
    <div className='signin_page'>
      <div className='redirect'>
        <p>Belum punya akun?</p>

        <div className='redi_button'>
          <button className='to_sign' onClick={goToSignin}>
            Daftar Akun
          </button>
        </div>
      </div>

      <div className='header_form'>
        <h1>Selamat Datang di</h1>
        <img src='/assets/budayana/islands/Game Name.png' alt='Budayana' />
        <h2>Masukan akunmu dulu yuk!</h2>
      </div>

      <div className='login_form'>
        <form onSubmit={handleSubmit}>
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
                placeholder=' Password Kamu (minimal 8 karakter)'
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

          <div className='submit'>
            <button
              type='submit'
              className='register'
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Loading..." : "Mulai!"}
            </button>
          </div>
        </form>
      </div>

      <div className='background'>
        <div className='grass'>
          <img className='rumput' src='/assets/budayana/islands/Rumput.png' />
        </div>

        <div className='animals'>
          <img className='buaya' src='/assets/budayana/islands/Buaya.png' />
          <img className='monyet' src='/assets/budayana/islands/Monyet.png' />
          <img className='badak' src='/assets/budayana/islands/Badak.png' />
          <img className='harimau' src='/assets/budayana/islands/Harimau.png' />
        </div>
      </div>
    </div>
  )
}
