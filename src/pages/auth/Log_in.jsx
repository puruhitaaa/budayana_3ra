import "./Log_in.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";    // ⬅ tambahkan ini

export default function Login() {
  const navigate = useNavigate();

  const goToSignin = () => {
    navigate("/");
  };

  // SHOW PASSWORD
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="signin_page">
      <div className="redirect">
        <p>Belum punya akun?</p>

        <div className="redi_button">
          <button className="to_sign" onClick={goToSignin}>
            Daftar Akun
          </button>
        </div>
      </div>

      <div className="header_form">
        <h1>Selamat Datang di</h1>
        <img src="/assets/budayana/islands/Game Name.png" alt="Budayana" />
        <h2>Masukan akunmu dulu yuk!</h2>
      </div>

      <div className="login_form">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const password = passwordValue;

            try {
              const res = await fetch("http://localhost:4000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
              });

              const data = await res.json();
              console.log("Login response:", data);

              if (data.ok) {
                localStorage.setItem("userId", data.user.user_id);
                localStorage.setItem("fullName", data.user.full_name);

                if (data.token) {
                  localStorage.setItem("token", data.token);
                }

                alert("Login successful!");
                navigate("/home");
              } else {
                alert(data.message || "Login failed");
              }
            } catch (err) {
              console.error(err);
              alert("Error connecting to server");
            }
          }}
        >
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Username Kamu"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder=" Password Kamu (6+ karakter)"
                required
                minLength="6"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
              />
              {passwordValue && (
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              )}
            </div>
          </div>

          <div className="submit">
            <button type="submit" className="register">
              Mulai!
            </button>
          </div>
        </form>
      </div>

      <div className="background">
        <div className="grass">
          <img className="rumput" src="/assets/budayana/islands/Rumput.png" />
        </div>

        <div className="animals">
          <img className="buaya" src="/assets/budayana/islands/Buaya.png" />
          <img className="monyet" src="/assets/budayana/islands/Monyet.png" />
          <img className="badak" src="/assets/budayana/islands/Badak.png" />
          <img className="harimau" src="/assets/budayana/islands/Harimau.png" />
        </div>
      </div>
    </div>
  );
}
