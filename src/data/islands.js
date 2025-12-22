/**
 * Static island configuration
 * Each island has a unique slug used in routing
 */
export const islands = [
  {
    id: "sulawesi",
    slug: "sulawesi",
    name: "Sulawesi",
    storyTitle: "Nenek Pakande",
    unlockOrder: 1,
    isLockedDefault: false,
    stages: ["pre-test", "story", "game", "post-test"],
    // Theme colors for pre-test (blue) and post-test (orange)
    theme: {
      preTest: {
        cardBg: "#c6d7d0",
        cardBorder: "#b1c8c0",
        accent: "#0e7794",
        contentBg: "#f2f7ff",
      },
      postTest: {
        cardBg: "#f6c7a6",
        cardBorder: "#f0b184",
        accent: "#f19367",
        contentBg: "#fff9f0",
      },
    },
  },
  {
    id: "sumatra",
    slug: "sumatra",
    name: "Sumatra",
    storyTitle: "Malin Kundang",
    unlockOrder: 2,
    isLockedDefault: true,
    stages: ["pre-test", "story", "game", "post-test"],
    theme: {
      preTest: {
        cardBg: "#c6d7d0",
        cardBorder: "#b1c8c0",
        accent: "#0e7794",
        contentBg: "#f2f7ff",
      },
      postTest: {
        cardBg: "#f6c7a6",
        cardBorder: "#f0b184",
        accent: "#f19367",
        contentBg: "#fff9f0",
      },
    },
  },
  {
    id: "jawa",
    slug: "jawa",
    name: "Jawa",
    storyTitle: "Roro Jonggrang",
    unlockOrder: 3,
    isLockedDefault: true,
    stages: ["pre-test", "story", "game", "post-test"],
    theme: {
      preTest: {
        cardBg: "#c6d7d0",
        cardBorder: "#b1c8c0",
        accent: "#0e7794",
        contentBg: "#f2f7ff",
      },
      postTest: {
        cardBg: "#f6c7a6",
        cardBorder: "#f0b184",
        accent: "#d87c4a",
        contentBg: "#fff7f2",
      },
    },
  },
  {
    id: "papua",
    slug: "papua",
    name: "Papua",
    storyTitle: "Biwar Penakluk Naga",
    unlockOrder: 4,
    isLockedDefault: true,
    stages: ["pre-test", "story", "game", "post-test"],
    theme: {
      preTest: {
        cardBg: "#c6d7d0",
        cardBorder: "#b1c8c0",
        accent: "#0e7794",
        contentBg: "#f2f7ff",
      },
      postTest: {
        cardBg: "#f6c7a6",
        cardBorder: "#f0b184",
        accent: "#d87c4a",
        contentBg: "#fff7f2",
      },
    },
  },
]

/**
 * Get island by slug
 * @param {string} slug
 * @returns {object|undefined}
 */
export const getIslandBySlug = (slug) => {
  return islands.find((island) => island.slug === slug)
}

/**
 * Get next stage after current one
 * @param {string} currentStage
 * @returns {string|null}
 */
export const getNextStage = (currentStage) => {
  const stageOrder = ["pre-test", "story", "game", "post-test"]
  const currentIndex = stageOrder.indexOf(currentStage)
  if (currentIndex < stageOrder.length - 1) {
    return stageOrder[currentIndex + 1]
  }
  return null
}
