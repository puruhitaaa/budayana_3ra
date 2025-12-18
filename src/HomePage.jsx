import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";


const islandData = [
  { id: "sumatra", name: "Sumatra", top: "46%", left: "14%", img: "/assets/budayana/islands/Sumatra.png", unlocked: true, completed: true },
  { id: "kalimantan", name: "Kalimantan", top: "40%", left: "42%", img: "/assets/budayana/islands/Kalimantan.png", unlocked: true, completed: false },
  { id: "sulawesi", name: "Sulawesi", top: "47%", left: "60%", img: "/assets/budayana/islands/Sulawesi.png", unlocked: true, completed: false },
  { id: "maluku", name: "Maluku", top: "55%", left: "68%", img: "/assets/budayana/islands/Maluku.png", unlocked: false, completed: false, scale: 0.82 },
  { id: "papua", name: "Papua", top: "52%", left: "78%", img: "/assets/budayana/islands/Papua.png", unlocked: true, completed: false },
  { id: "bali", name: "Bali", top: "62%", left: "51%", img: "/assets/budayana/islands/Bali.png", unlocked: false, completed: false, scale: 0.78 },
  { id: "jawa", name: "Jawa", top: "60%", left: "32%", img: "/assets/budayana/islands/Jawa.png", unlocked: true, completed: false, scale: 1.15 },
  { id: "nusa", name: "Nusa Tenggara", top: "66%", left: "57%", img: "/assets/budayana/islands/Nusa Tenggara.png", unlocked: false, completed: false },
];

const stagePalette = {
  pretest: "#E393B3",
  story: "#4FBA95",
  posttest: "#D4734F",
};

const defaultStages = {
  pretest: { label: "Pre-Test", stage: 1, key: "pretest", color: stagePalette.pretest },
  story: { label: "Cerita Rakyat Interaktif", stage: 2, key: "story", color: stagePalette.story },
  posttest: { label: "Post-Test", stage: 3, key: "posttest", color: stagePalette.posttest },
};

const StageCard = ({ stage, onClick, img }) => {
  const locked = !stage.unlocked;
  const opacity = locked ? "opacity-40" : "";

  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`relative w-[236.88px] h-[479px] rounded-[26px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition hover:-translate-y-1 ${opacity} cursor-pointer`}
    >
      <img 
        src={img} 
        alt={stage.label} 
        className="w-full h-full object-cover"
      />
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-black/70 rounded-full p-3">
            <img src="/assets/budayana/islands/lock.png" alt="locked" className="w-8 h-8 object-contain" />
          </div>
        </div>
      )}
    </button>
  );
};

