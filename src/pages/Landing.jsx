import "./Landing.css";
import { useNavigate } from "react-router-dom";


export default function Landing() {
    const navigate = useNavigate();

    const goToSignIn = () => {
        navigate("/sign-up");
    };

    const goToLogin = () => {
        navigate("/login");
    };

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (!el) return;

        el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="page_landing">
            <div className="header_landing">
                <img
                    src="/assets/budayana/islands/Budayana text.png"
                    alt="Budayana"
                    onClick={scrollToTop}
                />
                <div className="header_opt">
                    <p className="about_us_header" onClick={() => scrollToSection("about")}>
                        Tentang Kami
                    </p>
                    <p className="features_header" onClick={() => scrollToSection("features")}>
                        Fitur Utama
                    </p>
                    <p className="contact_header" onClick={() => scrollToSection("contact")}>
                        Kontak
                    </p>
                    <button className="btn_login" onClick={goToLogin}>Masuk</button>
                </div>
            </div>

            <div className="landing_child">
                <div className="prambanan">
                    <img src="./assets/budayana/islands/prambanan.png" alt="prambanan" />
                </div>

                <div className="bg_green">
                    <img src="./assets/budayana/islands/rumput 2.png" alt="bg_green" />
                </div>

                <div className="hero">
                    <div className="hero_img">
                        <img src="./assets/budayana/islands/Landing Group.png" alt="group" />
                    </div>

                    <div className="hero_text">
                        <img src="./assets/budayana/islands/Game Name.png" alt="Budayana" />
                        <h1 className="sub_title">Platform Literasi <br></br>Budaya untuk Siswa</h1>
                        <button className="btn_login" onClick={goToSignIn}>Daftar Akun</button>
                    </div>
                </div>

                <div id="about" className="about_us">
                    <div className="about_us_text">
                        <h1>Tentang Kami</h1>
                        <p className="about_us_text_1">
                            Budayana adalah platform pembelajaran digital yang dirancang untuk membantu siswa mengenal dan memahami budaya Indonesia melalui pendekatan literasi berbasis cerita.
                        </p>
                        <p className="about_us_text_2">
                            Kami menggabungkan teknologi dan nilai budaya untuk menciptakan pengalaman belajar yang ramah anak, mudah digunakan, dan relevan dengan kebutuhan pendidikan saat ini.
                        </p>
                    </div>

                    <img src="./assets/budayana/islands/Harimau.png" alt="about us" />
                </div>



                <div id="features" className="features">
                    <div className="features_text">
                        <h1 className="features_title">Fitur Utama</h1>


                        <div className="features_items">
                            <img src="./assets/budayana/islands/feature flow.png" alt="pre-test" />

                        </div>
                    </div>
                </div>

                <div className="bg_brown">
                    <img src="./assets/budayana/islands/bg brown.png" alt="bg_brown" />

                </div>

                <div id="contact" className="contact">
                    <h1>Kontak Kami</h1>
                    <p className="contact_text_1">
                        Kami terbuka untuk pertanyaan, masukan, maupun peluang kerja sama dengan sekolah, institusi pendidikan, dan pihak terkait lainnya.
                    </p>
                    <p className="contact_text_2">
                        Silakan hubungi kami melalui:
                    </p>

                    <div className="contact_text_3">
                        <img src="./assets/budayana/islands/email.png" alt="email" />
                        <p>budayana@gmail.com</p>
                    </div>
                </div>
            </div>

        </div>
    );
}