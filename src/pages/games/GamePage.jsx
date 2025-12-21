import { useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, Clock } from "lucide-react"
import { getGameByIsland, buildGamePages } from "../../data/games"
import { getIslandBySlug } from "../../data/islands"

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")
  const secs = (seconds % 60).toString().padStart(2, "0")
  return `${mins} : ${secs}`
}

/**
 * Unified Game Page Component
 * Dynamically loads game data based on island slug from URL
 */
export default function GamePage() {
  const { islandSlug } = useParams()
  const navigate = useNavigate()

  // Get island and game data
  const island = getIslandBySlug(islandSlug)
  const game = getGameByIsland(islandSlug)
  const pages = useMemo(() => (game ? buildGamePages(game) : []), [game])

  // Component state
  const [currentPage, setCurrentPage] = useState(1)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [finalTime, setFinalTime] = useState(0)
  const [timerRunning, setTimerRunning] = useState(true)
  const [xp, setXp] = useState(0)
  const [answers, setAnswers] = useState({})
  const [dropZones, setDropZones] = useState(Array(5).fill(null))
  const [bonusAnswer, setBonusAnswer] = useState("")
  const [showIncorrectPopup, setShowIncorrectPopup] = useState(false)
  const [dragIncorrectPositions, setDragIncorrectPositions] = useState([])
  const [dragCorrectPositions, setDragCorrectPositions] = useState([])
  const [incorrectAttempts, setIncorrectAttempts] = useState({})
  const [showExitWarning, setShowExitWarning] = useState(false)

  const totalXp = game?.totalXp || 100
  const xpPerQuestion = game?.xpPerQuestion || 20

  // Timer
  useEffect(() => {
    if (!timerRunning) return
    const t = setInterval(() => setTimeElapsed((v) => v + 1), 1000)
    return () => clearInterval(t)
  }, [timerRunning])

  const awardXp = (questionId) => {
    const alreadyAwarded = answers[questionId]?.isCorrect
    if (alreadyAwarded || incorrectAttempts[questionId]) return
    setXp((prev) => Math.min(totalXp, prev + xpPerQuestion))
  }

  const handleAnswer = (question, choice) => {
    const isCorrect = question.correct === choice
    if (!isCorrect) {
      setAnswers((prev) => ({
        ...prev,
        [question.id]: { choice, isCorrect: false },
      }))
      setIncorrectAttempts((prev) => ({ ...prev, [question.id]: true }))
      setShowIncorrectPopup(true)
      return
    }
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { choice, isCorrect: true },
    }))
    awardXp(question.id)
  }

  const goNext = () => {
    if (currentPage === 10) {
      setCurrentPage(11)
    } else if (currentPage === 11) {
      setTimerRunning(false)
      setFinalTime(timeElapsed)
      setCurrentPage(12)
    } else if (currentPage < 10) {
      setCurrentPage((v) => v + 1)
    }
  }

  const goPrev = () => {
    if (currentPage === 12) setCurrentPage(11)
    else if (currentPage === 11) setCurrentPage(10)
    else if (currentPage > 1) setCurrentPage((v) => v - 1)
  }

  const canContinue = () => {
    if (currentPage % 2 === 1 && currentPage <= 10) return true
    if (currentPage === 11) return bonusAnswer.trim().length > 0
    if (currentPage % 2 === 0 && currentPage <= 10) {
      const question = game?.questions.find((q) => q.page === currentPage)
      return question && answers[question.id]?.isCorrect
    }
    return true
  }

  const currentPageData = pages.find((p) => p.pageNumber === currentPage)

  // Handle invalid island/game
  if (!island || !game) {
    return (
      <div className='min-h-screen bg-[#fdf4d7] flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-[#2c2c2c] mb-4'>
            Game not found for this island
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

  // Render story page
  const renderStoryPage = (pageData) => {
    const imageUrl = game.storyImageMap[pageData.pageNumber]
    return (
      <div className='w-full max-w-4xl mx-auto px-2'>
        <div className='bg-white rounded-[30px] shadow-xl border-[3px] border-[#2c2c2c] overflow-hidden'>
          <div className='w-full flex items-center justify-center'>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`Cerita ${island.name} Halaman ${pageData.pageNumber}`}
                className='w-full h-auto'
              />
            ) : (
              <div className='text-gray-400 text-lg p-8'>
                Gambar cerita akan ditampilkan di sini
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render multiple choice
  const renderMultipleChoice = (question) => {
    const current = answers[question.id]
    const mcColors = ["#BDEBFF", "#CBD2FF", "#FFA5C9", "#F7885E"]

    return (
      <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'>
        {question.options.map((opt, idx) => {
          const isCorrectOption = question.correct === idx
          const isSelectedWrong =
            current && !current.isCorrect && current.choice === idx
          const showResult = current?.isCorrect
          const showWrongResult = current && !current.isCorrect

          let bgColor = mcColors[idx]
          let opacity = "1"
          let letterBorderClass = "border-black/20"

          if (showResult && isCorrectOption) letterBorderClass = "border-black"
          if (showResult) {
            bgColor = isCorrectOption ? "#9ED772" : "#E9645F"
            if (!isCorrectOption) opacity = "0.7"
          } else if (showWrongResult) {
            if (isSelectedWrong) bgColor = "#E9645F"
            else {
              bgColor = "#d1d5db"
              opacity = "0.6"
            }
          }

          let icon = null
          if (showResult && isCorrectOption) {
            icon = (
              <span className='text-green-700 text-xl md:text-3xl font-bold'>
                ✓
              </span>
            )
          } else if (showWrongResult && isSelectedWrong) {
            icon = (
              <span className='text-red-700 text-xl md:text-3xl font-bold'>
                ✗
              </span>
            )
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(question, idx)}
              disabled={current?.isCorrect}
              className='w-full text-left rounded-2xl px-4 py-3 md:px-5 md:py-4 font-semibold shadow-sm transition border-2 relative'
              style={{
                backgroundColor: bgColor,
                opacity,
                borderColor: "#2c2c2c",
              }}
            >
              <div className='flex items-center gap-2 md:gap-3'>
                <div
                  className={`w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/80 border-2 ${letterBorderClass} flex items-center justify-center font-bold flex-shrink-0 text-sm md:text-base`}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className='text-[#1f1f1f] flex-1 text-sm md:text-base'>
                  {opt}
                </span>
                {icon && <div className='flex-shrink-0'>{icon}</div>}
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  // Render true/false
  const renderTrueFalse = (question) => {
    const current = answers[question.id]

    const renderBtn = (label, value) => {
      const isCorrect = question.correct === value
      const isSelectedWrong =
        current && !current.isCorrect && current.choice === value
      const showResult = current?.isCorrect
      const showWrongResult = current && !current.isCorrect

      let bgColor = value ? "#9ED772" : "#E9645F"
      let opacity = 1

      if (showResult) {
        bgColor = isCorrect ? "#9ED772" : "#E9645F"
        if (!isCorrect) opacity = 0.7
      } else if (showWrongResult) {
        if (isSelectedWrong) bgColor = "#E9645F"
        else if (isCorrect) {
          bgColor = "#9ED772"
          opacity = 0.7
        } else {
          bgColor = "#d1d5db"
          opacity = 0.6
        }
      }

      let icon = null
      if (showResult && isCorrect) {
        icon = (
          <span className='text-green-700 text-xl md:text-3xl font-bold'>
            ✓
          </span>
        )
      } else if (showWrongResult && isSelectedWrong) {
        icon = (
          <span className='text-red-700 text-xl md:text-3xl font-bold'>✗</span>
        )
      } else if (showWrongResult && isCorrect) {
        icon = (
          <span className='text-green-700 text-xl md:text-3xl font-bold'>
            ✓
          </span>
        )
      }

      return (
        <button
          onClick={() => handleAnswer(question, value)}
          disabled={current?.isCorrect}
          className='w-full rounded-2xl px-5 py-3 md:py-4 font-semibold shadow-sm transition text-white border-2 relative flex items-center justify-center min-h-[60px] md:min-h-[72px]'
          style={{ backgroundColor: bgColor, opacity, borderColor: "#2c2c2c" }}
        >
          <span className='text-sm md:text-base'>{label}</span>
          {icon && (
            <div className='absolute right-3 md:right-5 flex items-center'>
              {icon}
            </div>
          )}
        </button>
      )
    }

    return (
      <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'>
        {renderBtn("BENAR", true)}
        {renderBtn("SALAH", false)}
      </div>
    )
  }

  // Render drag-drop
  const renderDragDrop = (question) => {
    const dragColors = ["#BDEBFF", "#F2E686", "#F7885E", "#CCD2FF", "#FFA5C9"]

    const handleDragStart = (e, id) => {
      e.dataTransfer.setData("text/plain", id)
    }

    const handleDragOver = (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
    }

    const handleDrop = (e, targetIndex) => {
      e.preventDefault()
      const sourceId = e.dataTransfer.getData("text/plain")
      if (!sourceId) return

      const updatedZones = [...dropZones]
      if (updatedZones[targetIndex]) {
        const sourceIndex = updatedZones.findIndex((id) => id === sourceId)
        if (sourceIndex !== -1)
          updatedZones[sourceIndex] = updatedZones[targetIndex]
      } else {
        const sourceIndex = updatedZones.findIndex((id) => id === sourceId)
        if (sourceIndex !== -1) updatedZones[sourceIndex] = null
      }
      updatedZones[targetIndex] = sourceId
      setDropZones(updatedZones)
      setDragIncorrectPositions([])
      setDragCorrectPositions([])
    }

    const handleRemoveFromZone = (index) => {
      const updatedZones = [...dropZones]
      updatedZones[index] = null
      setDropZones(updatedZones)
      setDragIncorrectPositions([])
      setDragCorrectPositions([])
    }

    const availableItems = question.items.filter(
      (item) => !dropZones.includes(item.id)
    )

    const handleCheckAnswer = () => {
      const currentOrder = dropZones.filter((id) => id !== null)
      if (currentOrder.length !== question.correctOrder.length) {
        setIncorrectAttempts((prev) => ({ ...prev, [question.id]: true }))
        setShowIncorrectPopup(true)
        return
      }

      const incorrectPos = []
      const correctPos = []
      dropZones.forEach((itemId, index) => {
        if (itemId) {
          if (itemId !== question.correctOrder[index]) incorrectPos.push(index)
          else correctPos.push(index)
        }
      })

      if (incorrectPos.length > 0) {
        setDragIncorrectPositions(incorrectPos)
        setDragCorrectPositions(correctPos)
        setIncorrectAttempts((prev) => ({ ...prev, [question.id]: true }))
        setShowIncorrectPopup(true)
        return
      }

      setDragIncorrectPositions([])
      setDragCorrectPositions([0, 1, 2, 3, 4])
      setAnswers((prev) => ({ ...prev, [question.id]: { isCorrect: true } }))
      awardXp(question.id)
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
              disabled={answers[question.id]?.isCorrect}
              className='px-4 py-2 md:px-5 md:py-3 md:mb-2 rounded-full text-white font-semibold shadow hover:opacity-90 transition text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed'
              style={{
                backgroundColor: answers[question.id]?.isCorrect
                  ? "#9ED772"
                  : "#4fb986",
              }}
            >
              {answers[question.id]?.isCorrect
                ? "Jawaban Benar ✓"
                : "Periksa Jawaban"}
            </button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3'>
            {Array(5)
              .fill(null)
              .map((_, index) => {
                const itemId = dropZones[index]
                const item = itemId
                  ? question.items.find((i) => i.id === itemId)
                  : null
                const color = dragColors[index]
                const isIncorrect = dragIncorrectPositions.includes(index)
                const isCorrect = dragCorrectPositions.includes(index)

                let borderColor = "#2c2c2c"
                let ringClass = ""
                if (isCorrect) {
                  borderColor = "#7BC142"
                  ringClass = "ring-4 ring-green-400"
                } else if (isIncorrect) {
                  borderColor = "#E9645F"
                  ringClass = "ring-4 ring-red-500"
                }

                return (
                  <div
                    key={index}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`relative min-h-[100px] md:min-h-[120px] rounded-xl border-2 flex flex-col items-center justify-center p-3 transition ${
                      item ? "border-solid" : "border-dashed border-gray-300"
                    } ${ringClass}`}
                    style={
                      item
                        ? {
                            backgroundColor: isIncorrect
                              ? "#ffcccc"
                              : isCorrect
                              ? "#d1f2b8ff"
                              : color,
                            borderColor,
                          }
                        : { backgroundColor: "#f5f5f5" }
                    }
                  >
                    <div className='text-xs font-bold text-gray-500 mb-2'>
                      {index + 1}
                    </div>
                    {item ? (
                      <div className='flex flex-col items-center gap-2 w-full'>
                        <span className='text-sm font-semibold text-[#1f1f1f] text-center px-2'>
                          {item.label}
                        </span>
                        <button
                          onClick={() => handleRemoveFromZone(index)}
                          disabled={answers[question.id]?.isCorrect}
                          className='absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          ×
                        </button>
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
          {dragIncorrectPositions.length > 0 && (
            <p className='text-[#E9645F] font-semibold text-sm mt-3'>
              Item yang ditandai merah perlu dipindahkan ke posisi yang tepat.
            </p>
          )}
          {dragCorrectPositions.length === 5 &&
            answers[question.id]?.isCorrect && (
              <p className='text-[#7BC142] font-semibold text-sm mt-3'>
                Sempurna! Semua urutan sudah benar! ✓
              </p>
            )}
        </div>

        {availableItems.length > 0 && (
          <div>
            <p className='text-sm font-semibold text-[#2c2c2c] mb-3'>
              Pilih kejadian:
            </p>
            <div className='grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3'>
              {availableItems.map((item) => {
                const originalIndex = question.items.findIndex(
                  (i) => i.id === item.id
                )
                const color = dragColors[originalIndex]
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    className='rounded-xl px-3 py-4 md:px-4 md:py-3 shadow text-center font-semibold cursor-move text-[#1f1f1f] transition hover:scale-105 text-sm border-2'
                    style={{ backgroundColor: color, borderColor: "#2c2c2c" }}
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

  // Render question page
  const renderQuestionPage = (pageData) => {
    const question = pageData.question
    if (!question) return null
    const questionImage = game.questionImageMap[pageData.pageNumber]

    return (
      <div className='w-full max-w-5xl mx-auto px-2'>
        <div className='bg-white rounded-[28px] border-[3px] border-[#2c2c2c] shadow-xl p-4 md:p-6 relative'>
          {questionImage && (
            <div className='mb-4 md:mb-6 flex justify-center mt-2'>
              <img
                src={questionImage}
                alt={`Pertanyaan ${pageData.pageNumber}`}
                className='max-w-full h-[250px] md:h-[350px] rounded-lg object-contain'
              />
            </div>
          )}
          <div className='mb-4 md:mb-5'>
            <p className='text-base md:text-lg font-semibold text-[#2c2c2c] leading-relaxed'>
              {question.question}
            </p>
          </div>
          {question.type === "mc" && renderMultipleChoice(question)}
          {question.type === "tf" && renderTrueFalse(question)}
          {question.type === "drag" && renderDragDrop(question)}
        </div>
      </div>
    )
  }

  // Render bonus page
  const renderBonusPage = () => {
    const bonusImage = game.questionImageMap.bonus
    return (
      <div className='w-full max-w-5xl mx-auto px-2'>
        <div className='bg-white rounded-[28px] border-2 border-[#2c2c2c] shadow-xl p-4 md:p-6'>
          {bonusImage && (
            <div className='mb-4 md:mb-6 flex justify-center'>
              <img
                src={bonusImage}
                alt='Pertanyaan Bonus'
                className='max-w-full h-[250px] md:h-[350px] rounded-lg'
              />
            </div>
          )}
          <div className='text-base md:text-lg font-semibold mb-3 text-[#2c2c2c]'>
            Isi jawaban untuk menyelesaikan tahap bonus.
          </div>
          <textarea
            value={bonusAnswer}
            onChange={(e) => setBonusAnswer(e.target.value)}
            className='w-full h-32 md:h-40 border-2 border-[#2c2c2c] rounded-2xl p-3 md:p-4 text-base md:text-lg shadow focus:outline-none focus:ring-2 focus:ring-[#4fb986]'
            placeholder='Tulis jawabanmu di sini...'
          />
        </div>
      </div>
    )
  }

  const getPageLabel = () => {
    if (currentPage === 11) return "Bonus"
    if (currentPage === 12) return "Hasil Quiz"
    return `${currentPage}/10`
  }

  // Render header
  const renderHeader = () => (
    <div className='w-full max-w-5xl mx-auto px-2 mb-4 md:mb-6'>
      <div className='flex items-center justify-between'>
        <button
          onClick={() => setShowExitWarning(true)}
          className='px-4 py-2 md:px-5 md:py-2 bg-white/80 border-2 border-[#2c2c2c] flex items-center gap-2 rounded-full shadow hover:bg-gray-100 transition font-semibold text-sm md:text-base'
        >
          <ArrowLeft size={18} /> Kembali
        </button>
        <div className='flex items-center gap-2 md:gap-3'>
          <div className='flex items-center gap-2 bg-white/70 px-4 py-2 rounded-full shadow-sm border-2 border-[#2c2c2c]'>
            <Clock size={20} className='text-[#2c2c2c]' />
            <span className='text-[#2c2c2c] font-semibold tracking-[0.12em]'>
              {formatTime(timeElapsed)}
            </span>
          </div>
          <div className='px-3 py-2 md:px-4 md:py-2 bg-white/85 rounded-full flex gap-2 items-center shadow text-sm md:text-base border-2 border-[#2c2c2c]'>
            <span className='font-bold' style={{ color: "#E4AE28" }}>
              XP
            </span>
            <span className='font-semibold'>
              {xp}/{totalXp}
            </span>
          </div>
        </div>
      </div>
      <div className='flex justify-center mt-3 md:mt-4'>
        <span className='text-xl md:text-2xl font-bold text-[#2c2c2c]'>
          {getPageLabel()}
        </span>
      </div>
    </div>
  )

  // Render incorrect popup
  const renderIncorrectPopup = () => {
    if (!showIncorrectPopup) return null
    const currentQ = game.questions.find((q) => q.page === currentPage)
    const message =
      currentQ?.incorrectMessage ||
      "Uh oh... jawabannya kurang tepat, ayo coba lagi!"

    const handleTryAgain = () => {
      setAnswers((prev) => {
        const newAnswers = { ...prev }
        if (currentQ) delete newAnswers[currentQ.id]
        return newAnswers
      })
      setShowIncorrectPopup(false)
    }

    return (
      <div className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4'>
        <div className='bg-[#fff4d6] w-[90%] max-w-md rounded-3xl border-[3px] border-[#e9c499] shadow-2xl p-6 md:p-8 text-center'>
          <img
            src='/assets/budayana/islands/image 90.png'
            alt='warning'
            className='w-24 md:w-32 mx-auto mb-3'
          />
          <p className='text-base md:text-lg font-semibold text-[#2f2f2f] leading-relaxed mb-4 md:mb-6'>
            {message}
          </p>
          <button
            onClick={handleTryAgain}
            className='w-full bg-[#f88c63] text-white font-bold py-2 md:py-3 rounded-full shadow-md hover:bg-[#e27852] transition text-sm md:text-base'
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  // Render result page
  const renderResultPage = () => {
    const correctAnswersCount = Object.values(answers).filter(
      (a) => a.isCorrect
    ).length
    const totalQuestions = 5

    return (
      <div className='w-full max-w-4xl mx-auto px-2'>
        <div className='bg-white rounded-[40px] shadow-2xl p-6 md:p-10 border-[3px] border-[#2c2c2c] text-center min-h-125 flex flex-col items-center justify-center relative'>
          <div className='bg-[#E4AE28] text-white font-extrabold text-3xl md:text-4xl px-12 py-3 rounded-full shadow-lg mb-8 border-[3px] border-[#fff4d6] ring-4 ring-[#E4AE28]/30'>
            Berhasil!
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full mb-8 md:mb-10'>
            <div className='bg-[#C894E6] rounded-3xl p-6 border-[3px] border-[#2c2c2c] shadow-lg flex flex-col items-center justify-center gap-2 transform hover:scale-105 transition duration-300'>
              <span className='text-[#2c2c2c] font-extrabold text-xl md:text-2xl'>
                Quiz
              </span>
              <span className='text-[#2c2c2c] font-black text-3xl md:text-4xl'>
                {correctAnswersCount}/{totalQuestions}
              </span>
            </div>
            <div className='bg-[#FF9ECF] rounded-3xl p-6 border-[3px] border-[#2c2c2c] shadow-lg flex flex-col items-center justify-center gap-2 transform hover:scale-105 transition duration-300'>
              <span className='text-[#2c2c2c] font-extrabold text-xl md:text-2xl'>
                Waktu
              </span>
              <div className='text-[#2c2c2c] font-black text-xl md:text-xl flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 leading-tight'>
                <span>{Math.floor((finalTime || timeElapsed) / 60)} Menit</span>
                <span>{(finalTime || timeElapsed) % 60} Detik</span>
              </div>
            </div>
            <div className='bg-[#5ADCB6] rounded-3xl p-6 border-[3px] border-[#2c2c2c] shadow-lg flex flex-col items-center justify-center gap-2 transform hover:scale-105 transition duration-300'>
              <span className='text-[#2c2c2c] font-extrabold text-xl md:text-2xl'>
                Total XP
              </span>
              <span className='text-[#2c2c2c] font-black text-3xl md:text-4xl'>
                {xp} XP
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/islands/${islandSlug}/post-test`)}
            className='bg-[#F7885E] hover:bg-[#e4764c] text-white font-extrabold text-xl md:text-2xl px-12 py-3 md:py-4 rounded-full shadow-lg border-b-4 border-[#c9623d] active:border-b-0 active:translate-y-1 transition-all'
          >
            Lanjutkan
          </button>
        </div>
      </div>
    )
  }

  // Exit warning popup
  const renderExitWarning = () => {
    if (!showExitWarning) return null
    return (
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
            onClick={() => navigate("/")}
            className='text-[#e64c45] font-bold'
          >
            Akhiri Sesi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#fdf4d7] flex flex-col px-2 md:px-4 py-4 md:py-8'>
      {renderHeader()}
      <div className='flex-1 flex items-center justify-center w-full'>
        {currentPage === 12
          ? renderResultPage()
          : currentPage === 11
          ? renderBonusPage()
          : currentPageData?.type === "story"
          ? renderStoryPage(currentPageData)
          : currentPageData?.type === "question"
          ? renderQuestionPage(currentPageData)
          : null}
      </div>

      {currentPage <= 11 && (
        <div className='w-full max-w-5xl mx-auto mt-6 px-2 flex justify-between items-center'>
          <button
            onClick={goPrev}
            disabled={currentPage === 1}
            className='flex items-center gap-2 px-5 py-2 md:px-6 md:py-3 rounded-full text-white font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed'
            style={{ backgroundColor: currentPage === 1 ? "#ccc" : "#f27f68" }}
          >
            <ArrowLeft size={20} /> Sebelumnya
          </button>
          <button
            onClick={goNext}
            disabled={!canContinue()}
            className='flex items-center gap-2 px-5 py-2 md:px-6 md:py-3 rounded-full text-white font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed'
            style={{ backgroundColor: canContinue() ? "#4fb986" : "#ccc" }}
          >
            Berikutnya <ArrowRight size={20} />
          </button>
        </div>
      )}

      {renderIncorrectPopup()}
      {renderExitWarning()}
    </div>
  )
}
