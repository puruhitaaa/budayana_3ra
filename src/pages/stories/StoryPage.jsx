import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, ArrowRight, Clock, Sparkles } from "lucide-react"
import { useStory } from "../../hooks/useStories"
import {
  useStartAttempt,
  useAddStage,
  useUpdateAttempt,
} from "../../hooks/useAttempts"
import "./flipbook.css"

const $ = window.$

const formatTime = (seconds) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0")
  const secs = String(seconds % 60).padStart(2, "0")
  return `${mins} : ${secs}`
}

/**
 * Unified Story Page Component (Flipbook)
 * Dynamically loads story data from API based on storyId
 * Uses turn.js for flipbook effect
 */
export default function StoryPage() {
  const { islandSlug, storyId } = useParams()
  const navigate = useNavigate()

  // Use searchParams to track current page (1-indexed in URL)
  const [searchParams, setSearchParams] = useSearchParams({ page: "1" })
  const currentPageFromUrl = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10)
  )

  // Helper to update page in search params
  const setCurrentPageUrl = useCallback(
    (page) => {
      setSearchParams({ page: String(page) }, { replace: true })
    },
    [setSearchParams]
  )

  // API Hooks
  const { data: story, isLoading: isStoryLoading } = useStory(storyId)
  const startAttempt = useStartAttempt()
  const addStage = useAddStage()
  const updateAttempt = useUpdateAttempt()

  // Component state
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [timerRunning, setTimerRunning] = useState(true)
  const [xp, setXp] = useState(0)
  const [showExitWarning, setShowExitWarning] = useState(false)
  const [scale, setScale] = useState(1)
  const [attemptId, setAttemptId] = useState(null)
  const [attemptStartedAt, setAttemptStartedAt] = useState(null)
  const [xpHighlight, setXpHighlight] = useState(false)
  const [pagesReadArray, setPagesReadArray] = useState([1]) // Use array instead of Set for stable dependencies
  const [showResults, setShowResults] = useState(false)

  // book ref and sizing
  const bookRef = useRef(null)
  const containerRef = useRef(null)
  const initRef = useRef(false)
  const lastPageRef = useRef(1) // Use ref instead of state to avoid dependency issues

  // Get total pages from staticSlides
  const totalPages = story?.staticSlides?.length || 0
  const xpPerPage = totalPages > 0 ? 100 / totalPages : 0

  // Convert array to Set for efficient lookups
  const pagesRead = useMemo(() => new Set(pagesReadArray), [pagesReadArray])

  // LocalStorage helpers
  const getStorageKey = (key) => `budayana_story_${storyId}_${key}`

  const saveToStorage = () => {
    if (!storyId) return
    try {
      localStorage.setItem(getStorageKey("xp"), xp.toString())
      localStorage.setItem(
        getStorageKey("pagesRead"),
        JSON.stringify(pagesReadArray)
      )
    } catch (e) {
      console.warn("Failed to save to localStorage:", e)
    }
  }

  const loadFromStorage = () => {
    if (!storyId) return
    try {
      const savedXp = localStorage.getItem(getStorageKey("xp"))
      const savedPages = localStorage.getItem(getStorageKey("pagesRead"))

      if (savedXp) setXp(parseFloat(savedXp))
      if (savedPages) {
        const pages = JSON.parse(savedPages)
        setPagesReadArray(pages)
      }
    } catch (e) {
      console.warn("Failed to load from localStorage:", e)
    }
  }

  const clearStorage = () => {
    if (!storyId) return
    try {
      localStorage.removeItem(getStorageKey("xp"))
      localStorage.removeItem(getStorageKey("pagesRead"))
    } catch (e) {
      console.warn("Failed to clear localStorage:", e)
    }
  }

  // Load from localStorage on mount
  useEffect(() => {
    loadFromStorage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId])

  // Save to localStorage whenever XP or pagesRead changes
  useEffect(() => {
    saveToStorage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xp, pagesReadArray])

  // Start Attempt
  useEffect(() => {
    if (storyId && !attemptId && story?.storyType === "STATIC") {
      startAttempt.mutate(storyId, {
        onSuccess: (data) => {
          setAttemptId(data.id)
          setAttemptStartedAt(data.startedAt)
        },
        onError: (err) => console.error("Failed to start attempt", err),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, attemptId, story])

  // Timer Logic
  useEffect(() => {
    if (!timerRunning || !attemptStartedAt) return

    const calculateElapsed = () => {
      const startTime = new Date(attemptStartedAt).getTime()
      const now = Date.now()
      const elapsedSeconds = Math.floor(
        ((max) => (max > 0 ? max : 0))((now - startTime) / 1000)
      )
      setTimeElapsed(elapsedSeconds)
    }

    calculateElapsed()
    const t = setInterval(calculateElapsed, 1000)
    return () => clearInterval(t)
  }, [timerRunning, attemptStartedAt])

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

  // XP highlight effect timeout
  useEffect(() => {
    if (xpHighlight) {
      const timer = setTimeout(() => setXpHighlight(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [xpHighlight])

  // Initialize turn.js
  useLayoutEffect(() => {
    if (!containerRef.current || !story || !$ || totalPages === 0) return

    // Capture ref value at start of effect for cleanup
    const currentBook = bookRef.current

    if (currentBook && !initRef.current) {
      const b = $(currentBook)
      b.turn({
        width: 1100,
        height: 700,
        autoCenter: true,
        gradients: true,
        acceleration: true,
        elevation: 50,
        duration: 600,
        pages: totalPages,
        display: "single", // Single page mode to prevent skipping
        page: currentPageFromUrl, // Set initial page from URL
      })

      b.bind("turned", (event, page) => {
        const lastPage = lastPageRef.current
        const isForward = page > lastPage
        lastPageRef.current = page

        // Update URL
        setCurrentPageUrl(page)

        // Only add XP when navigating forward AND haven't read this page yet
        if (isForward && !pagesRead.has(page)) {
          setPagesReadArray((prev) => [...prev, page])
          setXp((prevXp) => Math.min(100, prevXp + xpPerPage))
          setXpHighlight(true)
        }
      })

      initRef.current = true
    }

    return () => {
      if (initRef.current && currentBook && $(currentBook).turn) {
        try {
          $(currentBook).turn("destroy").remove()
        } catch {
          /* ignore */
        }
      }
    }
  }, [
    totalPages,
    story,
    currentPageFromUrl,
    pagesRead,
    xpPerPage,
    setCurrentPageUrl,
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFinish = async () => {
    setIsSubmitting(true)
    setTimerRunning(false)

    // Ensure XP is exactly 100 for completion
    const xpGained = 100

    if (attemptId) {
      try {
        // Add Stage
        await addStage.mutateAsync({
          attemptId,
          stageData: {
            stageType: "STORY",
            timeSpentSeconds: timeElapsed,
            xpGained: xpGained,
          },
        })

        // Update Attempt (Finish)
        await updateAttempt.mutateAsync({
          attemptId,
          data: {
            finishedAt: new Date().toISOString(),
            totalTimeSeconds: timeElapsed,
          },
        })
      } catch (error) {
        console.error("Failed to save story finish data", error)
      }
    }

    // Clear localStorage when finished
    clearStorage()

    setIsSubmitting(false)
    // Show results instead of navigating immediately
    setShowResults(true)
  }

  // Handle explicit exit (abandon)
  const [isExitSubmitting, setIsExitSubmitting] = useState(false)

  const handleExit = async () => {
    setIsExitSubmitting(true)
    // Clear local storage
    clearStorage()

    if (attemptId) {
      try {
        await updateAttempt.mutateAsync({
          attemptId,
          data: {
            finishedAt: new Date().toISOString(),
            totalTimeSeconds: timeElapsed,
          },
        })
        // Short delay
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error("Failed to finish attempt on exit:", error)
      }
    }

    // Navigate away
    navigate(`/home?island=${islandSlug}`)
  }

  const renderResults = () => {
    return (
      <div className='w-full max-w-4xl mx-auto px-2 absolute z-50'>
        <div className='bg-white/95 backdrop-blur-md rounded-[40px] shadow-2xl p-6 md:p-10 border-[3px] border-[#2c2c2c] text-center'>
          <div className='bg-[#E4AE28] text-white font-extrabold text-3xl px-12 py-3 rounded-full shadow-lg mb-8 inline-block'>
            Selesai!
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
            <div className='bg-[#FF9ECF] rounded-3xl p-6 border-[3px] border-[#2c2c2c]'>
              <span className='font-bold text-xl'>Waktu</span>
              <div className='text-3xl font-black'>{formatTime(timeElapsed)}</div>
            </div>
            <div className='bg-[#BDEBFF] rounded-3xl p-6 border-[3px] border-[#2c2c2c]'>
              <span className='font-bold text-xl'>Total XP</span>
              <div className='text-3xl font-black'>+100 XP</div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/home?island=${islandSlug}`)}
            className='bg-[#F7885E] text-white font-extrabold text-xl px-12 py-3 rounded-full shadow-lg hover:scale-105 transition border-2 border-[#c7623a]'
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  // Handle loading/error states
  if (isStoryLoading)
    return (
      <div className='min-h-screen bg-gradient-to-br from-[#fef8e7] to-[#f4e4c1] flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-4 border-[#E4AE28] border-t-transparent mx-auto mb-4'></div>
          <p className='text-lg font-semibold text-[#2c2c2c]'>
            Memuat cerita...
          </p>
        </div>
      </div>
    )

  if (!story)
    return (
      <div className='min-h-screen bg-gradient-to-br from-[#fef8e7] to-[#f4e4c1] flex items-center justify-center'>
        <div className='text-center p-10'>
          <p className='text-lg font-semibold text-[#2c2c2c]'>
            Story not found
          </p>
        </div>
      </div>
    )

  if (!story.staticSlides || story.staticSlides.length === 0)
    return (
      <div className='min-h-screen bg-gradient-to-br from-[#fef8e7] to-[#f4e4c1] flex items-center justify-center'>
        <div className='text-center p-10'>
          <p className='text-lg font-semibold text-[#2c2c2c]'>
            No story slides available
          </p>
        </div>
      </div>
    )

  return (
    <div
      ref={containerRef}
      className='h-screen w-full flex flex-col items-center justify-center overflow-hidden relative'
      style={{
        background: story.backgroundImage
          ? `linear-gradient(rgba(254, 248, 231, 0.85), rgba(244, 228, 193, 0.85)), url('${story.backgroundImage}')`
          : "linear-gradient(135deg, #fef8e7 0%, #f4e4c1 100%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {showResults && (
        <div className='absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center'>
          {renderResults()}
        </div>
      )}

      {/* Floating arrows */}
      <div className='absolute inset-0 flex items-center justify-center pointer-events-none z-20'>
        <div className='w-full max-w-[95%] md:max-w-[92%] lg:max-w-350 flex justify-between px-2'>
          <button
            onClick={() => $(bookRef.current).turn("previous")}
            disabled={currentPageFromUrl === 1}
            className='pointer-events-auto bg-white/90 backdrop-blur-sm text-[#2c2c2c] w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all hover:bg-white border-2 border-[#2c2c2c] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100'
          >
            <ArrowLeft size={28} strokeWidth={2.5} />
          </button>
          {currentPageFromUrl >= totalPages ? (
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className={`pointer-events-auto bg-linear-to-r from-[#E4AE28] to-[#F7C951] text-white px-8 py-4 rounded-full flex items-center gap-2 shadow-xl hover:scale-105 transition-all font-bold text-lg border-2 border-[#c79620] ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <Sparkles size={20} />
              {isSubmitting ? "Menyimpan..." : "Selesai"}
            </button>
          ) : (
            <button
              onClick={() => $(bookRef.current).turn("next")}
              className='pointer-events-auto bg-white/90 backdrop-blur-sm text-[#2c2c2c] w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all hover:bg-white border-2 border-[#2c2c2c]'
            >
              <ArrowRight size={28} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className='w-full max-w-[95%] md:max-w-[92%] lg:max-w-350 grid grid-cols-3 items-center mb-4 relative z-30'>
        <div className='flex justify-start'>
          <button
            onClick={() => setShowExitWarning(true)}
            className='px-5 py-2.5 bg-white/90 backdrop-blur-sm border-2 border-[#2c2c2c] flex items-center gap-2 rounded-full shadow-md hover:bg-white hover:scale-105 transition-all font-semibold text-sm md:text-base'
          >
            <ArrowLeft size={18} /> Kembali
          </button>
        </div>
        <div className='flex justify-center'>
          <div className='bg-white/90 backdrop-blur-sm px-6 py-2.5 rounded-full border-2 border-[#2c2c2c] shadow-md'>
            <span className='text-[#2c2c2c] font-bold text-xl'>
              {currentPageFromUrl} / {totalPages}
            </span>
          </div>
        </div>
        <div className='flex justify-end items-center gap-3'>
          <div className='flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-md border-2 border-[#2c2c2c]'>
            <Clock size={20} className='text-[#2c2c2c]' />
            <span className='text-[#2c2c2c] font-semibold tracking-wide'>
              {formatTime(timeElapsed)}
            </span>
          </div>
          <div
            className={`px-4 py-2.5 bg-white/90 backdrop-blur-sm rounded-full flex gap-2 items-center shadow-md text-base border-2 transition-all duration-300 ${xpHighlight
              ? "border-green-500 scale-110 bg-green-50"
              : "border-[#2c2c2c]"
              }`}
          >
            <span className='font-bold' style={{ color: "#E4AE28" }}>
              XP
            </span>
            <span
              className={`font-bold transition-colors duration-300 ${xpHighlight ? "text-green-600" : "text-[#2c2c2c]"
                }`}
            >
              {Math.round(xp)}/100
            </span>
          </div>
        </div>
      </div>

      {/* Flipbook container */}
      <div
        className='flex items-center justify-center relative transform-gpu transition-transform duration-300 origin-top'
        style={{ transform: `scale(${scale})`, width: 1100, height: 700 }}
      >
        <div id='book' ref={bookRef} className='flipbook shadow-2xl'>
          {story.staticSlides.map((slide, idx) => {
            const isCover = slide.slideType === "COVER"

            return (
              <div
                key={slide.id}
                className={`page ${isCover ? "cover-page" : "story-page"}`}
              >
                {isCover ? (
                  <div className='cover-full'>
                    <img
                      src={slide.imageUrl || story.coverImage}
                      alt={story.title}
                      className='cover-image'
                    />
                    <div className='cover-overlay'>
                      <h1 className='cover-title'>{story.title}</h1>
                      <p className='cover-sub'>{story.subtitle}</p>
                    </div>
                  </div>
                ) : (
                  <div className='page-inner'>
                    {slide.imageUrl && (
                      <div className='mb-6'>
                        <img
                          src={slide.imageUrl}
                          alt='Story'
                          className='max-h-80 max-w-full object-contain rounded-xl shadow-lg'
                        />
                      </div>
                    )}
                    <div className='text-lg leading-relaxed text-center text-[#2c2c2c] font-serif px-4'>
                      {slide.contentText}
                    </div>
                    <div className='page-number'>{idx + 1}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Exit Warning Popup */}
      {showExitWarning && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4'>
          <div className='bg-linear-to-br from-[#fff8e7] to-[#ffe8c1] w-[90%] max-w-md rounded-3xl border-4 border-[#e9c499] shadow-2xl p-8 text-center'>
            <img
              src='/assets/budayana/islands/image 90.png'
              alt='warning'
              className='w-32 mx-auto mb-4'
            />
            <p className='text-xl font-bold text-[#2c2c2c] leading-relaxed mb-6'>
              Jangan pergi dulu! Progresmu di tahap ini akan hilang kalau kamu
              berhenti sekarang.
            </p>
            <button
              onClick={() => setShowExitWarning(false)}
              className='w-full bg-linear-to-r from-[#f88c63] to-[#ff6b45] text-white font-bold py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all mb-3 border-2 border-[#c7623a]'
            >
              Lanjutkan Belajar
            </button>
            <button
              onClick={handleExit}
              disabled={isExitSubmitting}
              className={`font-bold hover:underline ${isExitSubmitting ? "text-gray-400" : "text-[#e64c45]"}`}
            >
              {isExitSubmitting ? "Mengakhiri..." : "Akhiri Sesi"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
