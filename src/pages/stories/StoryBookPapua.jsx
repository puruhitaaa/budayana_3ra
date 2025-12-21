import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const $ = window.$;

// ------------------------- stories -------------------------
const stories = {
    papua: {
        title: "Biwar Penakluk Naga",
        subtitle: "Legenda Rakyat Papua",
        coverImage: "/assets/budayana/islands/cover book papua.png",
        backgroundImage: "/assets/budayana/islands/wood cover.png",
        pages: [
            { type: "cover" },

            // PAGE 2
            {
                content: `Di tanah Papua yang indah, hiduplah 
seorang pemuda bernama Biwar. Ia 
tinggal di sebuah kampung kecil di tepi 
hutan. Biwar terkenal pemberani, suka 
menolong, dan selalu menjaga keluarganya.

Namun, kehidupan warga kampung sering 
terganggu oleh makhluk jahat, yaitu 
seekor naga raksasa yang tinggal di 
dalam gua besar dekat sungai.`
            },

            // PAGE 3
            {
                content: `Naga itu sering datang untuk merusak 
ladang, memakan hewan ternak, bahkan 
membuat warga ketakutan. Suatu hari, 
kepala suku mengumpulkan seluruh warga.

“Warga semua,” katanya dengan suara 
sedih, “kita tidak bisa hidup tenang. Naga 
itu harus dihentikan. Tapi siapa yang 
berani melawannya?”`
            },

            // PAGE 4
            {
                content: `Semua orang saling pandang. Tidak ada 
yang berani maju. Namun Biwar berdiri 
dan berkata dengan gagah, “Aku akan 
menghadapi naga itu, Kepala Suku.”

Ibunya terkejut. “Biwar, itu berbahaya 
sekali!” Biwar tersenyum menenangkan. 

“Ibu, jangan khawatir. Aku akan hati-hati. 
Aku hanya ingin kampung kita aman.”`
            },

            // PAGE 5
            {
                content: `Pagi-pagi sekali, Biwar membawa 
tombak, busur, dan panah. Ia berjalan 
melewati hutan, menyeberangi sungai, 
dan menaiki bukit batu.

Saat mendekati gua naga, ia mendengar 
suara mengerikan. “Grrrrrr… Siapa yang 
berani datang ke sini?”`
            },

            // PAGE 6
            {
                content: `Suara itu bergema dari dalam gua. 
Biwar menjawab, “Aku Biwar dari 
Kampung Wamena! Aku datang untuk 
menghentikan kejahatanmu!”

Tiba-tiba, naga raksasa keluar dari gua. 
Sisiknya keras, matanya menyala merah, 
dan napasnya panas bagaikan api.`
            },

            // PAGE 7
            {
                content: `“Anak kecil sepertimu ingin menantangku?” 
Naga itu tertawa keras. “Kau tidak akan 
bisa menang!” Biwar memegang 
tombaknya dengan erat. “Aku tidak takut.”

Naga itu menyerang dengan cepat. Biwar 
melompat ke samping, menghindari ekor 
naga yang menghantam tanah hingga 
tanah bergetar.`
            },

            // PAGE 8
            {
                content: `Biwar memanah tepat ke arah mata 
naga. “Ini untuk kampungku!” Anak panah 
itu mengenai sasaran, membuat naga 
kesakitan dan berteriak.

“Aaarrrggghhh!” Naga itu mengamuk dan 
menyemburkan api, tetapi Biwar dengan 
gesit bersembunyi di balik batu.`
            },

            // PAGE 9
            {
                content: `Akhirnya, saat naga mulai lelah, Biwar 
mendekat dan menusuk jantungnya 
dengan tombak. Naga itu jatuh ke tanah 
dan tak bergerak lagi.

Dengan langkah bangga, Biwar kembali 
ke kampung membawa kabar bahagia. 
Warga menyambutnya dengan sorak-sorai. 
“Biwar! Pahlawan kita!”`
            },

            // PAGE 10 – ENDING PAGE
            {
                type: "ending",
                content: "Cerita Selesai.",
            },
        ],
    },
};

