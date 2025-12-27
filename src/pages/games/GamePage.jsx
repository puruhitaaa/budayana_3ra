import { useEffect, useMemo, useState, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, ArrowRight, Clock, Check, X } from "lucide-react"
import { useStory } from "../../hooks/useStories"
import { getGameByIsland } from "../../data/games"
import {
  useStartAttempt,
  useAddStage,
  useAddQuestionLog,
  useUpdateAttempt,
} from "../../hooks/useAttempts"

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")
  const secs = (seconds % 60).toString().padStart(2, "0")
  return `${mins} : ${secs}`
}

/**
 * Game Page Component
 * Fetches story data and manages interactive game attempts
 */
export default function GamePage() {
  const { islandSlug, storyId } = useParams()
  const navigate = useNavigate()

  // API Hooks
  const { data: story, isLoading: isStoryLoading } = useStory(storyId)
  const startAttempt = useStartAttempt()
  const addStage = useAddStage()
  const addQuestionLog = useAddQuestionLog()
  const updateAttempt = useUpdateAttempt()
  const queryClient = useQueryClient()

  // Use searchParams to track current page (1-indexed in URL, 0-indexed internally)
  const [searchParams, setSearchParams] = useSearchParams({ page: "1" })
  const currentPageIndex = Math.max(
    0,
    parseInt(searchParams.get("page") || "1", 10) - 1
  )

  // Helper to update page in search params
  const setCurrentPage = (pageIndex) => {
    // pageIndex is 0-indexed, URL page is 1-indexed
    setSearchParams({ page: String(pageIndex + 1) }, { replace: true })
  }

  // State
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [finalTime, setFinalTime] = useState(0)
  const [timerRunning, setTimerRunning] = useState(true)
  const [answers, setAnswers] = useState({}) // { questionId: { isCorrect, choiceIndex, ... } }
  const [attemptId, setAttemptId] = useState(null)
  const [attemptStartedAt, setAttemptStartedAt] = useState(null)
  const [showExitWarning, setShowExitWarning] = useState(false)
  const [showIncorrectPopup, setShowIncorrectPopup] = useState(false)
  const [lastIncorrectQuestionId, setLastIncorrectQuestionId] = useState(null)

  // Track questions that were answered incorrectly at least once
  const [incorrectAttempts, setIncorrectAttempts] = useState(new Set())

  // Drag-drop state: { questionId: [itemId1, itemId2, ...] }
  const [dragDropOrder, setDragDropOrder] = useState({})

  // Helper to map API slideType to internal type
  const getInternalType = (slide) => {
    // If it has question data, treat as question regardless of type string
    if (slide.question || slide.slideType === "GAME" || slide.slideType === "ESSAY") {
      return "question"
    }

    switch (slide.slideType) {
      case "IMAGE":
      case "COVER":
        return "image"
      case "ENDING":
        return "ending"
      default:
        // Fallback: if it's in interactiveSlides, it's likely a question or image
        // We'll treat as image if no question data
        return "image"
    }
  }

  // Combined Pages (Static + Interactive)
  const pages = useMemo(() => {
    if (!story) return []
    const staticSlides =
      story.staticSlides?.map((s) => ({
        ...s,
        type: "story",
        sortOrder: s.slideNumber,
      })) || []
    const interactiveSlides =
      story.interactiveSlides?.map((s) => ({
        ...s,
        type: getInternalType(s),
        sortOrder: s.slideNumber,
      })) || []

    // Combine and sort by slideNumber
    let combined = [...staticSlides, ...interactiveSlides].sort(
      (a, b) => a.sortOrder - b.sortOrder
    )

    // Manual Injection: Add Essay for Sumatra if not present
    if (islandSlug === "sumatra") {
      const hasEssay = combined.some(p => p.question?.questionType === "ESSAY")
      if (!hasEssay) {
        // Find Ending slide
        const endingSlide = combined.find(p => p.type === "ending")
        // Place before ending if exists, otherwise at end (arbitrary large number or 11)
        const sortOrder = endingSlide ? endingSlide.sortOrder - 0.5 : 11

        combined.push({
          type: "question",
          sortOrder: sortOrder,
          question: {
            id: "sumatra_essay_1",
            questionType: "ESSAY",
            questionText: "Apa pesan moral yang bisa di ambil dari cerita tersebut?",
            page: 11 // This page number is just for reference, sortOrder governs display
          },
          // Use bonus image if available or generic
          imageUrl: "/assets/budayana/islands/pertanyaan bonus malin.png"
        })

        // Re-sort to apply the new order
        combined.sort((a, b) => a.sortOrder - b.sortOrder)
      }
    }

    // If local game data contains questionImageMap, inject imageUrl for question slides
    const game = getGameByIsland(islandSlug)
    if (game?.questionImageMap) {
      combined = combined.map((p) => {
        if (p.type === "question" && !p.imageUrl) {
          // ... (existing logic)
          const candidates = [
            p.sortOrder,
            p.slideNumber,
            p.pageNumber,
            p.question?.page,
            p.question?.pageNumber,
            "bonus",
          ].filter((c) => c !== undefined && c !== null)

          let img = null
          for (const c of candidates) {
            if (game.questionImageMap?.[c]) {
              img = game.questionImageMap[c]
              break
            }
            const cs = String(c)
            if (game.questionImageMap?.[cs]) {
              img = game.questionImageMap[cs]
              break
            }
          }

          if (img) {
            try {
              img = encodeURI(img)
            } catch (e) { }
            return { ...p, imageUrl: img }
          }
        }
        return p
      })
    }

    return combined
  }, [story, islandSlug])

  // Current Page Data
  const currentPageData = pages[currentPageIndex]
  const isQuestion = currentPageData?.type === "question"
  const isStory = currentPageData?.type === "story"
  const isImage = currentPageData?.type === "image"
  const isEnding = currentPageData?.type === "ending"
  const isLastPage = currentPageIndex === pages.length - 1
  const isResultsPage = currentPageIndex === pages.length // We use index out of bounds for results

  // State for pending logs (when story data isn't loaded yet)
  const [pendingLogs, setPendingLogs] = useState(null)

  // LocalStorage keys for drag-drop persistence
  const getDragDropStorageKey = (aId) => `budayana_dragdrop_${aId}`

  // Save drag-drop order to localStorage
  const saveDragDropToStorage = (order) => {
    if (!attemptId) return
    try {
      localStorage.setItem(
        getDragDropStorageKey(attemptId),
        JSON.stringify(order)
      )
    } catch (e) {
      console.warn("Failed to save drag-drop order:", e)
    }
  }

  // Load drag-drop order from localStorage
  const loadDragDropFromStorage = (aId) => {
    try {
      const stored = localStorage.getItem(getDragDropStorageKey(aId))
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.warn("Failed to load drag-drop order:", e)
    }
    return {}
  }

  // Clear drag-drop storage (call on finish)
  const clearDragDropStorage = () => {
    if (!attemptId) return
    try {
      localStorage.removeItem(getDragDropStorageKey(attemptId))
    } catch (e) {
      console.warn("Failed to clear drag-drop storage:", e)
    }
  }

  // Helper to restore answers from questionLogs
  const restoreAnswersFromLogs = (logs, storyPages) => {
    if (!logs || !storyPages?.length) return

    // Get all questions from pages
    const allQuestions = storyPages
      .filter((p) => p.type === "question" && p.question)
      .map((p) => p.question)

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

    // Map logs to answers
    const restoredAnswers = {}
    allQuestions.forEach((q) => {
      const log = latestLogsByQuestion[q.id]
      if (log) {
        // Find the option index by matching userAnswerText with option text
        const optionIndex = q.answerOptions?.findIndex(
          (opt) => opt.optionText === log.userAnswerText
        )
        if (optionIndex !== -1) {
          restoredAnswers[q.id] = {
            choiceIndex: optionIndex,
            isCorrect: log.isCorrect,
            optionId: q.answerOptions[optionIndex]?.id,
            pending: false,
          }
        }
      }
    })

    if (Object.keys(restoredAnswers).length > 0) {
      setAnswers((prev) => ({ ...prev, ...restoredAnswers }))
    }
  }

  // Start Attempt
  useEffect(() => {
    if (storyId && !attemptId && story?.storyType === "INTERACTIVE") {
      startAttempt.mutate(storyId, {
        onSuccess: (data) => {
          setAttemptId(data.id)
          setAttemptStartedAt(data.startedAt)

          // Resume timer logic
          if (data.totalTimeSeconds) {
            const savedDuration = data.totalTimeSeconds * 1000
            startTimeRef.current = Date.now() - savedDuration
            setTimeElapsed(data.totalTimeSeconds)
          }
          // Restore previous answers from questionLogs if they exist
          if (data.questionLogs && data.questionLogs.length > 0) {
            if (pages.length > 0) {
              restoreAnswersFromLogs(data.questionLogs, pages)
            } else {
              // Store logs temporarily if pages aren't loaded yet
              setPendingLogs(data.questionLogs)
            }
          }

          // Restore drag-drop order from localStorage
          const storedDragDrop = loadDragDropFromStorage(data.id)
          if (Object.keys(storedDragDrop).length > 0) {
            setDragDropOrder(storedDragDrop)
          }
        },
        onError: (err) => console.error("Failed to start attempt", err),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, attemptId, story])

  // Restore answers when pages are loaded and we have pending logs
  useEffect(() => {
    if (pendingLogs && pages.length > 0) {
      restoreAnswersFromLogs(pendingLogs, pages)
      setPendingLogs(null) // Clear pending logs after processing
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, pendingLogs])

  // Timer Logic
  // Timer Logic
  const startTimeRef = useRef(null)

  useEffect(() => {
    // Initialize start time when story is loaded and timer hasn't started yet
    if (story && !startTimeRef.current && !isResultsPage) {
      startTimeRef.current = Date.now()
    }
  }, [story, isResultsPage])

  useEffect(() => {
    if (!timerRunning || !story || isResultsPage) return

    // Ensure we have a start time
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now()
    }

    const calculateElapsed = () => {
      const startTime = startTimeRef.current
      const now = Date.now()
      const elapsedSeconds = Math.floor(
        ((max) => (max > 0 ? max : 0))((now - startTime) / 1000)
      )
      setTimeElapsed(elapsedSeconds)
    }

    calculateElapsed()
    const t = setInterval(calculateElapsed, 1000)
    return () => clearInterval(t)
  }, [timerRunning, story, isResultsPage])
  // Persist drag-drop order to localStorage on every change
  useEffect(() => {
    if (attemptId && Object.keys(dragDropOrder).length > 0) {
      saveDragDropToStorage(dragDropOrder)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragDropOrder, attemptId])

  // Navigation
  const [isNavigating, setIsNavigating] = useState(false)

  const goNext = () => {
    // Check if current question has pending answer validation
    if (isQuestion) {
      const currentQ = currentPageData.question
      const currentAns = answers[currentQ.id]

      // If we have an answer but it's pending, don't proceed yet
      if (currentAns && currentAns.pending) {
        return
      }
    }

    if (isLastPage) {
      handleFinish()
    } else {
      setCurrentPage(currentPageIndex + 1)
    }
  }

  const goPrev = () => {
    setCurrentPage(Math.max(0, currentPageIndex - 1))
  }

  // Handle Answer Selection
  const handleAnswer = (question, choiceIndex) => {
    // Prevent changing answer if already correct
    if (answers[question.id]?.isCorrect) return

    const selectedOption = question.answerOptions[choiceIndex]

    // Optimistically set answer as pending (no isCorrect yet)
    setAnswers((prev) => ({
      ...prev,
      [question.id]: {
        choiceIndex,
        isCorrect: null, // Will be updated by API response
        optionId: selectedOption.id,
        pending: true,
      },
    }))

    // API Log - correctness comes from API response
    if (!attemptId) return

    addQuestionLog.mutate(
      {
        attemptId,
        logData: {
          questionId: question.id,
          selectedOptionId: selectedOption.id,
          attemptCount: 1,
        },
      },
      {
        onSuccess: (response) => {
          // Update answer with actual correctness from API
          setAnswers((prev) => ({
            ...prev,
            [question.id]: {
              choiceIndex,
              isCorrect: response.isCorrect,
              optionId: selectedOption.id,
              pending: false,
            },
          }))

          if (!response.isCorrect) {
            setLastIncorrectQuestionId(question.id)
            setShowIncorrectPopup(true)
            setIncorrectAttempts(prev => {
              const newSet = new Set(prev)
              newSet.add(question.id)
              return newSet
            })
          }
        },
        onError: (err) => {
          console.error("Failed to log answer:", err)
          // Reset pending state on error
          setAnswers((prev) => ({
            ...prev,
            [question.id]: {
              ...prev[question.id],
              pending: false,
            },
          }))
        },
      }
    )
  }

  // Finish Logic
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFinish = async () => {
    setIsSubmitting(true)
    setTimerRunning(false)
    setFinalTime(timeElapsed)

    // Calculate Score
    // Calculate Score
    // Exclude ESSAY from denominator
    const totalQuestions = pages.filter((p) => p.type === "question" && p.question?.questionType !== "ESSAY").length
    const correctAndNeverTwice = Object.keys(answers).filter((qId) => {
      // Basic check: Must be correct and never incorrect
      if (!answers[qId]?.isCorrect || incorrectAttempts.has(qId)) return false

      // Strict check: Must NOT be an Essay
      const page = pages.find(p => p.question?.id === qId)
      return page?.question?.questionType !== "ESSAY"
    }).length

    const score = totalQuestions > 0 ? (correctAndNeverTwice / totalQuestions) * 100 : 0
    const xpGained = Math.round(score)

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
            totalXpGained: xpGained,
          },
        })

        // Invalidate progress to update Home Page "Tahap Selesai" immediately
        await queryClient.invalidateQueries({ queryKey: ["myProgress"] })
        await queryClient.invalidateQueries({ queryKey: ["islandProgress"] })
      } catch (error) {
        console.error("Failed to save game finish data:", error)
      }
    }

    // Clear drag-drop localStorage since game is finished
    clearDragDropStorage()

    setIsSubmitting(false)
    setCurrentPage(pages.length) // Go to results
  }

  // Handle explicit exit (abandon)
  const [isExitSubmitting, setIsExitSubmitting] = useState(false)

  const handleExit = async () => {
    setIsExitSubmitting(true)
    // Clear drag-drop storage
    clearDragDropStorage()

    if (attemptId) {
      try {
        await updateAttempt.mutateAsync({
          attemptId,
          data: {
            // finishedAt: new Date().toISOString(), // removed to prevent premature finishing
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

  // Render Loading
  if (isStoryLoading)
    return <div className='text-center p-10'>Memuat permainan...</div>
  if (!story) return <div className='text-center p-10'>Story not found</div>

  /* ---------------- RENDER HELPERS ---------------- */

  const renderMultipleChoice = (question) => {
    const current = answers[question.id]
    const mcColors = ["#BDEBFF", "#CBD2FF", "#FFA5C9", "#F7885E"]

    return (
      <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'>
        {question.answerOptions?.map((opt, idx) => {
          const isSelected = current?.choiceIndex === idx
          const isPending = current?.pending === true
          const hasResult =
            current?.isCorrect !== null && current?.isCorrect !== undefined
          const isCorrectAnswer = isSelected && current?.isCorrect === true
          const isWrongAnswer = isSelected && current?.isCorrect === false

          let bgColor = mcColors[idx % mcColors.length]
          let opacity = "1"
          let borderColor = "#2c2c2c"
          const questionIsIncorrect = current?.isCorrect === false

          if (hasResult && isSelected) {
            if (isCorrectAnswer) {
              bgColor = "#9ED772" // Correct - green
            } else if (isWrongAnswer) {
              bgColor = "#E9645F" // Wrong - red
            }
          } else if (hasResult && !isSelected) {
            if (questionIsIncorrect) {
              // Dim non-selected options to a neutral grey while showing the wrong answer
              bgColor = "#ECECEC"
              borderColor = "#BDBDBD"
              opacity = "1"
            } else {
              opacity = "0.5" // Dim non-selected after answer confirmed
            }
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleAnswer(question, idx)}
              disabled={current?.isCorrect === true || isPending || (showIncorrectPopup && lastIncorrectQuestionId === question.id)}
              className='w-full text-left rounded-2xl px-4 py-3 md:px-5 md:py-4 font-semibold shadow-sm transition border-2 relative'
              style={{ backgroundColor: bgColor, opacity, borderColor }}
            >
              <div className='flex items-center gap-2 md:gap-3'>
                <div className='w-8 h-8 rounded-full bg-white/80 border-2 border-black/20 flex items-center justify-center font-bold text-sm'>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className='text-[#1f1f1f] flex-1 text-sm md:text-base' style={{ color: questionIsIncorrect && hasResult && !isSelected ? '#6b6b6b' : undefined }}>
                  {opt.optionText}
                </span>
                {isWrongAnswer && (
                  <span className='inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#E9645F] text-white font-bold ml-2'>
                    <X size={20} strokeWidth={3.5} color='#ffffff' />
                  </span>
                )}
                {isCorrectAnswer && (
                  <span className='inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#7BC142] text-white font-bold ml-2'>
                    <Check size={18} strokeWidth={3} color='#ffffff' />
                  </span>
                )}
                {isPending && isSelected && (
                  <span className='animate-pulse'>...</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  // Renders a story slide (static)
  const renderStoryPage = (pageData) => (
    <div className='w-full max-w-4xl mx-auto px-2'>
      <div className='bg-white rounded-[30px] shadow-xl border-[3px] border-[#2c2c2c] overflow-hidden p-4 md:p-6'>
        {pageData.imageUrl && (
          <div className='flex justify-center mb-4'>
            <img
              src={pageData.imageUrl}
              alt='Story'
              className='w-full max-h-[380px] md:max-h-[150px] object-contain rounded-lg'
            />
          </div>
        )}
        <div className='text-lg font-medium text-[#2c2c2c] text-center'>
          {pageData.contentText}
        </div>
      </div>
    </div>
  )

  // Renders an image slide (e.g., IMAGE slideType from interactiveSlides)
  const renderImagePage = (pageData) => (
    <div className='w-full max-w-4xl mx-auto px-2'>
      <div className='bg-white rounded-[30px] shadow-xl border-[3px] border-[#2c2c2c] overflow-hidden'>
        {pageData.imageUrl ? (
          <img
            src={pageData.imageUrl}
            alt='Interactive Story'
            className='w-full max-h-[200px] md:max-h-[700px] object-contain'
          />
        ) : (
          <div className='text-center p-8 text-gray-400'>
            Gambar tidak tersedia
          </div>
        )}
      </div>
    </div>
  )

  // Renders the ending slide
  const renderEndingPage = () => (
    <div className='w-full max-w-4xl mx-auto px-2'>
      <div className='bg-white rounded-[40px] shadow-2xl p-8 md:p-12 border-[3px] border-[#2c2c2c] text-center'>
        <div className='text-6xl mb-6'>🎉</div>
        <h2 className='text-3xl font-extrabold text-[#2c2c2c] mb-4'>
          Cerita Selesai!
        </h2>
        <p className='text-lg text-gray-600 mb-6'>
          Klik "Selesai" untuk melihat hasilmu.
        </p>
      </div>
    </div>
  )

  // Drag-drop colors
  const dragColors = ["#BDEBFF", "#F2E686", "#F7885E", "#CCD2FF", "#FFA5C9"]

  // Render Drag-Drop question
  const renderDragDrop = (question) => {
    const items = question.metadata?.items || []
    const correctOrder = question.metadata?.correctOrder || []
    const questionId = question.id
    const currentOrder = dragDropOrder[questionId] || []
    const current = answers[questionId]
    const hasResult =
      current?.isCorrect !== null && current?.isCorrect !== undefined
    const isPending = current?.pending === true
    const isLocked = current?.isCorrect === true // Only lock when correct
    const isIncorrect = hasResult && !current?.isCorrect

    // Get items that haven't been placed yet
    const availableItems = items.filter(
      (item) => !currentOrder.includes(item.id)
    )

    const handleDragStart = (e, itemId) => {
      e.dataTransfer.setData("text/plain", itemId)
    }

    const handleDragOver = (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
    }

    const handleDrop = (e, targetIndex) => {
      e.preventDefault()
      const sourceId = e.dataTransfer.getData("text/plain")
      if (!sourceId) return

      setDragDropOrder((prev) => {
        const order = [...(prev[questionId] || Array(items.length).fill(null))]

        // If dropping from available items (not already in slots)
        const existingIndex = order.indexOf(sourceId)
        if (existingIndex !== -1) {
          // Swap if target already has an item
          const targetItem = order[targetIndex]
          order[existingIndex] = targetItem
        }
        order[targetIndex] = sourceId

        return { ...prev, [questionId]: order }
      })
    }

    const handleRemoveFromSlot = (index) => {
      setDragDropOrder((prev) => {
        const order = [...(prev[questionId] || [])]
        order[index] = null
        return { ...prev, [questionId]: order }
      })
    }

    const handleCheckAnswer = () => {
      const order = dragDropOrder[questionId] || []
      const filledSlots = order.filter((id) => id !== null)

      if (filledSlots.length !== correctOrder.length) {
        setLastIncorrectQuestionId(questionId)
        setShowIncorrectPopup(true)
        return
      }

      // Set pending
      setAnswers((prev) => ({
        ...prev,
        [questionId]: { isCorrect: null, pending: true, order },
      }))

      // Check locally (since drag-drop doesn't have an API endpoint for checking)
      // Compare order with correctOrder
      const isCorrect = order.every((id, idx) => id === correctOrder[idx])

      // Simulate API response delay for consistency
      setTimeout(() => {
        setAnswers((prev) => ({
          ...prev,
          [questionId]: { isCorrect, pending: false, order },
        }))

        if (!isCorrect) {
          setLastIncorrectQuestionId(questionId)
          setShowIncorrectPopup(true)
          setIncorrectAttempts(prev => {
            const newSet = new Set(prev)
            newSet.add(questionId)
            return newSet
          })
        }
      }, 300)
    }

    return (
      <div className='flex flex-col gap-4 md:gap-6'>
        <div>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-3 gap-3'>
            <p className='text-sm font-semibold text-[#2c2c2c]'>
              Urutkan kejadian di bawah ini:
            </p>
            <button
              onClick={handleCheckAnswer}
              disabled={isLocked || isPending || (showIncorrectPopup && lastIncorrectQuestionId === questionId)}
              className='px-4 py-2 md:px-5 md:py-3 rounded-full text-white font-semibold shadow hover:opacity-90 transition text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed'
              style={{
                backgroundColor: isLocked
                  ? "#9ED772"
                  : isPending
                    ? "#FFD700"
                    : "#4fb986",
              }}
            >
              {isLocked ? (
                <span className='flex items-center gap-2'>
                  <span>Jawaban Benar</span>
                  <span className='inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#7BC142] text-white font-bold ml-2'>
                    <Check size={18} strokeWidth={3} color='#ffffff' />
                  </span>
                </span>
              ) : isPending ? (
                "Memeriksa..."
              ) : isIncorrect ? (
                "Periksa Lagi"
              ) : (
                "Periksa Jawaban"
              )}
            </button>
          </div>

          {/* Drop zones */}
          <div className='grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3'>
            {Array(items.length)
              .fill(null)
              .map((_, index) => {
                const itemId = currentOrder[index]
                const item = itemId ? items.find((i) => i.id === itemId) : null
                const color = dragColors[index % dragColors.length]

                let ringClass = ""
                let bgStyle = item
                  ? { backgroundColor: color }
                  : { backgroundColor: "#f5f5f5" }

                if (hasResult) {
                  const isCorrectPosition = itemId === correctOrder[index]
                  if (isCorrectPosition) {
                    ringClass = "ring-4 ring-green-400"
                    bgStyle = { backgroundColor: "#d1f2b8" }
                  } else if (item) {
                    ringClass = "ring-4 ring-red-500"
                    bgStyle = { backgroundColor: "#ffcccc" }
                  }
                }

                return (
                  <div
                    key={index}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`relative min-h-[100px] md:min-h-[120px] rounded-xl border-2 flex flex-col items-center justify-center p-3 transition ${item
                      ? "border-solid border-[#2c2c2c]"
                      : "border-dashed border-gray-300"
                      } ${ringClass}`}
                    style={bgStyle}
                  >
                    <div className='text-xs font-bold text-gray-500 mb-2'>
                      {index + 1}
                    </div>
                    {item ? (
                      <div className='flex flex-col items-center gap-2 w-full'>
                        <span className='text-sm font-semibold text-[#1f1f1f] text-center px-2'>
                          {item.label}
                        </span>
                        {!isLocked && (
                          <button
                            onClick={() => handleRemoveFromSlot(index)}
                            className='absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center transition'
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className='text-xs text-gray-400 text-center'>
                        Drop di sini
                      </span>
                    )}
                  </div>
                )
              })}
          </div>

          {isIncorrect && (
            <p className='text-[#E9645F] font-semibold text-sm mt-3'>
              Item yang ditandai merah perlu dipindahkan ke posisi yang tepat.
            </p>
          )}
          {isLocked && (
            <p className='text-[#7BC142] font-semibold text-sm mt-3 flex items-center'>
              Sempurna! Semua urutan sudah benar!
              <span className='inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#7BC142] text-white font-bold ml-2'>
                <Check size={18} strokeWidth={3} color='#ffffff' />
              </span>
            </p>
          )}
        </div>

        {/* Available items to drag */}
        {availableItems.length > 0 && !isLocked && (
          <div>
            <p className='text-sm font-semibold text-[#2c2c2c] mb-3'>
              Pilih kejadian:
            </p>
            <div className='grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3'>
              {availableItems.map((item) => {
                const originalIndex = items.findIndex((i) => i.id === item.id)
                const color = dragColors[originalIndex % dragColors.length]
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    className='rounded-xl px-3 py-4 md:px-4 md:py-3 shadow text-center font-semibold cursor-move text-[#1f1f1f] transition hover:scale-105 text-sm border-2 border-[#2c2c2c]'
                    style={{ backgroundColor: color }}
                  >
                    {item.label}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render Essay Question
  const renderEssay = (question) => {
    const current = answers[question.id]
    const textValue = current?.textValue || ""

    const handleTextChange = (e) => {
      const val = e.target.value
      setAnswers((prev) => ({
        ...prev,
        [question.id]: {
          textValue: val,
          isCorrect: val.trim().length > 0, // Mark as "correct" if not empty
          choiceIndex: -1, // No choice index for essay
          pending: false,
        },
      }))
    }

    const handleEssayBlur = () => {
      if (textValue.trim().length > 0 && attemptId) {
        addQuestionLog.mutate({
          attemptId,
          logData: {
            questionId: question.id,
            userAnswerText: textValue,
            attemptCount: 1,
            selectedOptionId: null, // No option ID for essay
          },
        })
      }
    }

    return (
      <div className='flex flex-col gap-4'>
        <textarea
          className='w-full h-40 p-4 border-2 border-[#2c2c2c] rounded-2xl text-lg resize-none focus:outline-none focus:ring-4 focus:ring-[#BDEBFF]'
          placeholder='Tulis jawabanmu di sini...'
          value={textValue}
          onChange={handleTextChange}
          onBlur={handleEssayBlur}
        ></textarea>
        {textValue.trim().length > 0 && (
          <div className='font-semibold flex items-center gap-2'>
            <span className='inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#4fb986] text-white font-bold mr-2'>
              <Check size={18} strokeWidth={3} color='#ffffff' />
            </span>
            <span className='text-[#1f1f1f]'>Jawaban tersimpan</span>
          </div>
        )}
      </div>
    )
  }

  // Renders a question slide
  const renderQuestionPage = (pageData) => {
    const question = pageData.question
    if (!question) return <div>Invalid Question Data</div>

    // Determine renderer based on questionType
    const questionType = question.questionType?.toUpperCase()

    let questionRenderer
    switch (questionType) {
      case "DRAG_DROP":
        questionRenderer = renderDragDrop(question)
        break
      case "ESSAY":
        questionRenderer = renderEssay(question)
        break
      case "TRUE_FALSE":
      case "MCQ":
      case "MULTIPLE_CHOICE":
      default:
        questionRenderer = renderMultipleChoice(question)
        break
    }

    return (
      <div className='w-full max-w-5xl mx-auto px-2'>
        <div className='bg-white rounded-[28px] border-[3px] border-[#2c2c2c] shadow-xl p-4 md:p-6'>
          <div className='mb-4 md:mb-5'>
            {pageData.imageUrl && (
              <img
                src={pageData.imageUrl}
                alt='Question'
                className='w-full max-h-[220px] md:max-h-[400px] object-contain mx-auto mb-4 rounded-lg'
              />
            )}
            {/* <p className='text-base md:text-lg font-semibold text-[#2c2c2c] leading-relaxed'>
              {question.questionText}
            </p> */}
          </div>
          {questionRenderer}
        </div>
      </div>
    )
  }

  // Results Page
  const renderResults = () => {
    const correctAndNeverTwice = Object.keys(answers).filter((qId) => {
      if (!answers[qId]?.isCorrect || incorrectAttempts.has(qId)) return false
      const page = pages.find(p => p.question?.id === qId)
      return page?.question?.questionType !== "ESSAY"
    }).length
    const totalQuestions = pages.filter((p) => p.type === "question" && p.question?.questionType !== "ESSAY").length
    const score =
      totalQuestions > 0
        ? Math.round((correctAndNeverTwice / totalQuestions) * 100)
        : 100

    return (
      <div className='w-full max-w-4xl mx-auto px-2'>
        <div className='bg-white rounded-[40px] shadow-2xl p-6 md:p-10 border-[3px] border-[#2c2c2c] text-center'>
          <div className='bg-[#E4AE28] text-white font-extrabold text-3xl px-12 py-3 rounded-full shadow-lg mb-8 inline-block'>
            Selesai!
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
            <div className='bg-[#FF9ECF] rounded-3xl p-6 border-[3px] border-[#2c2c2c]'>
              <span className='font-bold text-xl'>Waktu</span>
              <div className='text-3xl font-black'>{formatTime(finalTime)}</div>
            </div>
            <div className='bg-[#BDEBFF] rounded-3xl p-6 border-[3px] border-[#2c2c2c]'>
              <span className='font-bold text-xl'>Total XP</span>
              <div className='text-3xl font-black'>+{score} XP</div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/home?island=${islandSlug}`)}
            className='bg-[#F7885E] text-white font-extrabold text-xl px-12 py-3 rounded-full shadow-lg hover:bg-[#e4764c] transition'
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  // Header
  const renderHeader = () => {
    // Calculate current XP (0-100)
    // Exclude ESSAY from denominator
    const totalQuestions = pages.filter((p) => p.type === "question" && p.question?.questionType !== "ESSAY").length
    const correctAndNeverTwice = Object.keys(answers).filter((qId) => {
      if (!answers[qId]?.isCorrect || incorrectAttempts.has(qId)) return false
      const page = pages.find(p => p.question?.id === qId)
      return page?.question?.questionType !== "ESSAY"
    }).length
    const currentXP =
      totalQuestions > 0
        ? Math.round((correctAndNeverTwice / totalQuestions) * 100)
        : 0

    return (
      <div className='w-full max-w-5xl mx-auto px-2 mb-6 flex justify-between items-center'>
        <button
          onClick={() => setShowExitWarning(true)}
          className='px-4 py-2 bg-white/80 border-2 border-[#2c2c2c] rounded-full flex gap-2 items-center font-semibold hover:bg-gray-100'
        >
          <ArrowLeft size={18} /> Keluar
        </button>
        <div className='flex gap-2'>
          <div className='flex gap-2 bg-white/70 px-4 py-2 rounded-full border-2 border-[#2c2c2c] shadow-sm'>
            <span className='font-bold text-[#E4AE28]'>XP</span>
            <span className='font-semibold'>
              {currentXP}/{totalQuestions > 0 ? "100" : "0"}
            </span>
          </div>
          <div className='flex gap-2 bg-white/70 px-4 py-2 rounded-full border-2 border-[#2c2c2c] shadow-sm'>
            <Clock size={20} />
            <span className='font-semibold'>{formatTime(timeElapsed)}</span>
          </div>
        </div>
      </div>
    )
  }

  const handleCloseIncorrectPopup = () => {
    const qId = lastIncorrectQuestionId
    if (qId) {
      // For Drag & Drop: Do NOT reset answers or items.
      // This keeps the items in the box and preserves the Red/Green validation colors
      if (dragDropOrder[qId]) {
        setShowIncorrectPopup(false)
        return
      }

      // For Multiple Choice: Reset answers so user can choose again
      setAnswers((prev) => {
        const copy = { ...prev }
        if (copy[qId]) delete copy[qId]
        return copy
      })
    }
    setShowIncorrectPopup(false)
  }

  // Incorrect Popup
  const renderIncorrectPopup = () => {
    if (!showIncorrectPopup) return null
    return (
      <div className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4'>
        <div className='bg-[#fff4d6] w-[90%] max-w-md rounded-3xl border-[3px] border-[#e9c499] shadow-2xl p-6 text-center'>
          <img
            src={'/assets/budayana/islands/bocah.png'}
            alt='Notifikasi Kesalahan'
            className='mx-auto mb-4 max-w-[140px] md:max-w-[180px] rounded-md'
          />
          <p className='text-lg font-semibold text-[#2f2f2f] mb-4'>
            Ups!! jawaban kamu kurang tepat. Tenang, coba lagi ya, kamu pasti bisa!
          </p>
          <button
            onClick={handleCloseIncorrectPopup}
            className='w-full bg-[#f88c63] text-white font-bold py-2 rounded-full hover:bg-[#e27852]'
          >
            Siap, coba lagi
          </button>
        </div>
      </div>
    )
  }

  // Exit Warning
  const renderExitWarning = () => {
    if (!showExitWarning) return null
    return (
      <div className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4'>
        <div className='bg-[#fff4d6] w-[90%] max-w-md rounded-3xl border-[3px] border-[#e9c499] shadow-2xl p-6 text-center'>
          <img
            src={'/assets/budayana/islands/image 90.png'}
            alt='Peringatan Keluar'
            className='mx-auto mb-4 max-w-[140px] md:max-w-[180px] rounded-md'
          />
          <p className='text-lg font-semibold text-[#2f2f2f] mb-4'>
            Jangan pergi dulu! Progresmu di tahap ini akan hilang kalau kamu berhenti sekarang.
          </p>
          <button
            onClick={() => setShowExitWarning(false)}
            className='w-full bg-[#f88c63] text-white font-bold py-3 rounded-full mb-2'
          >
            Lanjutkan Main
          </button>
          <button
            onClick={handleExit}
            className='text-[#e64c45] font-bold'
          >
            Keluar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#fdf4d7] flex flex-col p-4'>
      {renderHeader()}

      <div className='flex-1 flex items-center justify-center'>
        {isResultsPage
          ? renderResults()
          : isStory
            ? renderStoryPage(currentPageData)
            : isImage
              ? renderImagePage(currentPageData)
              : isQuestion
                ? renderQuestionPage(currentPageData)
                : isEnding
                  ? renderEndingPage()
                  : null}
      </div>

      {!isResultsPage && (
        <div className='w-full max-w-5xl mx-auto mt-6 flex justify-between'>
          <button
            onClick={goPrev}
            disabled={currentPageIndex === 0}
            className='flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition disabled:opacity-50 disabled:bg-[#ccc] bg-[#f27f68]'
          >
            <ArrowLeft size={20} /> Sebelumnya
          </button>
          <button
            onClick={goNext}
            disabled={(isQuestion && answers[currentPageData?.question?.id]?.isCorrect !== true) || isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition ${(isQuestion && answers[currentPageData?.question?.id]?.isCorrect !== true) || isSubmitting
              ? "bg-gray-400 cursor-not-allowed opacity-70"
              : "bg-[#4fb986]"
              }`}
          >
            {isQuestion && answers[currentPageData?.question?.id]?.pending ? (
              "Memproses..."
            ) : isSubmitting ? (
              "Menyimpan..."
            ) : (
              <>
                {isLastPage ? "Selesai" : "Berikutnya"} <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      )}

      {renderIncorrectPopup()}
      {renderExitWarning()}
    </div>
  )
}
