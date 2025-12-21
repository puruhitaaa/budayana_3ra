import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import "./Home.css"
import { useAttempts, isStageCompleted } from "../hooks/useAttempts"
import { useMyProgress } from "../hooks/useProgress"

// Helper to see if we need special slug handling
function getIslandSlug(name) {
  const lower = name.toLowerCase()
  if (lower === "nusa tenggara") return "nusa"
  return lower
}

// ISLAND DISPLAY DATA (positions on map)
const islandPositions = {
  sumatra: { left: "12%", top: "25%" },
  kalimantan: { left: "31%", top: "28%" },
  sulawesi: { left: "49%", top: "40%" },
  maluku: { left: "62%", top: "42%" },
  papua: { left: "71%", top: "45%" },
  jawa: { left: "30%", top: "70%" },
  bali: { left: "53%", top: "75%" },
  nusa: { left: "60%", top: "72%" },
}

// Get stages configuration for an island
function getStagesConfig(islandSlug) {
  // Jawa and Papua have story book, Sulawesi and Sumatra have interactive game
  const hasStoryBook = islandSlug === "jawa" || islandSlug === "papua"

  return [
    {
      key: "pre-test",
      title: "Pre-Test",
      stage: "Stage 1",
      route: `/islands/${islandSlug}/pre-test`,
      apiStageType: "PRE_TEST",
    },
    {
      key: hasStoryBook ? "story" : "game",
      title: hasStoryBook ? "Buku Cerita Rakyat" : "Cerita Rakyat Interaktif",
      stage: "Stage 2",
      route: hasStoryBook
        ? `/islands/${islandSlug}/story`
        : `/islands/${islandSlug}/game`,
      apiStageType: "STORY",
    },
    {
      key: "post-test",
      title: "Post-Test",
      stage: "Stage 3",
      route: `/islands/${islandSlug}/post-test`,
      apiStageType: "POST_TEST",
    },
  ]
}

// Determine stage status based on progress
function getStageStatus(stageIndex, completedStages) {
  // Stage is completed if it's in completedStages
  if (completedStages.includes(stageIndex)) return "completed"

  // Stage is unlocked if all previous stages are completed
  const allPreviousCompleted = Array.from(
    { length: stageIndex },
    (_, i) => i
  ).every((i) => completedStages.includes(i))

  if (allPreviousCompleted) return "unlocked"

  // Default: first stage is always unlocked
  if (stageIndex === 0) return "unlocked"

  return "locked"
}

function ProgressDots({ completed = 0, total = 3 }) {
  return (
    <div className='progress-dots'>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`dot ${i < completed ? "dot-active" : "dot-inactive"}`}
        />
      ))}
    </div>
  )
}

// Stage Card Component with navigation
function StageCard({ stage, status, index, onClick }) {
  const isLocked = status === "locked"
  const isCompleted = status === "completed"

  return (
    <div
      className={`stage-card ${isLocked ? "locked" : ""} ${
        isCompleted ? "completed" : ""
      }`}
      onClick={!isLocked ? onClick : undefined}
      style={{ cursor: isLocked ? "not-allowed" : "pointer" }}
    >
      <img
        src={`/assets/budayana/islands/tahap ${index + 1}.png`}
        className='stage-bg'
        alt={stage.title}
      />

      <div className='stage-content'>
        <p className='stage-title'>{stage.title}</p>
        {isCompleted && <span className='stage-check'>✓</span>}
      </div>

      {isLocked && (
        <div className='stage-lock-overlay'>
          <img
            src='/assets/budayana/islands/padlock.png'
            className='stage-lock-icon'
            alt='locked'
          />
        </div>
      )}
    </div>
  )
}

