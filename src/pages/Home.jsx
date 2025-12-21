import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./Home.css"

// ISLAND DATA
const islandData = [
  { id: "sumatra", name: "Sumatra", unlocked: true, left: "12%", top: "25%" },
  {
    id: "kalimantan",
    name: "Kalimantan",
    unlocked: false,
    left: "31%",
    top: "28%",
  },
  { id: "sulawesi", name: "Sulawesi", unlocked: true, left: "49%", top: "40%" },
  { id: "maluku", name: "Maluku", unlocked: false, left: "62%", top: "42%" },
  { id: "papua", name: "Papua", unlocked: true, left: "71%", top: "45%" },
  { id: "jawa", name: "Jawa", unlocked: true, left: "30%", top: "70%" },
  { id: "bali", name: "Bali", unlocked: false, left: "53%", top: "75%" },
  {
    id: "nusa",
    name: "Nusa Tenggara",
    unlocked: false,
    left: "60%",
    top: "72%",
  },
]

// DYNAMIC STAGES per ISLAND
function getStagesForIsland(id) {
  const baseStages = [
    { title: "Pre-Test", stage: "Stage 1", status: "completed" },
    { title: "Post-Test", stage: "Stage 3", status: "locked" },
  ]

  if (id === "jawa" || id === "papua") {
    return [
      baseStages[0],
      { title: "Buku Cerita Rakyat", stage: "Stage 2", status: "locked" },
      baseStages[1],
    ]
  }

  if (id === "sumatra" || id === "sulawesi") {
    return [
      baseStages[0],
      { title: "Cerita Rakyat Interaktif", stage: "Stage 2", status: "locked" },
      baseStages[1],
    ]
  }
}

function ProgressDots({ active = 1, total = 3 }) {
  return (
    <div className='progress-dots'>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`dot ${i < active ? "dot-active" : "dot-inactive"}`}
        />
      ))}
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()

  const goToProfile = () => {
    navigate("/profile")
  }

  const [activeIsland, setActiveIsland] = useState(null)

  return (
    <div className='page'>
      {/* HEADER */}
      <div className='header'>
        <div className='completedStories'>
          <h1>Cerita Selesai:</h1>
        </div>

        <div className='gameName'>
          <img src='/assets/budayana/islands/Game Name.png' alt='Budayana' />
        </div>

        <div className='profile' onClick={goToProfile}>
          <img src='/assets/budayana/islands/Profile.png' alt='Profil' />
        </div>
      </div>

      {/* MAP ISLANDS */}
      {islandData.map((island) => (
        <img
          key={island.id}
          src={`/assets/budayana/islands/${island.name}.png`}
          alt={island.name}
          className={`island ${island.id}`}
          style={{ left: island.left, top: island.top }}
          onClick={() => setActiveIsland(island)}
        />
      ))}

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
              activeIsland.unlocked ? "popup-unlocked" : "popup-locked"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {activeIsland.unlocked ? (
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
                <ProgressDots active={1} total={3} />

                <div className='stage-grid'>
                  {getStagesForIsland(activeIsland.id).map((stage, index) => (
                    <div
                      key={stage.title}
                      className={`stage-card ${
                        stage.status === "locked" ? "locked" : ""
                      }`}
                    >
                      <img
                        src={`/assets/budayana/islands/tahap ${index + 1}.png`}
                        className='stage-bg'
                      />

                      <div className='stage-content'>
                        <p className='stage-title'>{stage.title}</p>
                      </div>

                      {stage.status === "locked" && (
                        <div className='stage-lock-overlay'>
                          <img
                            src='/assets/budayana/islands/padlock.png'
                            className='stage-lock-icon'
                            alt='locked'
                          />
                        </div>
                      )}
                    </div>
                  ))}
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
