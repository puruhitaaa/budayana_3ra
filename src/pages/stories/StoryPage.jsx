import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, Clock } from "lucide-react"
import { getStoryByIsland } from "../../data/stories"
import { getIslandBySlug } from "../../data/islands"

const $ = window.$

const formatTime = (seconds) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0")
  const secs = String(seconds % 60).padStart(2, "0")
  return `${mins} : ${secs}`
}

/**
 * Unified Story Page Component (Flipbook)
 * Dynamically loads story data based on island slug from URL
 * Uses turn.js for flipbook effect
 */
export default function StoryPage() {
  const { islandSlug } = useParams()
  const navigate = useNavigate()

  // Get island and story data
  const island = getIslandBySlug(islandSlug)
  const story = getStoryByIsland(islandSlug)
  const totalPages = story?.pages?.length || 0

  // Component state
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [xp, setXp] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [showExitWarning, setShowExitWarning] = useState(false)
  const [scale, setScale] = useState(1)

  // book ref and sizing
  const bookRef = useRef(null)
  const containerRef = useRef(null)
  const initRef = useRef(false)

  // Timer
  useEffect(() => {
    const t = setInterval(() => setTimeElapsed((v) => v + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Handle window resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const baseWidth = 1100
      const baseHeight = 700
      const maxWidth = w - 180
      const maxHeight = h - 80
      const scaleX = maxWidth / baseWidth
      const scaleY = maxHeight / baseHeight
      setScale(Math.min(scaleX, scaleY, 1))
    }
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Initialize turn.js
  useLayoutEffect(() => {
    if (!containerRef.current || !story || !$) return

    if (bookRef.current && !initRef.current) {
      const b = $(bookRef.current)
      b.turn({
        width: 1100,
        height: 700,
        autoCenter: true,
        gradients: true,
        acceleration: true,
        elevation: 50,
        duration: 600,
        pages: totalPages,
      })

      b.bind("turning", (event, page) => {
        setCurrentPage(page)
        if (page >= totalPages - 1) setXp(100)
      })

      initRef.current = true
    }

    return () => {
      const currentBookRef = bookRef.current
      if (initRef.current && currentBookRef && $(currentBookRef).turn) {
        try {
          $(currentBookRef).turn("destroy").remove()
        } catch {
          /* ignore */
        }
      }
    }
  }, [totalPages, story])

  const handleFinish = () => {
    navigate(`/islands/${islandSlug}/game`)
  }

  // Handle invalid island/story
  if (!island || !story) {
    return (
      <div className='min-h-screen bg-[#fdf4d7] flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-[#2c2c2c] mb-4'>
            Story not found for this island
          </h1>
          <button
            onClick={() => navigate("/")}
            className='bg-[#F7885E] text-white px-6 py-2 rounded-full font-semibold'
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className='h-screen w-full flex flex-col items-center justify-center overflow-hidden relative'
      style={{
        backgroundImage: story.backgroundImage
          ? `url('${story.backgroundImage}')`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Floating arrows */}
      <div className='absolute inset-0 flex items-center justify-center pointer-events-none z-20'>
        <div className='w-full max-w-[95%] md:max-w-[92%] lg:max-w-[1400px] flex justify-between px-2'>
          <button
            onClick={() => $(bookRef.current).turn("previous")}
            className='pointer-events-auto bg-[#E3DBD5] text-black w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition'
          >
            <ArrowLeft size={26} />
          </button>
          {currentPage >= totalPages - 1 ? (
            <button
              onClick={handleFinish}
              className='pointer-events-auto bg-[#E3DBD5] text-black px-6 py-3 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition font-bold'
            >
              Selesai
            </button>
          ) : (
            <button
              onClick={() => $(bookRef.current).turn("next")}
              className='pointer-events-auto bg-[#E3DBD5] text-black w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition'
            >
              <ArrowRight size={26} />
            </button>
          )}
        </div>
      </div>

      {/* Flipbook styles */}
      <style>
        {`
#book {
  width: 1100px !important;
  height: 700px !important;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  margin: 0 auto;
}
.page {
  width: 550px !important;
  height: 700px !important;
  background-color: white;
  font-size: 18px;
}
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
  pointer-events: none;
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
.story-page {
  background: #fffaf3 !important;
  background-image: url('/assets/paper-texture.png') !important;
  background-size: cover !important;
  background-position: center !important;
}
.spine-left-shadow {
  box-shadow: inset 20px 0 50px -15px rgba(0,0,0,0.15);
}
.spine-right-shadow {
  box-shadow: inset -20px 0 50px -15px rgba(0,0,0,0.15);
}
`}
      </style>

      {/* Header */}
      <div className='w-full max-w-[95%] md:max-w-[92%] lg:max-w-[1400px] grid grid-cols-3 items-center mb-0 relative z-30'>
        <div className='flex justify-start'>
          <button
            onClick={() => setShowExitWarning(true)}
            className='px-4 py-2 md:px-5 md:py-2 bg-white/85 border-2 border-[#2c2c2c] flex items-center gap-2 rounded-full shadow hover:bg-gray-100 transition font-semibold text-sm md:text-base'
          >
            <ArrowLeft size={18} /> Kembali
          </button>
        </div>
        <div className='flex justify-center'>
          <span className='text-white font-bold text-2xl drop-shadow-md'>
            {currentPage} / {totalPages}
          </span>
        </div>
        <div className='flex justify-end items-center gap-2 md:gap-3'>
          <div className='flex items-center gap-2 bg-white/85 px-4 py-2 rounded-full shadow-sm border-2 border-[#2c2c2c]'>
            <Clock size={20} className='text-[#2c2c2c]' />
            <span className='text-[#2c2c2c] font-semibold tracking-[0.12em]'>
              {formatTime(timeElapsed)}
            </span>
          </div>
          <div className='px-3 py-2 md:px-4 md:py-2 bg-white/85 rounded-full flex gap-2 items-center shadow text-sm md:text-base border-2 border-[#2c2c2c]'>
            <span className='font-bold' style={{ color: "#E4AE28" }}>
              XP
            </span>
            <span className='font-semibold'>{xp}/100</span>
          </div>
        </div>
      </div>

      {/* Flipbook container */}
      <div
        className='flex items-center justify-center relative transform-gpu transition-transform duration-300 origin-top mt-12'
        style={{ transform: `scale(${scale})`, width: 1100, height: 700 }}
      >
        <div id='book' ref={bookRef} className='flipbook'>
          {story.pages.map((page, idx) => (
            <div
              key={idx}
              className={`page ${
                page.type === "cover" ? "cover-page" : "story-page"
              }`}
            >
              {page.type === "cover" ? (
                <div className='cover-full'>
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className='cover-image'
                  />
                  <div className='cover-overlay'>
                    <h1 className='cover-title'>{story.title}</h1>
                    <p className='cover-sub'>{story.subtitle}</p>
                  </div>
                </div>
              ) : (
                <div
                  className={`page-inner p-12 flex items-center justify-center h-full w-full ${
                    idx % 2 === 0 ? "spine-left-shadow" : "spine-right-shadow"
                  }`}
                >
                  <div className='text-[20px] leading-[1.9] whitespace-pre-line text-justify pointer-events-none select-none'>
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
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4'>
          <div className='bg-[#fff4d6] w-[90%] max-w-md rounded-3xl border-[3px] border-[#e9c499] shadow-2xl p-6 md:p-8 text-center'>
            <img
              src='/assets/budayana/islands/image 90.png'
              alt='warning'
              className='w-24 md:w-32 mx-auto mb-3'
            />
            <p className='text-lg font-semibold text-[#2f2f2f] leading-relaxed mb-6'>
              Jangan pergi dulu! Progresmu di tahap ini akan hilang kalau kamu
              berhenti sekarang.
            </p>
            <button
              onClick={() => setShowExitWarning(false)}
              className='w-full bg-[#f88c63] text-white font-bold py-3 rounded-full shadow-md hover:bg-[#e27852] transition mb-2'
            >
              Lanjutkan Belajar
            </button>
            <button
              onClick={() => {
                setShowExitWarning(false)
                navigate(-1)
              }}
              className='text-[#e64c45] font-bold'
            >
              Akhiri Sesi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
