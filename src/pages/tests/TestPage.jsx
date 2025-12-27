import { useEffect, useState, useMemo, useRef } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, ArrowRight, Clock } from "lucide-react"
import { getIslandBySlug } from "../../data/islands"
import {
  useStartAttempt,
  useAddStage,
  useAddQuestionLog,
  useUpdateAttempt,
} from "../../hooks/useAttempts"
import { useQuestions } from "../../hooks/useQuestions"

/**
 * Unified Test Page Component
 * Handles both pre-test and post-test based on testType prop
 * Dynamically loads questions based on storyId and stageType from URL
 */
export default function TestPage({ testType = "pre" }) {
  const { islandSlug, storyId } = useParams()
  const navigate = useNavigate()

  // Use searchParams to track current page (1-indexed in URL, 0-indexed internally)
  const [searchParams, setSearchParams] = useSearchParams({ page: "1" })
  const currentQuestion = Math.max(
    0,
    parseInt(searchParams.get("page") || "1", 10) - 1
  )

  // Get island data (for display purposes)
  const island = getIslandBySlug(islandSlug)

  // Determine stage type for API
  const stageType = testType === "pre" ? "PRE_TEST" : "POST_TEST"

  // Fetch questions from API
  const {
    data: questionsData,
    isLoading: isQuestionsLoading,
    error: questionsError,
  } = useQuestions({
    storyId,
    stageType,
    public: true,
  })

  // Transform API questions to component format
  const questions = useMemo(() => {
    if (!questionsData?.items) return []

    return questionsData.items.map((q) => ({
      id: q.id,
      question: q.questionText,
      options: q.answerOptions?.map((opt) => opt.optionText) || [],
      optionIds: q.answerOptions?.map((opt) => opt.id) || [], // Keep option IDs for logging
      correctAnswer: q.answerOptions?.findIndex((opt) => opt.isCorrect) ?? -1,
      xpValue: q.xpValue || 0,
    }))
  }, [questionsData])

  // API hooks
  const startAttempt = useStartAttempt()
  const addStage = useAddStage()
  const addQuestionLog = useAddQuestionLog()
  const updateAttempt = useUpdateAttempt()

  const isResultMode = searchParams.get("result") === "true"

  // Component state
  const [answers, setAnswers] = useState({})
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [showResults, setShowResults] = useState(isResultMode)
  const [score, setScore] = useState(0)
  const [_, setCorrectCount] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const [attemptId, setAttemptId] = useState(null)
  const [attemptStartedAt, setAttemptStartedAt] = useState(null)

  // Get display info
  const isPreTest = testType === "pre"
  const testTitle = isPreTest ? "Pre-Test" : "Post-Test"
  const displayName = island?.name || "Unknown Island"
  const storyTitle = island?.storyTitle || ""

  // Theme colors based on test type
  const theme = isPreTest ? island?.theme?.preTest : island?.theme?.postTest
  const cardBg = theme?.cardBg || "#c6d7d0"
  const accent = theme?.accent || "#0e7794"
  const contentBg = theme?.contentBg || "#f2f7ff"

  // Timer - calculates elapsed time from attempt's startedAt timestamp
  // Timer Logic
  const startTimeRef = useRef(null)

  useEffect(() => {
    // Initialize start time when questions are loaded
    if (questions.length > 0 && !startTimeRef.current && !showResults) {
      startTimeRef.current = Date.now()
    }
  }, [questions, showResults])

  useEffect(() => {
    if (showResults || questions.length === 0) return

    // Ensure we have a start time
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now()
    }

    const calculateElapsed = () => {
      const startTime = startTimeRef.current
      const now = Date.now()
      const elapsedSeconds = Math.floor((now - startTime) / 1000)
      setTimeElapsed(Math.max(0, elapsedSeconds))
    }

    // Calculate immediately
    calculateElapsed()

    // Then update every second
    const timer = setInterval(calculateElapsed, 1000)
    return () => clearInterval(timer)
  }, [showResults, questions])

  // Start attempt when page loads and storyId is available
  // Skip if we're in result mode (user is viewing results, not taking test)
  useEffect(() => {
    if (isResultMode) return // Don't start attempt in result mode

    if (storyId && !attemptId) {
      startAttempt.mutate(storyId, {
        onSuccess: (data) => {
          setAttemptId(data.id)
          setAttemptStartedAt(data.startedAt) // Capture startedAt from API response

          // Initialize timer with saved duration if resuming
          if (data.totalTimeSeconds) {
            const savedDuration = data.totalTimeSeconds * 1000
            startTimeRef.current = Date.now() - savedDuration
            setTimeElapsed(data.totalTimeSeconds)
          }

          // Restore previous answers from questionLogs if they exist
          if (
            data.questionLogs &&
            data.questionLogs.length > 0 &&
            questions.length > 0
          ) {
            restoreAnswersFromLogs(data.questionLogs)
          } else if (data.questionLogs && data.questionLogs.length > 0) {
            // Store logs temporarily if questions aren't loaded yet
            setPendingLogs(data.questionLogs)
          }
        },
        onError: (error) => {
          console.error("Failed to start attempt:", error)
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, attemptId, isResultMode])

  // Prevent back navigation when showing results
  // If user presses back, redirect to home instead of returning to questions
  useEffect(() => {
    if (!showResults) return

    const handlePopState = (e) => {
      e.preventDefault()
      navigate(`/home?island=${islandSlug}`, { replace: true })
    }

    // Push a dummy state to detect back button
    window.history.pushState(null, "", window.location.href)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [showResults, navigate, islandSlug])

  // State to hold pending logs until questions are loaded
  const [pendingLogs, setPendingLogs] = useState(null)

  // Helper to restore answers from questionLogs
  const restoreAnswersFromLogs = (logs) => {
    if (!logs || !questions.length) return

    // Group logs by questionId and get the latest one based on answeredAt
    const latestLogsByQuestion = {}
    logs.forEach((log) => {
      const existing = latestLogsByQuestion[log.questionId]
      if (
        !existing ||
        new Date(log.answeredAt) > new Date(existing.answeredAt)
      ) {
        latestLogsByQuestion[log.questionId] = log
      }
    })

    // Map logs to answer indices
    const restoredAnswers = {}
    questions.forEach((q, questionIndex) => {
      const log = latestLogsByQuestion[q.id]
      if (log) {
        // Find the option index by matching userAnswerText with option text
        const optionIndex = q.options.findIndex(
          (optText) => optText === log.userAnswerText
        )
        if (optionIndex !== -1) {
          restoredAnswers[questionIndex] = optionIndex
        }
      }
    })

    if (Object.keys(restoredAnswers).length > 0) {
      setAnswers((prev) => ({ ...prev, ...restoredAnswers }))
    }
  }

  // Restore answers when questions are loaded and we have pending logs
  useEffect(() => {
    if (pendingLogs && questions.length > 0) {
      restoreAnswersFromLogs(pendingLogs)
      setPendingLogs(null) // Clear pending logs after processing
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, pendingLogs])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")} : ${String(secs).padStart(2, "0")}`
  }

  // Helper to update page in search params
  const setCurrentPage = (pageIndex) => {
    // pageIndex is 0-indexed, URL page is 1-indexed
    setSearchParams({ page: String(pageIndex + 1) }, { replace: true })
  }



  const handleAnswerSelect = (index) =>
    setAnswers({ ...answers, [currentQuestion]: index })

  // State to track correctness of answers
  const [correctness, setCorrectness] = useState({})

  const handleNext = () => {
    // Log the answer before moving to next question
    logCurrentAnswer()
    const nextPage = Math.min(currentQuestion + 1, questions.length - 1)
    setCurrentPage(nextPage)
  }

  const handleExit = () => {
    setShowWarning(true)
  }

  const handlePrevQuestion = () => {
    // Log the answer before moving to previous question
    logCurrentAnswer()
    const prevPage = Math.max(0, currentQuestion - 1)
    setCurrentPage(prevPage)
  }

  // Helper to log current question answer to API and update correctness
  const logCurrentAnswer = async () => {
    const selectedIndex = answers[currentQuestion]
    if (selectedIndex === undefined || !attemptId) return

    const currentQ = questions[currentQuestion]
    if (!currentQ) return

    const selectedOptionId = currentQ.optionIds[selectedIndex]
    if (!selectedOptionId) return

    try {
      const response = await addQuestionLog.mutateAsync({
        attemptId,
        logData: {
          questionId: currentQ.id,
          selectedOptionId,
          attemptCount: 1,
        },
      })

      // Update correctness state based on API response
      if (response && typeof response.isCorrect === 'boolean') {
        setCorrectness(prev => ({
          ...prev,
          [currentQuestion]: response.isCorrect
        }))
      }
    } catch (error) {
      console.error("Failed to log answer:", error)
    }
  }

  // Handle Finish
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFinish = async () => {
    setIsSubmitting(true)
    // Log and verify the last question's answer before finishing
    await logCurrentAnswer()

    // Count correct answers using the verified correctness state
    let correct = 0
    questions.forEach((q, i) => {
      if (correctness[i] === true) {
        correct++
      } else if (correctness[i] === undefined) {
        if (answers[i] === q.correctAnswer && q.correctAnswer !== -1) correct++
      }
    })

    setCorrectCount(correct)

    // Set initial local score
    const localScore = Math.round((correct / questions.length) * 100)
    setScore(localScore)

    // Update URL to result mode 
    setSearchParams({ result: "true" }, { replace: true })

    if (attemptId) {
      try {
        // 1. Add stage completion record
        await addStage.mutateAsync({
          attemptId,
          stageData: {
            stageType: stageType,
            timeSpentSeconds: timeElapsed,
            xpGained: 0,
          },
        })

        // 2. Mark attempt as finished
        await updateAttempt.mutateAsync({
          attemptId,
          data: {
            finishedAt: new Date().toISOString(),
            totalTimeSeconds: timeElapsed,
            totalXpGained: 0,
            [testType === "pre" ? "preTestScore" : "postTestScore"]: localScore,
          },
        })
      } catch (error) {
        console.error("Failed to save finish data:", error)
      }
    }

    setIsSubmitting(false)
    setShowResults(true)
  }

  const handleBackToHome = () => {
    // const nextStage = getNextStage(isPreTest ? "pre-test" : "post-test")
    // if (nextStage) {
    //   navigate(`/islands/${islandSlug}/${nextStage}`)
    // } else {
    navigate(`/home?island=${islandSlug}`)
    // }
  }

  const handleConfirmExit = async () => {
    setIsSubmitting(true)
    if (attemptId) {
      try {
        await logCurrentAnswer() // Ensure last answer is logged/cleared
        await updateAttempt.mutateAsync({
          attemptId,
          data: {
            // finishedAt: new Date().toISOString(), // removed to prevent premature finishing
            totalTimeSeconds: timeElapsed,
          },
        })
        // Short delay to ensure backend consistency
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error("Failed to finish attempt on exit:", error)
      }
    }
    navigate(`/home?island=${islandSlug}`)
  }

  // Handle invalid island
  if (!island) {
    return (
      <div className='min-h-screen bg-[#fdf4d7] flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-[#2c2c2c] mb-4'>
            Island not found
          </h1>
          <button
            onClick={() => navigate(`/home?island=${islandSlug}`)}
            className='bg-[#F7885E] text-white px-6 py-2 rounded-full font-semibold'
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  // Handle loading state
  if (isQuestionsLoading) {
    return (
      <div className='min-h-screen bg-[#fdf4d7] flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-4 border-[#0e7794] mx-auto mb-4'></div>
          <p className='text-xl font-semibold text-[#2c2c2c]'>
            Memuat pertanyaan...
          </p>
        </div>
      </div>
    )
  }

  // Handle error state
  if (questionsError) {
    return (
      <div className='min-h-screen bg-[#fdf4d7] flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-[#e64c45] mb-4'>
            Gagal memuat pertanyaan
          </h1>
          <p className='text-[#2c2c2c] mb-6'>
            {questionsError.message || "Terjadi kesalahan. Silakan coba lagi."}
          </p>
          <button
            onClick={() => navigate("/home")}
            className='bg-[#F7885E] text-white px-6 py-2 rounded-full font-semibold'
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  // Handle empty questions
  if (!questions.length) {
    return (
      <div className='min-h-screen bg-[#fdf4d7] flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-[#2c2c2c] mb-4'>
            Tidak ada pertanyaan
          </h1>
          <p className='text-[#5a5a5a] mb-6'>
            Belum ada pertanyaan untuk test ini.
          </p>
          <button
            onClick={() => navigate("/home")}
            className='bg-[#F7885E] text-white px-6 py-2 rounded-full font-semibold'
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  // RESULTS SCREEN
  if (showResults) {
    return (
      <div className='min-h-screen bg-[#fdf4d7] flex items-center justify-center px-4 py-10'>
        <div className='w-full max-w-4xl mx-auto px-2'>
          <div className='rounded-[40px] shadow-2xl p-6 md:p-10 border-[3px] border-[#2c2c2c] text-center min-h-125 flex flex-col items-center justify-center relative bg-[#fdf8e4]'>
            {/* Header Badge */}
            <div className='bg-[#E4AE28] text-white font-extrabold text-3xl md:text-4xl px-12 py-3 rounded-full shadow-lg mb-8 border-[3px] border-[#fff4d6] ring-4 ring-[#E4AE28]/30'>
              Berhasil!
            </div>

            {/* Stats Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-2xl mb-8 md:mb-10'>
              {/* Waktu Card - Pink */}
              <div className='bg-[#FF9ECF] rounded-3xl p-6 border-[3px] border-[#2c2c2c] shadow-lg flex flex-col items-center justify-center gap-2 transform hover:scale-105 transition duration-300'>
                <span className='text-[#2c2c2c] font-extrabold text-xl md:text-2xl'>
                  Waktu
                </span>
                <div className='text-[#2c2c2c] font-black text-xl md:text-3xl flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 leading-tight'>
                  <span>{Math.floor(timeElapsed / 60)} Menit</span>
                  <span>{timeElapsed % 60} Detik</span>
                </div>
              </div>

              {/* Nilai Card - Green */}
              <div className='bg-[#5ADCB6] rounded-3xl p-6 border-[3px] border-[#2c2c2c] shadow-lg flex flex-col items-center justify-center gap-2 transform hover:scale-105 transition duration-300'>
                <span className='text-[#2c2c2c] font-extrabold text-xl md:text-2xl'>
                  Nilai
                </span>
                <span className='text-[#2c2c2c] font-black text-3xl md:text-4xl'>
                  {Math.round(score)}/100
                </span>
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleBackToHome}
              className='bg-[#F7885E] hover:bg-[#e4764c] text-white font-extrabold text-xl md:text-2xl px-12 py-3 md:py-4 rounded-full shadow-lg border-b-4 border-[#c9623d] active:border-b-0 active:translate-y-1 transition-all'
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    )
  }

  const q = questions[currentQuestion]
  const isLastQuestion = currentQuestion === questions.length - 1

  return (
    <div className='min-h-screen bg-[#fdf4d7] flex items-center justify-center px-4 py-10'>
      <div className='w-full max-w-6xl'>
        {/* HEADER */}
        <div className='relative flex items-center justify-between mb-6'>
          <button
            onClick={handleExit}
            className='w-12 h-12 rounded-full border-2 bg-white/85 border-[#1f1f1f] flex items-center justify-center transition hover:bg-black/5'
          >
            <ArrowLeft size={22} />
          </button>

          <div className='absolute left-1/2 -translate-x-1/2 text-4xl font-semibold text-[#2f2f2f]'>
            {testTitle} {displayName}
          </div>

          <div className='flex items-center gap-2 bg-white/70 px-4 py-2 rounded-full shadow-sm border-2 border-[#2c2c2c]'>
            <Clock size={20} className='text-[#2c2c2c]' />
            <span className='text-[#2c2c2c] font-semibold tracking-[0.12em]'>
              {formatTime(timeElapsed)}
            </span>
          </div>
        </div>

        {/* QUESTION CARD */}
        <div
          className='rounded-[28px] border shadow-[0_18px_40px_rgba(0,0,0,0.12)] p-6'
          style={{ backgroundColor: cardBg }}
        >
          <div className='flex justify-center mb-6'>
            <div className='bg-white px-12 py-3 rounded-2xl shadow-md text-lg font-bold text-[#202020]'>
              {storyTitle}
            </div>
          </div>

          <div
            className='bg-white rounded-[26px] border-[3px] px-8 py-8 shadow-[0_12px_26px_rgba(0,0,0,0.08)]'
            style={{ borderColor: accent }}
          >
            <div className='flex items-center gap-4 mb-8'>
              <div
                className='w-11 h-11 rounded-full text-white font-bold flex items-center justify-center shadow-inner'
                style={{ backgroundColor: accent }}
              >
                {currentQuestion + 1}
              </div>
              <p className='text-lg font-semibold text-[#2c2c2c] leading-relaxed'>
                {q?.question}
              </p>
            </div>

            <div className='flex flex-col gap-4'>
              {q?.options.map((opt, i) => {
                const selected = answers[currentQuestion] === i
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswerSelect(i)}
                    className='w-full text-left font-semibold rounded-2xl border-[2.5px] px-5 py-4 transition-transform duration-150'
                    style={{
                      backgroundColor: selected ? accent : contentBg,
                      color: selected ? "white" : "#1f1f1f",
                      borderColor: accent,
                      boxShadow: selected
                        ? `0 10px 20px ${accent}40`
                        : undefined,
                      transform: selected ? undefined : undefined,
                    }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>

          {/* FOOTER NAVIGATION */}
          <div className='mt-6 flex items-center justify-between'>
            <button
              onClick={handlePrevQuestion}
              disabled={currentQuestion === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold shadow-md transition ${currentQuestion === 0
                ? "bg-[#f2c3c3] cursor-not-allowed"
                : "bg-[#e76964] hover:bg-[#d95e59]"
                }`}
            >
              <ArrowLeft size={20} />
              Sebelumnya
            </button>

            <div className='text-sm font-semibold text-[#5a5a5a]'>
              Halaman {currentQuestion + 1} dari {questions.length}
            </div>

            {isLastQuestion ? (
              <button
                onClick={handleFinish}
                disabled={answers[currentQuestion] === undefined || isSubmitting}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold shadow-md transition ${answers[currentQuestion] === undefined || isSubmitting
                  ? "bg-gray-300 cursor-not-allowed opacity-50"
                  : "bg-[#19758E] hover:bg-[#17748D]"
                  }`}
              >
                {isSubmitting ? "Menyimpan..." : "Selesai"}
                {!isSubmitting && <ArrowRight size={20} />}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={answers[currentQuestion] === undefined}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold shadow-md transition ${answers[currentQuestion] === undefined
                  ? "bg-gray-300 cursor-not-allowed opacity-50"
                  : "bg-[#19758E] hover:bg-[#17748D]"
                  }`}
              >
                Berikutnya
                <ArrowRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* WARNING POPUP */}
      {showWarning && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50'>
          <div className='bg-[#fff4d6] w-[90%] max-w-md rounded-3xl border-[3px] border-[#e9c499] shadow-2xl p-8 text-center'>
            <img
              src='/assets/budayana/islands/image 90.png'
              alt='warning'
              className='w-32 mx-auto mb-3'
            />

            <p className='text-lg font-semibold text-[#2f2f2f] leading-relaxed mb-6'>
              Kamu yakin mau keluar?
            </p>

            <button
              onClick={() => setShowWarning(false)}
              className='w-full bg-[#f88c63] text-white font-bold py-3 rounded-full shadow-md hover:bg-[#e27852] transition mb-2'
            >
              Lanjutkan Belajar
            </button>

            <button
              onClick={handleConfirmExit}
              disabled={isSubmitting}
              className={`font-bold ${isSubmitting ? "text-gray-400" : "text-[#e64c45]"}`}
            >
              {isSubmitting ? "Mengakhiri..." : "Keluar"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
