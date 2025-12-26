
import { useEffect, useState } from "react"
import { useResults } from "../hooks/useResults"
import { islands } from "../data/islands"
import { islandsApi } from "../lib/api"
import "./Results.css"


export default function Results() {
  const { stats, attempts, isLoading } = useResults()
  const [storyIslandMap, setStoryIslandMap] = useState({})


  // Fetch all islands to build a StoryID -> IslandName map
  useEffect(() => {
    const fetchAllIslands = async () => {
      try {
        const promises = islands.map((island) =>
          islandsApi.getIsland(island.slug).catch(() => null)
        )
        const results = await Promise.all(promises)


        const newMap = {}
        results.forEach((islandData) => {
          if (islandData && islandData.stories) {
            islandData.stories.forEach((story) => {
              newMap[story.id] = islandData.name
            })
          }
        })
        setStoryIslandMap(newMap)
      } catch (error) {
        console.error("Failed to fetch island details for mapping", error)
      }
    }


    fetchAllIslands()
  }, [])


  const formatDate = (dateString) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }


  const formatDuration = (seconds) => {
    if (seconds === undefined || seconds === null) return "-"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(mins).padStart(2, "0")} : ${String(secs).padStart(2, "0")}`
  }

  // Helper to get island name
  const getIslandName = (attempt) => {
    // 0. Try map from storyId
    const storyId = attempt.storyId || attempt.story?.id
    if (storyId && storyIslandMap[storyId]) {
      return storyIslandMap[storyId]
    }


    // 1. Try to find by islandId in story
    if (attempt.story?.islandId) {
      const island = islands.find((i) => i.id === attempt.story.islandId)
      if (island) return island.name
    }


    // 2. Try to match story title to island configuration
    const title = attempt.story?.title || ""
    const islandByStory = islands.find(
      (i) => i.storyTitle.toLowerCase() === title.toLowerCase()
    )
    if (islandByStory) return islandByStory.name


    // 3. Last filtered fallback checking common names if title contains island name
    const lowerTitle = title.toLowerCase()
    const islandByName = islands.find(i => lowerTitle.includes(i.name.toLowerCase()))
    if (islandByName) return islandByName.name


    return ""
  }


  const getDisplayTitle = (attempt) => {
    const rawTitle = attempt.story?.title || "Unknown Story"
    const lowerTitle = rawTitle.toLowerCase()

    // Debug log
    console.log("Story data:", {
      title: rawTitle,
      island: attempt.story?.island,
      storyId: attempt.storyId || attempt.story?.id
    })

    // Get island name from API data 
    let islandName = ""
    if (attempt.story?.island?.islandName) {
      islandName = attempt.story.island.islandName
    } else {
      // Fallback to map if island data not in attempt
      islandName = getIslandName(attempt)
    }

    console.log("Final island name:", islandName) // Debug

    const suffix = islandName ? ` ${islandName}` : ""

    if (lowerTitle.includes("pre-test")) {
      return `Pre-Test${suffix}`
    } else if (lowerTitle.includes("post-test")) {
      return `Post-Test${suffix}`
    } else {
      if (islandName && lowerTitle.includes(islandName.toLowerCase())) {
        return rawTitle
      }
      return `${rawTitle}${suffix}`
    }
  }



  if (isLoading) {
    return (
      <div className='results-container'>
        <p>Memuat data...</p>
      </div>
    )
  }


  return (
    <div className='results-container'>
      {/* Statistics Section */}
      <section>
        <h2 className='results-section-title'>Statistik</h2>
        <div className='stats-grid'>
          <div className='stat-card green'>
            <div className='stat-value'>{stats?.storiesCompleted || 0}</div>
            <div className='stat-label'>Tahap Selesai</div>
          </div>
          <div className='stat-card purple'>
            <div className='stat-value'>{stats?.totalXp || 0}</div>
            <div className='stat-label'>Total XP</div>
          </div>
          <div className='stat-card pink'>
            <div className='stat-value'>
              {stats?.averagePreTestScore !== undefined
                ? Math.round(stats.averagePreTestScore)
                : "0"}
            </div>
            <div className='stat-label'>Rata-rata Pre Test</div>
          </div>
          <div className='stat-card orange'>
            <div className='stat-value'>
              {stats?.averagePostTestScore !== undefined
                ? Math.round(stats.averagePostTestScore)
                : "0"}
            </div>
            <div className='stat-label'>Rata-rata Post Test</div>
          </div>
        </div>
      </section>


      {/* History Section */}
      <section>
        <h2 className='results-section-title'>Riwayat Skor</h2>
        <div className='history-table-container'>
          <div className='history-header'>
            <div>Cerita</div>
            <div>Pre-test</div>
            <div>Post-test</div>
            <div>XP</div>
            <div>Tanggal</div>
            <div>Waktu</div>
          </div>
          <div className='history-body'>
            {(() => {
              // Filter attempts to show only valid completed ones
              const filteredAttempts = attempts.filter((attempt) => {
                // Must be finished
                if (!attempt.finishedAt) return false


                const title = (attempt.story?.title || "").toLowerCase()


                // For Pre-test, must have a score
                if (title.includes("pre-test")) return attempt.preTestScore !== null


                // For Post-test, must have a score
                if (title.includes("post-test")) return attempt.postTestScore !== null


                // For Stories/Games:
                return true
              })


              if (filteredAttempts.length === 0) {
                return (
                  <div className='empty-message'>
                    Belum ada riwayat permainan.
                  </div>
                )
              }


              return filteredAttempts.map((attempt) => {
                const displayTitle = getDisplayTitle(attempt)
                const isTest =
                  displayTitle.toLowerCase().includes("pre-test") ||
                  displayTitle.toLowerCase().includes("post-test")


                // Display XP
                let displayXp = attempt.totalXpGained || 0
                if (displayXp === 0 && attempt.stages && attempt.stages.length > 0) {
                  displayXp = attempt.stages.reduce((sum, s) => sum + (s.xpGained || 0), 0)
                }


                if (displayXp === 0 && !isTest) {
                  displayXp = 100;
                }

                // Calculate duration
                let duration = attempt.totalTimeSeconds
                if (duration === undefined || duration === null) {
                  if (attempt.finishedAt && attempt.startedAt) {
                    duration = (new Date(attempt.finishedAt) - new Date(attempt.startedAt)) / 1000
                  } else {
                    duration = 0
                  }
                }


                return (
                  <div key={attempt.id} className='history-row'>
                    <div>{displayTitle}</div>
                    <div>
                      {isTest && attempt.preTestScore !== null
                        ? attempt.preTestScore
                        : "-"}
                    </div>
                    <div>
                      {isTest && attempt.postTestScore !== null
                        ? attempt.postTestScore
                        : "-"}
                    </div>
                    <div>{displayXp}</div>
                    <div>{formatDate(attempt.startedAt)}</div>
                    <div>{formatDuration(duration)}</div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </section>
    </div>
  )
}