// Island component with locked/unlocked visual states
function IslandImage({ island, position, onClick }) {
  const isLocked = !island.isUnlocked

  return (
    <div
      className='island-container'
      style={{
        position: "absolute",
        left: position.left,
        top: position.top,
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      <img
        src={`/assets/budayana/islands/${island.name}.png`}
        alt={island.name}
        className={`island ${island.slug}`}
        style={{
          position: "relative", // Override CSS position: absolute
          top: 0,
          left: 0,
          filter: isLocked ? "brightness(0.4) grayscale(0.3)" : "none",
          transition: "filter 0.3s ease",
        }}
      />
      {isLocked && (
        <div
          className='island-lock-overlay'
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
          }}
        >
          <img
            src='/assets/budayana/islands/padlock.png'
            alt='locked'
            style={{
              width: "auto",
              height: "40px",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
            }}
          />
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [activeIsland, setActiveIsland] = useState(null)

  // Fetch user's progress from API
  const { data: progressData, isLoading: isProgressLoading } = useMyProgress()

  // Use API progress data directly for islands logic
  const allIslands = useMemo(() => {
    if (progressData && progressData.items) {
      return progressData.items.map((item) => {
        const name = item.island?.islandName || "Unknown"
        const slug = getIslandSlug(name)

        return {
          id: slug,
          slug: slug,
          name: name,
          isUnlocked: item.isUnlocked,
          isCompleted: item.isCompleted,
          apiIslandId: item.islandId,
        }
      })
    }
    return []
  }, [progressData])

  // Fetch attempts for the active island (story-based)
  const { data: attempts, isLoading } = useAttempts(activeIsland?.id)

  // Calculate completed stages based on API data
  const completedStages = useMemo(() => {
    if (!attempts || !activeIsland) return []

    const completed = []
    const stagesConfig = getStagesConfig(activeIsland.slug)

    stagesConfig.forEach((stage, index) => {
      if (isStageCompleted(attempts, stage.apiStageType)) {
        completed.push(index)
      }
    })

    return completed
  }, [attempts, activeIsland])

  const goToProfile = () => navigate("/profile")

  const handleStageClick = (stage, status) => {
    if (status === "locked") return
    navigate(stage.route)
  }

  // Count total completed stories
  const totalCompletedStories = useMemo(() => {
    if (progressData && progressData.items) {
      return progressData.items.filter((p) => p.isCompleted).length
    }
    return 0
  }, [progressData])

  return (
    <div className='page'>
      {/* HEADER */}
      <div className='header'>
        <div className='completedStories'>
          <h1>Cerita Selesai: {totalCompletedStories}</h1>
        </div>

        <div className='gameName'>
          <img src='/assets/budayana/islands/Game Name.png' alt='Budayana' />
        </div>

        <div className='profile' onClick={goToProfile}>
          <img src='/assets/budayana/islands/Profile.png' alt='Profil' />
        </div>
      </div>

      {/* Loading indicator */}
      {isProgressLoading && (
        <div
          style={{
            position: "absolute",
            top: "100px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
          }}
        >
          <span
            style={{
              color: "#fff",
              background: "rgba(0,0,0,0.5)",
              padding: "8px 16px",
              borderRadius: "8px",
            }}
          >
            Memuat progress...
          </span>
        </div>
      )}

      {/* MAP ISLANDS */}
      {allIslands.map((island) => {
        const position =
          islandPositions[island.id] || islandPositions[island.slug]
        if (!position) return null

        return (
          <IslandImage
            key={island.id || island.slug}
            island={island}
            position={position}
            onClick={() => setActiveIsland(island)}
          />
        )
      })}

      {/* BACKGROUND ASSETS */}
      <div className='backgroundassets'>
        {/* Waves */}
        <img
          src='/assets/budayana/islands/wave1.png'
          alt='wave1'
          className='wave wave1'
        />
        <img
          src='/assets/budayana/islands/wave1.png'
          alt='wave1'
          className='wave wave2'
        />
        <img
          src='/assets/budayana/islands/wave1.png'
          alt='wave1'
          className='wave wave3'
        />
        <img
          src='/assets/budayana/islands/wave1.png'
          alt='wave1'
          className='wave wave4'
        />
        <img
          src='/assets/budayana/islands/wave1.png'
          alt='wave1'
          className='wave wave5'
        />
        <img
          src='/assets/budayana/islands/wave1.png'
          alt='wave1'
          className='wave wave6'
        />
        <img
          src='/assets/budayana/islands/wave2.png'
          alt='wave2'
          className='wave wave7'
        />
        <img
          src='/assets/budayana/islands/wave2.png'
          alt='wave2'
          className='wave wave8'
        />
        <img
          src='/assets/budayana/islands/wave2.png'
          alt='wave2'
          className='wave wave9'
        />

        {/* Animals */}
        <img
          src='/assets/budayana/islands/paus.png'
          alt='paus'
          className='paus'
        />
        <img
          src='/assets/budayana/islands/hiuk.png'
          alt='hiuk'
          className='hiuk'
        />

        {/* Character */}
        <img
          src='/assets/budayana/islands/bocah.png'
          alt='bocah'
          className='bocah'
        />
      </div>

      {/* POPUP */}
      {activeIsland && (
        <div className='popup-overlay' onClick={() => setActiveIsland(null)}>
          <div
            className={`popup ${
              activeIsland.isUnlocked ? "popup-unlocked" : "popup-locked"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {activeIsland.isUnlocked ? (
              <div className='unlockedpopup'>
                {/* Close button */}
                <button
                  className='popup-close'
                  onClick={() => setActiveIsland(null)}
                >
                  <img
                    src='/assets/budayana/islands/close button.png'
                    className='close-button'
                    alt='close'
                  />
                </button>

                {/* Title */}
                <h2 className='popup-title'>{activeIsland.name}</h2>
                <ProgressDots completed={completedStages.length} total={3} />

                {/* Loading state */}
                {isLoading && (
                  <div className='loading-text'>Memuat progress...</div>
                )}

                {/* Stage Grid */}
                <div className='stage-grid'>
                  {getStagesConfig(activeIsland.slug || activeIsland.id).map(
                    (stage, index) => {
                      const status = getStageStatus(index, completedStages)
                      return (
                        <StageCard
                          key={stage.key}
                          stage={stage}
                          status={status}
                          index={index}
                          onClick={() => handleStageClick(stage, status)}
                        />
                      )
                    }
                  )}
                </div>
              </div>
            ) : (
              /* LOCKED POPUP */
              <div className='lockedpopup'>
                <img
                  src='/assets/budayana/islands/bocah flip.png'
                  className='notif-kid'
                  alt='notif-kid'
                />

                <p className='locked-msg'>
                  Maaf, cerita ini masih dalam proses pengembangan. Tunggu ya!
                </p>

                <button
                  className='ok-btn'
                  onClick={() => setActiveIsland(null)}
                >
                  Oke!
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