// ------------------------- helpers -------------------------
const formatTime = (seconds) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins} : ${secs}`;
};

// ------------------------- main component -------------------------
export default function StoryBookPapua() {
    const navigate = useNavigate();

    const story = stories.papua;
    const totalPages = story.pages.length;

    const [timeElapsed, setTimeElapsed] = useState(0);
    const [xp, setXp] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [showExitWarning, setShowExitWarning] = useState(false);
    const [scale, setScale] = useState(1);

    // book ref and sizing
    const bookRef = useRef(null);
    const containerRef = useRef(null);
    const initRef = useRef(false);

    // timer
    useEffect(() => {
        const t = setInterval(() => setTimeElapsed((v) => v + 1), 1000);
        return () => clearInterval(t);
    }, []);

    // Handle Window Resize for Responsiveness
    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            // Base dimensions of the book
            const baseWidth = 1100;
            const baseHeight = 700;

            // Calculate max available width/height (with some padding)
            // REDUCED VERTICAL PADDING to keep size closer to original on laptops
            const maxWidth = w - 180; // Reserve 90px each side for arrows
            const maxHeight = h - 80; // Changed from h - 200 to h - 80

            const scaleX = maxWidth / baseWidth;
            const scaleY = maxHeight / baseHeight;

            // Use the smaller scale to fit both dimensions, maxing at 1
            let newScale = Math.min(scaleX, scaleY, 1);
            setScale(newScale);
        };

        window.addEventListener("resize", handleResize);
        handleResize(); // Init

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // initialize turn.js and handle events
    useLayoutEffect(() => {
        if (!containerRef.current) return;

        if (bookRef.current && !initRef.current) {
            const b = $(bookRef.current);

            b.turn({
                width: 1100,   // FULL BOOK SIZE
                height: 700,
                autoCenter: true,
                gradients: true,
                acceleration: true,
                elevation: 50,
                duration: 600,
                pages: totalPages,
            });

            // Bind turning event to update state
            b.bind("turning", (event, page, view) => {
                setCurrentPage(page);
                if (page === totalPages) {
                    setXp(100);
                }
            });

            initRef.current = true;
        }

        return () => {
            if (initRef.current && bookRef.current && $(bookRef.current).turn) {
                try {
                    $(bookRef.current).turn("destroy").remove();
                } catch { }
            }
        };
    }, [totalPages]);

    const handleFinish = () => {
        navigate("/homepage");
    };

    return (
        <div
            ref={containerRef}
            className="h-screen w-full flex flex-col items-center justify-center overflow-hidden relative"
            style={{
                backgroundImage: story.backgroundImage ? `url('${story.backgroundImage}')` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* ⭐ FLOATING ARROWS — CENTER SIDES (ALIGNED WITH HEADER) ⭐ */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[1400px] flex justify-between px-2"> {/* Wider container */}

                    {/* Left Arrow */}
                    <button
                        onClick={() => $(bookRef.current).turn("previous")}
                        className="pointer-events-auto bg-[#E3DBD5] text-black w-12 h-12 rounded-full 
                              flex items-center justify-center shadow-lg hover:scale-105 transition"
                    >
                        <ArrowLeft size={26} />
                    </button>

                    {/* Right Arrow */}
                    {currentPage === totalPages ? (
                        <button
                            onClick={handleFinish}
                            className="pointer-events-auto bg-[#E3DBD5] text-black px-6 py-3 rounded-full 
                              flex items-center justify-center shadow-lg hover:scale-105 transition font-bold"
                        >
                            Selesai
                        </button>
                    ) : (
                        <button
                            onClick={() => $(bookRef.current).turn("next")}
                            className="pointer-events-auto bg-[#E3DBD5] text-black w-12 h-12 rounded-full 
                                flex items-center justify-center shadow-lg hover:scale-105 transition"
                        >
                            <ArrowRight size={26} />
                        </button>
                    )}

                </div>
            </div>

            {/* ⭐ INSERTED CSS STYLE BLOCK HERE ⭐ */}
            <style>
                {`
  /* Full flipbook size */
  #book {
    width: 1100px !important;
    height: 700px !important;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    margin: 0 auto;
  }

  /* Each page */
  .page {
    width: 550px !important;
    height: 700px !important;
    /* Basic style for pages */
    background-color: white;
    font-size: 18px;
  }

  /* ⭐ ADD THIS FIX BELOW ⭐ */
  .cover-full {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none; /* Prevent image dragging */
  }

  .cover-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 40px;
    color: white;
    text-shadow: 0 3px 6px rgba(0,0,0,0.6);
  }