const IslandMarker = ({ island, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(island)}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
      style={{
        top: island.top,
        left: island.left,
        transform: `translate(-50%, -50%) scale(${island.scale || 1})`,
        transformOrigin: "center center",
      }}
    >
      <img src={island.img} alt={island.name} className="w-36 md:w-40 lg:w-44 drop-shadow-[0_6px_12px_rgba(0,0,0,0.18)]" />
      {!island.unlocked && (
        <img
          src="/assets/budayana/locks/locked.png"
          alt="locked"
          className="w-10 h-10 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg"
        />
      )}
    </button>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [selectedIsland, setSelectedIsland] = useState(null);
  // Track per-island stage progress (1=pretest unlocked, 2=story unlocked, 3=posttest unlocked)
  const [progressByIsland, setProgressByIsland] = useState(() =>
    islandData.reduce((acc, isl) => ({ ...acc, [isl.id]: 1 }), {})
  );

  const summary = useMemo(() => {
    const unlocked = islandData.filter((i) => i.unlocked);
    const completed = unlocked.filter((i) => i.completed);
    return { completed: completed.length, total: unlocked.length };
  }, []);

  const handleStageClick = (key) => {
    if (!selectedIsland) return;
    if (key === "story" && !["jawa", "papua"].includes(selectedIsland.id)) {
      alert("Cerita rakyat statis saat ini hanya tersedia untuk Pulau Jawa dan Papua.");
      return;
    }

    if (key === "pretest") {
      navigate(`/pre-test?island=${selectedIsland.id}`);
    } else if (key === "story") {
      if (selectedIsland.id === "sulawesi") {
        navigate(`/sulawesi-game`);
      } else {
        navigate(`/cerita-rakyat?island=${selectedIsland.id}`);
      }
    } else if (key === "posttest") {
      navigate(`/post-test?island=${selectedIsland.id}`);
    }

    // Simulate completion: when a stage is clicked, unlock the next stage.
    setProgressByIsland((prev) => {
      const current = prev[selectedIsland.id] || 1;
      const next = Math.min(3, current + 1);
      return { ...prev, [selectedIsland.id]: next };
    });
  };

  const stages = useMemo(() => {
    const stageNumber = selectedIsland ? progressByIsland[selectedIsland.id] || 1 : 1;
    const preUnlocked = stageNumber >= 1;
    const storyUnlocked = stageNumber >= 2;
    const postUnlocked = stageNumber >= 3;

    return {
      pretest: { ...defaultStages.pretest, unlocked: preUnlocked },
      story: { ...defaultStages.story, unlocked: storyUnlocked },
      posttest: { ...defaultStages.posttest, unlocked: postUnlocked },
    };
  }, [selectedIsland, progressByIsland]);

  const stageDots = useMemo(() => {
    // All green, but still indicate how many stages are unlocked
    const active = selectedIsland ? progressByIsland[selectedIsland.id] || 1 : 1;
    return [1, 2, 3].map((idx) => ({
      id: idx,
      active: idx <= active,
      color: "#6ab04c",
    }));
  }, [selectedIsland, progressByIsland]);

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: "#99DBF0" }}
    >
      {/* Background water texture could go here */}

      {/* Top HUD */}
      <div className="absolute top-6 left-6">
        <div
          className="text-[#a2541f] font-extrabold text-2xl drop-shadow-sm"
          style={{ textShadow: "0 0 2px #fff, 0 0 4px #fff" }}
        >
          Cerita Selesai :
        </div>
        <div
          className="text-[#a2541f] font-extrabold text-3xl drop-shadow-sm text-center"
          style={{ textShadow: "0 0 2px #fff, 0 0 4px #fff" }}
        >
          {summary.completed}/{summary.total}
        </div>
      </div>

      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <img src="/assets/budayana/islands/budayana.png" alt="Budayana" className="w-64 md:w-72 lg:w-80" />
      </div>

      <button className="absolute top-6 right-6 rounded-full border-2 border-[#c3874b] bg-[#fdf0dd] shadow px-2 py-2">
        <img src="/assets/budayana/islands/Profile.png" alt="Profile" className="w-12 h-12 rounded-full object-cover" />
      </button>

      {/* Mascot */}
      <img
        src="/assets/budayana/islands/Bocah1 1.png"
        alt="Mascot"
        className="absolute bottom-6 left-4 w-44 md:w-52 drop-shadow-[0_8px_16px_rgba(0,0,0,0.2)]"
      />

      {/* Map Container */}
      <div className="relative mx-auto mt-24 mb-10 w-[95%] max-w-6xl aspect-[16/10] bg-transparent z-0">
        <img
          src="/assets/budayana/islands/Homepage (3).png"
          alt="Map Background"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"
        />

        {islandData.map((island) => (
          <IslandMarker key={island.id} island={island} onSelect={setSelectedIsland} />
        ))}
      </div>

      {/* Modal for stages */}
      {selectedIsland && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-4xl bg-[#f7eeda] rounded-[24px] shadow-2xl border border-[#d9c8a6] relative">
            <button
              className="absolute right-4 top-4 text-[#2f2f2f] text-2xl font-bold"
              onClick={() => setSelectedIsland(null)}
            >
              ×
            </button>

            <div className="text-center text-3xl md:text-4xl font-extrabold text-[#2a2a2a] mt-8">
              {selectedIsland.name}
            </div>

            <div className="flex items-center justify-center gap-3 mt-3 mb-8">
              {stageDots.map((dot) => (
                <span
                  key={dot.id}
                  className={`w-3.5 h-3.5 rounded-full border border-white/70 shadow ${dot.active ? "" : "opacity-40"}`}
                  style={{ backgroundColor: dot.color }}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 pb-10 place-items-center">
              {Object.entries(stages).map(([key, stage]) => (
                <StageCard
                  key={key}
                  stage={stage}
                  onClick={() => handleStageClick(key)}
                  img={
                    key === "pretest"
                      ? "/assets/budayana/islands/pretest monkey (1).png"
                      : key === "story"
                      ? "/assets/budayana/islands/story stage 2 (1).png"
                      : "/assets/budayana/islands/posttest hippo (1).png"
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;