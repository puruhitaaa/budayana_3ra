/**
 * Consolidated game data for all islands
 * Each game has story images, question images, and questions (MC, TF, drag-drop)
 */
export const games = {
  sulawesi: {
    title: "Nenek Pakande",
    totalXp: 100,
    xpPerQuestion: 20,
    storyImageMap: {
      1: "/assets/budayana/islands/cerita sulawesi 1.png",
      3: "/assets/budayana/islands/cerita sulawesi 22.png",
      5: "/assets/budayana/islands/cerita sulawesi 3.png",
      7: "/assets/budayana/islands/cerita sulawesi 4 (1).png",
      9: "/assets/budayana/islands/cerita sulawesi 5.png",
    },
    questionImageMap: {
      2: "/assets/budayana/islands/pertanyaan 2 sulawesi.png",
      4: "/assets/budayana/islands/pertanyaan 4 sulawesi.png",
      6: "/assets/budayana/islands/pertanyaan 6 sulawesi.png",
      8: "/assets/budayana/islands/question 8 sulawesi.png",
      10: "/assets/budayana/islands/pertanyaan 10 sulawesi.png",
      bonus: "/assets/budayana/islands/pertanyaan bonus sulawesi.png",
    },
    questions: [
      {
        id: "q2",
        page: 2,
        type: "mc",
        options: [
          "Berlari-larian",
          "Main layangan",
          "Main kelereng",
          "Memancing",
        ],
        correct: 0,
        incorrectMessage: "Uh oh... jawabannya kurang tepat, ayo coba lagi!",
      },
      {
        id: "q4",
        page: 4,
        type: "tf",
        correct: false,
      },
      {
        id: "q6",
        page: 6,
        type: "mc",
        options: ["Panci", "Jaring", "Karung", "Perangkap"],
        correct: 2,
      },
      {
        id: "q8",
        page: 8,
        type: "mc",
        options: ["Kota", "Hutan", "Gunung", "Sawah"],
        correct: 1,
      },
      {
        id: "q10",
        page: 10,
        type: "drag",
        items: [
          { id: "search", label: "Anak-anak ketakutan" },
          { id: "play", label: "Anak-anak bermain di ladang" },
          { id: "home", label: "Warga mencari anak-anak" },
          { id: "appear", label: "Nenek Pakande muncul" },
          { id: "sunset", label: "Sore hari mulai datang" },
        ],
        correctOrder: ["play", "sunset", "appear", "search", "home"],
      },
    ],
  },

  sumatra: {
    title: "Malin Kundang",
    totalXp: 100,
    xpPerQuestion: 20,
    storyImageMap: {
      1: "/assets/budayana/islands/cerita 1 malin (1).png",
      3: "/assets/budayana/islands/cerita 2 malin (2).png",
      5: "/assets/budayana/islands/cerita 3 malin (1).png",
      7: "/assets/budayana/islands/cerita 5 malin (2).png",
      9: "/assets/budayana/islands/cerita 6 malin (3).png",
    },
    questionImageMap: {
      2: "/assets/budayana/islands/pertanyaan 1 malin.png",
      4: "/assets/budayana/islands/pertanyaan 3 malin.png",
      6: "/assets/budayana/islands/pertanyaan 4 malin.png",
      8: "/assets/budayana/islands/pertanyaan 6 malin.png",
      10: "/assets/budayana/islands/pertanyaan 7 malin.png",
      bonus: "/assets/budayana/islands/pertanyaan bonus malin.png",
    },
    questions: [
      {
        id: "q2",
        page: 2,
        type: "mc",
        options: ["Membantu Ibunya", "Menjemur Baju", "Memancing", "Tiduran"],
        correct: 0,
        incorrectMessage: "Uh oh... jawabannya kurang tepat, ayo coba lagi!",
      },
      {
        id: "q4",
        page: 4,
        type: "tf",
        correct: false,
      },
      {
        id: "q6",
        page: 6,
        type: "mc",
        options: ["Bapaknya", "Temannya", "Ibunya", "Tetangganya"],
        correct: 2,
      },
      {
        id: "q8",
        page: 8,
        type: "mc",
        options: [
          "Kaki sang ibu terinjak",
          "Malin tidak menganggap ibu",
          "Malin memeluk sang ibu",
          "Ibu tersandung ikan di pasar",
        ],
        correct: 1,
      },
      {
        id: "q10",
        page: 10,
        type: "drag",
        items: [
          { id: "stone", label: "Malin dikutuk menjadi batu" },
          { id: "leave", label: "Malin tinggal bersama ibunya" },
          { id: "ship", label: "Malin menjadi saudagar kaya" },
          { id: "miss", label: "Malin pergi merantau" },
          { id: "deny", label: "Malin mengingkari ibunya" },
        ],
        correctOrder: ["leave", "miss", "ship", "deny", "stone"],
      },
    ],
  },
}

/**
 * Get game data by island slug
 * @param {string} islandSlug
 * @returns {object|undefined}
 */
export const getGameByIsland = (islandSlug) => {
  return games[islandSlug]
}

/**
 * Build pages array from game data
 * @param {object} game
 * @returns {array}
 */
export const buildGamePages = (game) => {
  const pages = []
  for (let i = 1; i <= 10; i++) {
    if (i % 2 === 1) {
      pages.push({ type: "story", pageNumber: i })
    } else {
      const question = game.questions.find((q) => q.page === i)
      pages.push({ type: "question", pageNumber: i, question })
    }
  }
  return pages
}
