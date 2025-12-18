import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

const PreTest = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);

    // ⭐ NEW: Warning popup state
    const [showWarning, setShowWarning] = useState(false);

    const questions = [
        { id: 1, question: "Siapakah tokoh yang ditakuti oleh anak-anak dalam cerita ini?", options: ["A. Nenek Pakande", "B. Nenek Rara", "C. Putri Kemuning", "D. Mak Lampir"], correctAnswer: 0 },
        { id: 2, question: "Di mana anak-anak biasanya bermain sebelum diculik?", options: ["A. Di hutan", "B. Di lapangan", "C. Di sungai", "D. Di kebun"], correctAnswer: 1 },
        { id: 3, question: "Mengapa anak-anak dilarang bermain terlalu jauh dari rumah?", options: ["A. Karena hari sangat panas", "B. Karena takut bertemu Nenek Pakande", "C. Karena mereka harus membantu memasak", "D. Karena banyak hewan liar"], correctAnswer: 1 },
        { id: 4, question: "Bagaimana ciri khas Nenek Pakande dalam cerita?", options: ["A. Berpakaian rapi dan wangi", "B. Baik hati kepada anak-anak", "C. Berpenampilan seram dan membawa keranjang", "D. Suka memberi hadiah"], correctAnswer: 2 },
        { id: 5, question: "Mengapa anak-anak mudah ditipu oleh Nenek Pakande?", options: ["A. Karena mereka lapar", "B. Karena mereka tidak mengenalnya", "C. Karena mereka mudah percaya pada orang asing", "D. Karena mereka ingin bermain lebih lama"], correctAnswer: 2 },
        { id: 6, question: "Apa yang terjadi pada anak-anak yang terlalu jauh bermain dari desa?", options: ["A. Mereka disuruh pulang oleh orang tua", "B. Mereka diajak piknik", "C. Mereka ditemukan pedagang", "D. Mereka berisiko dibawa oleh Nenek Pakande"], correctAnswer: 3 },
        { id: 7, question: "Bagaimana reaksi warga saat mengetahui anak-anak hilang?", options: ["A. Biasa saja", "B. Mereka marah dan hanya menunggu", "C. Mereka panik dan langsung mencari", "D. Mereka menyuruh anak-anak lain mencari"], correctAnswer: 2 },
        { id: 8, question: "Apa yang mungkin dirasakan anak-anak ketika bertemu Nenek Pakande?", options: ["A. Senang", "B. Takut", "C. Bangga", "D. Penasaran"], correctAnswer: 1 },
        { id: 9, question: "Mengapa cerita ini sering diceritakan orang tua?", options: ["A. Untuk menakut-nakuti agar tidak bermain jauh", "B. Untuk hiburan", "C. Untuk belajar budaya makan", "D. Untuk belajar menghitung"], correctAnswer: 0 },
        {
            id: 10,
            question: "Apa tema utama dari cerita Nenek Pakande?",
            options: [
                "A. Petualangan dan keberanian",
                "B. Persahabatan dan kerja sama",
                "C. Kedisiplinan dan kepatuhan kepada orang tua",
                "D. Cara mengalahkan raksasa",
            ],
            correctAnswer: 2,
        },
    ];

    // Timer
    useEffect(() => {
        if (showResults) return;
        const timer = setInterval(() => setTimeElapsed((prev) => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [showResults]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")} : ${String(secs).padStart(2, "0")}`;
    };

    const handleAnswerSelect = (index) => setAnswers({ ...answers, [currentQuestion]: index });

    const handleNext = () =>
        setCurrentQuestion((prev) => Math.min(prev + 1, questions.length - 1));

    // Header Arrow -> Show Warning (Exit)
    const handleExit = () => {
        setShowWarning(true);
    };

    // Footer 'Sebelumnya' -> Go back 1 question
    const handlePrevQuestion = () => {
        setCurrentQuestion((prev) => Math.max(0, prev - 1));
    };

    const handleFinish = () => {
        let correct = 0;
        questions.forEach((q, i) => answers[i] === q.correctAnswer && correct++);
        setCorrectCount(correct);
        setScore((correct / questions.length) * 100);
        setShowResults(true);
    };

    // RESULTS SCREEN
    if (showResults) {
        return (
            <div className="min-h-screen bg-[#fdf4d7] flex items-center justify-center px-4 py-10">
                <div className="w-full max-w-4xl mx-auto px-2">
                    <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-10 border-[3px] border-[#2c2c2c] text-center min-h-[500px] flex flex-col items-center justify-center relative bg-[#fdf8e4]">

                        {/* Header Badge */}
                        <div className="bg-[#E4AE28] text-white font-extrabold text-3xl md:text-4xl px-12 py-3 rounded-full shadow-lg mb-8 border-[3px] border-[#fff4d6] ring-4 ring-[#E4AE28]/30">
                            Berhasil!
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-2xl mb-8 md:mb-10">
                            {/* Waktu Card - Pink */}
                            <div className="bg-[#FF9ECF] rounded-3xl p-6 border-[3px] border-[#2c2c2c] shadow-lg flex flex-col items-center justify-center gap-2 transform hover:scale-105 transition duration-300">
                                <span className="text-[#2c2c2c] font-extrabold text-xl md:text-2xl">Waktu</span>
                                <div className="text-[#2c2c2c] font-black text-xl md:text-3xl flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 leading-tight">
                                    <span>{Math.floor(timeElapsed / 60)} Menit</span>
                                    <span>{timeElapsed % 60} Detik</span>
                                </div>
                            </div>

                            {/* Nilai Card - Green */}
                            <div className="bg-[#5ADCB6] rounded-3xl p-6 border-[3px] border-[#2c2c2c] shadow-lg flex flex-col items-center justify-center gap-2 transform hover:scale-105 transition duration-300">
                                <span className="text-[#2c2c2c] font-extrabold text-xl md:text-2xl">Nilai</span>
                                <span className="text-[#2c2c2c] font-black text-3xl md:text-4xl">{Math.round(score)}/100</span>
                            </div>
                        </div>

                        {/* Continue Button */}
                        <button
                            onClick={() => {
                                if (window.confirm("Lanjut ke Materi?")) {
                                    window.location.href = "/sulawesi-game";
                                }
                            }}
                            className="bg-[#F7885E] hover:bg-[#e4764c] text-white font-extrabold text-xl md:text-2xl px-12 py-3 md:py-4 rounded-full shadow-lg border-b-4 border-[#c9623d] active:border-b-0 active:translate-y-1 transition-all"
                        >
                            Lanjutkan
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const q = questions[currentQuestion];
    const isLastQuestion = currentQuestion === questions.length - 1;

    return (
        <div className="min-h-screen bg-[#fdf4d7] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-6xl">

                {/* HEADER */}
                <div className="relative flex items-center justify-between mb-6">

                    <button
                        onClick={handleExit}
                        className="w-12 h-12 rounded-full border-2 bg-white/85 border-[#1f1f1f] flex items-center justify-center transition hover:bg-black/5"
                    >
                        <ArrowLeft size={22} />
                    </button>

                    <div className="absolute left-1/2 -translate-x-1/2 text-4xl font-semibold text-[#2f2f2f]">
                        Pre-Test Sulawesi
                    </div>

                    <div className="flex items-center gap-2 bg-white/70 px-4 py-2 rounded-full shadow-sm border-2 border-[#2c2c2c]">
                        <Clock size={20} className="text-[#2c2c2c]" />
                        <span className="text-[#2c2c2c] font-semibold tracking-[0.12em]">{formatTime(timeElapsed)}</span>
                    </div>
                </div>

                {/* QUESTION CARD */}
                <div className="bg-[#c6d7d0] rounded-[28px] border border-[#b1c8c0] shadow-[0_18px_40px_rgba(0,0,0,0.12)] p-6">
                    <div className="flex justify-center mb-6">
                        <div className="bg-white px-12 py-3 rounded-[16px] shadow-md text-lg font-bold text-[#202020]">
                            Nenek Pakande
                        </div>
                    </div>

                    <div className="bg-white rounded-[26px] border-[3px] border-[#0e7794] px-8 py-8 shadow-[0_12px_26px_rgba(0,0,0,0.08)]">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-11 h-11 rounded-full bg-[#0e7794] text-white font-bold flex items-center justify-center shadow-inner">
                                {currentQuestion + 1}
                            </div>
                            <p className="text-lg font-semibold text-[#2c2c2c] leading-relaxed">{q.question}</p>
                        </div>

                        <div className="flex flex-col gap-4">
                            {q.options.map((opt, i) => {
                                const selected = answers[currentQuestion] === i;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswerSelect(i)}
                                        className={`w-full text-left font-semibold rounded-[16px] border-[2.5px] px-5 py-4 transition-transform duration-150 ${selected
                                            ? "bg-[#0e7794] text-white border-[#0e7794] shadow-[0_10px_20px_rgba(14,119,148,0.25)]"
                                            : "bg-[#f2f7ff] text-[#1f1f1f] border-[#0e7794] hover:-translate-y-0.5"
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* FOOTER NAVIGATION */}
                    <div className="mt-6 flex items-center justify-between">

                        <button
                            onClick={handlePrevQuestion}
                            disabled={currentQuestion === 0}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold shadow-md transition ${currentQuestion === 0
                                ? "bg-[#f2c3c3] cursor-not-allowed"
                                : "bg-[#e76964] hover:bg-[#d95e59]"
                                }`}
                        >
                            <ArrowLeft size={20} />
                            Sebelumnya
                        </button>

                        <div className="text-sm font-semibold text-[#5a5a5a]">
                            Halaman {currentQuestion + 1} dari {questions.length}
                        </div>

                        {/* Next Button */}
                        {isLastQuestion ? (
                            <button
                                onClick={handleFinish}
                                disabled={answers[currentQuestion] === undefined}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold shadow-md transition ${answers[currentQuestion] === undefined
                                    ? "bg-gray-300 cursor-not-allowed opacity-50"
                                    : "bg-[#19758E] hover:bg-[#17748D]"
                                    }`}
                            >
                                Selesai
                                <ArrowRight size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                disabled={answers[currentQuestion] === undefined}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold shadow-md transition ${answers[currentQuestion] === undefined
                                    ? "bg-gray-300 cursor-not-allowed opacity-50"
                                    : "bg-[#19758E] hover:bg-[#17748D]"
                                    }`}
                            >
                                Berikutnya
                                <ArrowRight size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ⭐ WARNING POPUP ⭐ */}
            {showWarning && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#fff4d6] w-[90%] max-w-md rounded-3xl border-[3px] border-[#e9c499] shadow-2xl p-8 text-center">

                        <img
                            src="/assets/budayana/islands/image 90.png"
                            alt="warning"
                            className="w-32 mx-auto mb-3"
                        />

                        <p className="text-lg font-semibold text-[#2f2f2f] leading-relaxed mb-6">
                            Jangan pergi dulu! Progresmu di tahap ini akan hilang kalau kamu berhenti sekarang.
                        </p>

                        <button
                            onClick={() => setShowWarning(false)}
                            className="w-full bg-[#f88c63] text-white font-bold py-3 rounded-full shadow-md hover:bg-[#e27852] transition mb-2"
                        >
                            Lanjutkan Belajar
                        </button>

                        <button
                            onClick={() => {
                                setShowWarning(false);
                                setCurrentQuestion((prev) => prev - 1);
                                window.location.href = "/homepage";
                            }}
                            className="text-[#e64c45] font-bold"
                        >
                            Akhiri Sesi
                        </button>

                    </div>
                </div>
            )}

        </div>
    );
};

export default PreTest;