.cover-page {
     background: #fffaf3 !important;
     background-image: url('/assets/paper-texture.png') !important;
   }

   /* ⭐ NEW FIX — RESTORE STORY PAGE BACKGROUND ⭐ */
   .story-page {
     background: #fffaf3 !important;
     background-image: url('/assets/paper-texture.png') !important;
     background-size: cover !important;
     background-position: center !important;
   }
   
   /* Spine Shadows - Softer & Smoother */
   /* Even Index (0, 2...) -> Right Page -> Shadow on Left */
   .spine-left-shadow {
      box-shadow: inset 20px 0 50px -15px rgba(0,0,0,0.15); /* Softened */
   }
   /* Odd Index (1, 3...) -> Left Page -> Shadow on Right */
   .spine-right-shadow {
      box-shadow: inset -20px 0 50px -15px rgba(0,0,0,0.15); /* Softened */
   }
`}
            </style>
            {/* HEADER */}
            <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[1400px] grid grid-cols-3 items-center mb-0 relative z-30">
                {/* Left: Back Button */}
                <div className="flex justify-start">
                    <button
                        onClick={() => setShowExitWarning(true)}
                        className="px-4 py-2 md:px-5 md:py-2 bg-white/85 border-2 border-[#2c2c2c] flex items-center gap-2 rounded-full shadow hover:bg-gray-100 transition font-semibold text-sm md:text-base"
                    >
                        <ArrowLeft size={18} /> Kembali
                    </button>
                </div>

                {/* Center: Page Number */}
                <div className="flex justify-center">
                    <span className="text-white font-bold text-2xl drop-shadow-md">
                        {currentPage} / {totalPages}
                    </span>
                </div>

                {/* Right: Timer & XP */}
                <div className="flex justify-end items-center gap-2 md:gap-3">
                    <div className="flex items-center gap-2 bg-white/85 px-4 py-2 rounded-full shadow-sm border-2 border-[#2c2c2c]">
                        <Clock size={20} className="text-[#2c2c2c]" />
                        <span className="text-[#2c2c2c] font-semibold tracking-[0.12em]">{formatTime(timeElapsed)}</span>
                    </div>

                    <div className="px-3 py-2 md:px-4 md:py-2 bg-white/85 rounded-full flex gap-2 items-center shadow text-sm md:text-base border-2 border-[#2c2c2c]">
                        <span className="font-bold" style={{ color: "#E4AE28" }}>
                            XP
                        </span>
                        <span className="font-semibold">{xp}/100</span>
                    </div>
                </div>
            </div>

            {/* flipbook container wrapper for scaling */}
            <div
                className="flex items-center justify-center relative transform-gpu transition-transform duration-300 origin-top mt-12"
                style={{ transform: `scale(${scale})`, width: 1100, height: 700 }}
            >
                <div
                    id="book"
                    ref={bookRef}
                    className="flipbook"
                >
                    {story.pages.map((page, idx) => (
                        <div key={idx} className={`page ${page.type === "cover" ? "cover-page" : "story-page"}`}>
                            {page.type === "cover" ? (
                                <div className="cover-full">
                                    <img src={story.coverImage} alt={story.title} className="cover-image" />
                                    <div className="cover-overlay">
                                        {/* 
            <h1 className="cover-title">{story.title}</h1>
            <p className="cover-sub">{story.subtitle}</p>
            */}
                                    </div>
                                </div>
                            ) : (
                                <div className={`page-inner p-12 flex items-center justify-center h-full w-full ${idx % 2 === 0 ? "spine-left-shadow" : "spine-right-shadow"}`}>
                                    <div className="text-[20px] leading-[1.9] whitespace-pre-line text-justify pointer-events-none select-none">
                                        {page.content}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>




            {/* Exit Warning Popup */}
            {showExitWarning && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-[#fff4d6] w-[90%] max-w-md rounded-3xl border-[3px] border-[#e9c499] shadow-2xl p-6 md:p-8 text-center">
                        <img src="/assets/budayana/islands/image 90.png" alt="warning" className="w-24 md:w-32 mx-auto mb-3" />
                        <p className="text-lg font-semibold text-[#2f2f2f] leading-relaxed mb-6">
                            Jangan pergi dulu! Progresmu di tahap ini akan hilang kalau kamu berhenti sekarang.
                        </p>
                        <button
                            onClick={() => setShowExitWarning(false)}
                            className="w-full bg-[#f88c63] text-white font-bold py-3 rounded-full shadow-md hover:bg-[#e27852] transition mb-2"
                        >
                            Lanjutkan Belajar
                        </button>
                        <button
                            onClick={() => {
                                setShowExitWarning(false);
                                navigate(-1);
                            }}
                            className="text-[#e64c45] font-bold"
                        >
                            Akhiri Sesi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
