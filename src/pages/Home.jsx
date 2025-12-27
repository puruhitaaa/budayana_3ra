import { useState, useMemo, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import "./Home.css"
import { Check } from 'lucide-react'
import {
  useAttempts,
  getStoryUnlockStatus,
  getLatestStoryScore,
} from "../hooks/useAttempts"
import { useMyProgress, useIslandCycles } from "../hooks/useProgress"
import { useIsland } from "../hooks/useIslands"
import { islands as staticIslands } from "../data/islands"

// Helper to see if we need special slug handling
function getIslandSlug(name) {
  const lower = name.toLowerCase()
  if (lower === "nusa tenggara") return "nusa"
  return lower
}

// ISLAND DISPLAY DATA (positions on map)
const islandPositions = {
  sumatra: { left: "5%", top: "25%" },
  kalimantan: { left: "28%", top: "28%" },
  sulawesi: { left: "49%", top: "40%" },
  maluku: { left: "63%", top: "40%" },
  papua: { left: "75%", top: "45%" },
  jawa: { left: "25%", top: "70%" },
  bali: { left: "50%", top: "75%" },
  nusa: { left: "60%", top: "72%" },
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
function StageCard({ stage, status, index, onClick, attempts }) {
  const isLocked = status === "locked"
  const isCompleted = status === "completed"

  /* Logic for Label and Value */
  const { label, value } = useMemo(() => {
    if (!attempts || !stage.id) return { label: null, value: null }

    // Find latest finished attempt for this stage
    // attempts is likely an array of objects
    const stageAttempts = attempts.filter(
      (a) => (a.storyId === stage.id || a.story?.id === stage.id) && a.finishedAt
    )
    if (stageAttempts.length === 0) return { label: null, value: null }

    // Sort by finishedAt desc
    const latest = stageAttempts.sort(
      (a, b) => new Date(b.finishedAt) - new Date(a.finishedAt)
    )[0]

    const lowerTitle = stage.title.toLowerCase()
    const isTest = lowerTitle.includes("pre-test") || lowerTitle.includes("post-test")

    if (isTest) {
      // Test: Show Score
      const score = lowerTitle.includes("pre")
        ? latest.preTestScore
        : latest.postTestScore

      return {
        label: "Nilai Terakhir",
        value: score !== undefined && score !== null ? Math.round(score) : null
      }
    } else {
      // Story/Game: Show XP
      // If Static (no calculation), default to 100
      // Check if it's static via API type or known static islands
      let xp = latest.totalXpGained

      // Fallback for Static Stories (e.g. Jawa/Papua) that might have 0 XP recorded
      // Assuming if it's finished and XP is 0/null, it's 100 for static content
      if (!xp && (stage.apiStageType === "STATIC" || !stage.apiStageType)) {
        xp = 100
      }

      return {
        label: "XP Terakhir",
        value: xp !== undefined && xp !== null ? xp : 0
      }
    }
  }, [attempts, stage])

  return (
    <div
      className={`stage-card ${isLocked ? "locked" : ""} ${isCompleted ? "completed" : ""
        }`}
      onClick={!isLocked ? onClick : undefined}
      style={{ cursor: isLocked ? "not-allowed" : "pointer" }}
    >
      <img
        src={`/assets/budayana/islands/tahap ${(index % 3) + 1}.png`}
        className='stage-bg'
        alt={stage.title}
      />

      <div className='stage-content'>
        <p className='stage-title'>{stage.title}</p>
        <div className={`stage-order tahap-${index + 1}`}>
          Tahap {index + 1}
        </div>
        {isCompleted && (
          <div className='stage-check'>
            <Check size={18} strokeWidth={3} color='#ffffff' />
          </div>
        )}
        {status === "resume" && (
          <button className='resume-btn'>Lanjutkan</button>
        )}
      </div>
      {value !== null && label && (
        <div className='stage-score-badge'>
          {label}: {value}
        </div>
      )}

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
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeIsland, setActiveIsland] = useState(null)

  // Fetch user's progress from API
  const { data: progressData, isLoading: isProgressLoading } = useMyProgress()

  // Use API progress data merged with static config
  const allIslands = useMemo(() => {
    // Create a map of progress items for easier lookup
    const progressMap = new Map()
    if (progressData && progressData.items) {
      progressData.items.forEach((item) => {
        if (item.island && item.island.islandName) {
          const slug = getIslandSlug(item.island.islandName)
          progressMap.set(slug, item)
        }
      })
    }

    // Merge static islands with progress data
    return staticIslands.map((staticIsland) => {
      const progressItem = progressMap.get(staticIsland.slug)

      return {
        ...staticIsland, // includes id, slug, name, etc.
        // If progress exists, use it. Else use static defaults.
        isUnlocked: progressItem
          ? progressItem.isUnlocked
          : !staticIsland.isLockedDefault,
        isCompleted: progressItem ? progressItem.isCompleted : false,
        apiIslandId: progressItem ? progressItem.islandId : null,
      }
    })
  }, [progressData])

  // Auto-open island popup from URL param (only on initial load)
  useEffect(() => {
    const islandParam = searchParams.get("island")
    if (islandParam && allIslands.length > 0 && !activeIsland) {
      const matchedIsland = allIslands.find(
        (i) => i.slug === islandParam || i.id === islandParam
      )
      if (matchedIsland) {
        // Use setTimeout to avoid synchronous setState in effect warning
        setTimeout(() => setActiveIsland(matchedIsland), 0)
      }
    }
    // Only run when allIslands changes (i.e., on initial data load)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allIslands])

  // Handle island popup open/close with URL sync
  const handleOpenIsland = (island) => {
    setActiveIsland(island)
    setSearchParams({ island: island.slug }, { replace: true })
  }

  const handleCloseIsland = () => {
    setActiveIsland(null)
    setSearchParams({}, { replace: true })
  }

  // attempts and completed stages logic moved to IslandPopup

  const goToProfile = () => navigate("/profile")

  // const handleStageClick = (stage, status) => {
  //   if (status === "locked") return
  //   navigate(stage.route)
  // }

  return (
    <div className='page'>
      {/* HEADER */}
      <div className='header'>
        <div className='completedStories'>
          <h1>Tahap Selesai: {progressData?.completedStory}</h1>
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
            onClick={() => handleOpenIsland(island)}
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
        <img
          src='/assets/budayana/islands/wave1.png'
          alt='wave2'
          className='wave wave10'
        />
        <img
          src='/assets/budayana/islands/wave2.png'
          alt='wave2'
          className='wave wave11'
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
        {/* <img
          src='/assets/budayana/islands/bocah.png'
          alt='bocah'
          className='bocah'
        /> */}
      </div>

      {/* POPUP */}
      {activeIsland && (
        <IslandPopup activeIsland={activeIsland} onClose={handleCloseIsland} />
      )}
    </div>
  )
}

function IslandPopup({ activeIsland, onClose }) {
  const navigate = useNavigate()
  // Fetch dynamic island details including stories
  const { data: islandDetails, isLoading: isIslandLoading } = useIsland(
    activeIsland.slug
  )

  // Fetch attempts for this island
  // Use API ID from progress if available, otherwise from island details
  const { data: attempts } = useAttempts(
    activeIsland.apiIslandId || islandDetails?.id
  )

  // Fetch cycle count for this island
  const { data: cyclesData } = useIslandCycles(activeIsland.apiIslandId)

  const handleStageClick = (stage, status) => {
    if (status === "locked") return

    let finalRoute = stage.route

    // If resuming, try to find last read page from localStorage
    if (status === "resume") {
      try {
        const storageKey = `budayana_story_${stage.id}_pagesRead`
        const savedPages = localStorage.getItem(storageKey)

        if (savedPages) {
          const pages = JSON.parse(savedPages)
          if (Array.isArray(pages) && pages.length > 0) {
            const lastPage = Math.max(...pages)
            finalRoute = `${finalRoute}?page=${lastPage}`
          }
        }
      } catch (e) {
        console.warn("Failed to retrieve resume position", e)
      }
    }

    navigate(finalRoute)
  }

  // Helper to map API stories to stage cards
  const getDynamicStages = (stories, islandSlug) => {
    if (!stories) return []

    return stories.map((story, index) => {
      // Determine route based on story type or title keyword
      let route = ""
      const lowerTitle = story.title.toLowerCase()

      if (lowerTitle.includes("pre-test")) {
        route = `/islands/${islandSlug}/story/${story.id}/pre-test`
      } else if (lowerTitle.includes("post-test")) {
        route = `/islands/${islandSlug}/story/${story.id}/post-test`
      } else {
        // Use storyType from API to determine route
        // STATIC stories use flipbook, INTERACTIVE stories use game page
        if (story.storyType === "STATIC") {
          route = `/islands/${islandSlug}/story/${story.id}`
        } else {
          route = `/islands/${islandSlug}/story/${story.id}/game`
        }
      }

      return {
        id: story.id,
        key: story.id,
        title: story.title,
        route: route,
        apiStageType: story.storyType,
        order: story.order || index + 1,
      }
    })
  }

  const stages = useMemo(() => {
    if (!islandDetails?.stories) return []
    return getDynamicStages(
      islandDetails.stories,
      activeIsland.slug || activeIsland.id
    )
  }, [islandDetails, activeIsland])

  // Calculate story unlock status based on attempts with finishedAt
  // A story is unlocked if the previous story (lower order) has been finished
  // Note: attempts API returns { items: [...], nextCursor, hasMore }
  const storyUnlockStatus = useMemo(() => {
    if (!islandDetails?.stories) return {}
    const attemptItems = attempts?.items || []
    return getStoryUnlockStatus(islandDetails.stories, attemptItems)
  }, [islandDetails, attempts])

  // Helper to get stage status from the new unlock logic
  const getStageStatusFromUnlock = (stageId) => {
    const status = storyUnlockStatus[stageId]
    if (!status) return "locked"
    if (status.isFinished) return "completed"
    if (status.isUnlocked) {
      // If started but not finished, it's resume
      if (status.isStarted) return "resume"
      return "unlocked"
    }
    return "locked"
  }

  // Count unlocked stages for progress dots (shows how far user has reached)
  const completedCount = useMemo(() => {
    return Object.values(storyUnlockStatus).filter((s) => s.isUnlocked).length
  }, [storyUnlockStatus])

  // Calculate total finished attempts for this island
  const totalFinishedAttempts = useMemo(() => {
    if (!attempts?.items) return 0
    return attempts.items.filter((a) => a.finishedAt).length
  }, [attempts])

  const isLoading = isIslandLoading

  return (
    <div className='popup-overlay' onClick={onClose}>
      <div
        className={`popup ${activeIsland.isUnlocked ? "popup-unlocked" : "popup-locked"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {activeIsland.isUnlocked ? (
          <div className='unlockedpopup'>
            {/* Close button */}
            <button className='popup-close' onClick={onClose}>
              <img
                src='/assets/budayana/islands/close button.png'
                className='close-button'
                alt='close'
              />
            </button>

            {/* Cycle Count */}
            <div className='popup-cycle-count'>
              Percobaan : {totalFinishedAttempts}
            </div>

            {/* Title */}
            <h2 className='popup-title'>{activeIsland.name}</h2>
            <ProgressDots
              completed={completedCount}
              total={stages.length || 3}
            />

            {/* Loading state */}
            {isLoading && <div className='loading-text'>Memuat cerita...</div>}

            {/* Stage Grid */}
            {!isLoading && (
              <div className='stage-grid'>
                {stages.map((stage, index) => {
                  const status = getStageStatusFromUnlock(stage.id)
                  return (
                    <StageCard
                      key={stage.key}
                      stage={stage}
                      status={status}
                      index={index}
                      attempts={attempts?.items}
                      onClick={() => handleStageClick(stage, status)}
                    />
                  )
                })}
              </div>
            )}
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

            <button className='ok-btn' onClick={onClose}>
              Oke!
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
