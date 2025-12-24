import { useResults } from "../hooks/useResults"
import "./Results.css"

export default function Results() {
  const { stats, attempts, isLoading } = useResults()

  const formatDate = (dateString) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (dateString) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
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
            <div className='stat-label'>Cerita Selesai</div>
          </div>
          <div className='stat-card purple'>
            <div className='stat-value'>{stats?.totalXp || 0}</div>
            <div className='stat-label'>Total XP</div>
          </div>
          <div className='stat-card pink'>
            <div className='stat-value'>
              {stats?.averagePreTestScore !== undefined
                ? Math.round(stats.averagePreTestScore) + "%"
                : "0%"}
            </div>
            <div className='stat-label'>Rata-rata Pre Test</div>
          </div>
          <div className='stat-card orange'>
            <div className='stat-value'>
              {stats?.averagePostTestScore !== undefined
                ? Math.round(stats.averagePostTestScore) + "%"
                : "0%"}
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
            {attempts.length === 0 ? (
              <div className='empty-message'>Belum ada riwayat permainan.</div>
            ) : (
              attempts.map((attempt) => (
                <div key={attempt.id} className='history-row'>
                  <div>{attempt.story?.title || "Unknown Story"}</div>
                  <div>
                    {attempt.preTestScore !== null ? attempt.preTestScore : "-"}
                  </div>
                  <div>
                    {attempt.postTestScore !== null
                      ? attempt.postTestScore
                      : "-"}
                  </div>
                  <div>{attempt.totalXpGained || 0}</div>
                  <div>{formatDate(attempt.startedAt)}</div>
                  <div>{formatTime(attempt.startedAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
