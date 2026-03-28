import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HslColorPicker } from "react-colorful";
import { COLORS } from "./colors";

const API_URL = import.meta.env.VITE_API_URL;

const TOTAL_ROUNDS = 5;

const STARTER_COLORS = [
  { h: 210, s: 18, l: 55 },
  { h: 25, s: 40, l: 58 },
  { h: 140, s: 28, l: 52 },
  { h: 300, s: 22, l: 60 },
  { h: 50, s: 38, l: 62 },
];

export default function App() {
  const [screen, setScreen] = useState("home");
  const [color, setColor] = useState({ h: 180, s: 50, l: 50 });
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [usedColors, setUsedColors] = useState([]);
  const [targetColor, setTargetColor] = useState(COLORS[0]);
  const [username, setUsername] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [scoreSaved, setScoreSaved] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const currentColor = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
  const actualColor = `hsl(${targetColor.h}, ${targetColor.s}%, ${targetColor.l}%)`;

  const getNextColor = (usedNames) => {
    const remaining = COLORS.filter((item) => !usedNames.includes(item.name));
    if (remaining.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * remaining.length);
    return remaining[randomIndex];
  };

  const getStarterColor = (roundNumber) => {
    return STARTER_COLORS[(roundNumber - 1) % STARTER_COLORS.length];
  };

  const getFinalRank = (score) => {
    if (score >= 450) return "Master";
    if (score >= 380) return "Expert";
    if (score >= 280) return "Shade Explorer";
    return "Beginner";
  };

  const handleStartGame = () => {
    const firstColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    setUsedColors([firstColor.name]);
    setTargetColor(firstColor);
    setRound(1);
    setScore(0);
    setResult(null);
    setShowResult(false);
    setColor(getStarterColor(1));
    setScreen("game");
    setUsername("");
    setSaveMessage("");
    setScoreSaved(false);
  };

  const handleSubmit = () => {
    const rawHueDiff = Math.abs(color.h - targetColor.h);
    const hueDiff = Math.min(rawHueDiff, 360 - rawHueDiff);
    const saturationDiff = Math.abs(color.s - targetColor.s);
    const lightnessDiff = Math.abs(color.l - targetColor.l);

    const normalizedHue = (hueDiff / 180) * 100;

    const penalty =
      normalizedHue * 0.5 +
      saturationDiff * 0.2 +
      lightnessDiff * 0.6;

    const roundScore = Math.max(0, Math.round(100 - penalty));

    let rating = "";

    if (roundScore >= 95) {
      rating = "Perfect Match!";
    } else if (roundScore >= 80) {
      rating = "Excellent";
    } else if (roundScore >= 60) {
      rating = "Close";
    } else if (roundScore >= 40) {
      rating = "Moderate";
    } else if (roundScore >= 20) {
      rating = "Far Off";
    } else {
      rating = "Way Off";
    }

    setResult({
      roundScore,
      rating,
      hueDiff: Math.round(hueDiff),
      saturationDiff: Math.round(saturationDiff),
      lightnessDiff: Math.round(lightnessDiff),
    });

    setScore((prev) => prev + roundScore);
    setShowResult(true);
  };

  const handleNextRound = () => {
    if (round >= TOTAL_ROUNDS) {
      setScreen("end");
      return;
    }

    const next = getNextColor(usedColors);

    setUsedColors((prev) => [...prev, next.name]);
    setTargetColor(next);
    setResult(null);
    setShowResult(false);
    setRound((prev) => prev + 1);
    setColor(getStarterColor(round + 1));
  };

  const homePreviewColor = {
    name: "Payne’s Gray",
    guess: "hsl(183, 45%, 52%)",
  };

  const homePreviewValues = {
    h: 210,
    s: 18,
    l: 32,
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/scores`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.log("Failed to fetch leaderboard");
    }
  };

  const handleOpenLeaderboard = async () => {
    await fetchLeaderboard();
    setShowLeaderboard(true);
  };

  const handleSaveScore = async () => {
    if (!username.trim()) {
      setSaveMessage("Please enter a nickname.");
      return;
    }

    if (scoreSaved) return;

    try {
      setIsSaving(true);
      setSaveMessage("");

      const response = await fetch(`${API_URL}/api/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          totalScore: score,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save score");
      }

      setSaveMessage("Score saved successfully!");
      setScoreSaved(true);
      await fetchLeaderboard();
    } catch (error) {
      setSaveMessage("Failed to save score.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (screen === "end") {
      fetchLeaderboard();
    }
  }, [screen]);

  const getMedal = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  return (
    <>
      {screen === "home" && (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617_62%)] text-white px-4 md:px-6 py-6 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-5xl"
          >
            <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl px-8 py-12 md:px-14 md:py-16 text-center">
              <div className="absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />
              <div className="absolute right-0 top-1/3 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />

              <div className="relative z-10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-10">
                  <button
                    onClick={() => setShowHowItWorks(true)}
                    className="w-full sm:w-auto min-w-0 sm:min-w-[150px] rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 font-semibold hover:bg-white/10 transition duration-300"
                  >
                    How It Works
                  </button>

                  <p className="text-xs sm:text-sm uppercase tracking-[0.35em] sm:tracking-[0.4em] text-cyan-300 text-center">
                    Shade Guess
                  </p>

                  <button
                    onClick={handleOpenLeaderboard}
                    className="w-full sm:w-auto min-w-0 sm:min-w-[150px] rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 font-semibold hover:bg-white/10 transition duration-300"
                  >
                    Leaderboard
                  </button>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-[1.15] mb-6 max-w-3xl mx-auto">
                  Can you guess a color from
                  <span className="block bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                    its name alone?
                  </span>
                </h1>

                <p className="text-slate-300 text-base sm:text-lg md:text-xl leading-7 sm:leading-8 max-w-2xl mx-auto mb-10">
                  You get a color name and try to match it as closely as possible.
                  <br />
                  <span className="block mt-1">
                    Adjust the color, compare it with the real one, and check your accuracy.
                  </span>
                </p>


                <button
                  onClick={handleStartGame}
                  className="relative rounded-2xl bg-white text-slate-900 px-10 py-4 text-lg font-semibold transition duration-300 hover:scale-105 active:scale-95 shadow-lg overflow-hidden"
                >
                  <span className="relative z-10">Start Game</span>

                  <span className="absolute inset-0 opacity-0 hover:opacity-100 transition duration-300 bg-gradient-to-r from-fuchsia-400/20 via-cyan-300/20 to-emerald-300/20" />
                </button>

              </div>
            </div>
          </motion.div>
        </div>
      )}

      {screen === "game" && (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b,_#0f172a_55%)] text-white px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl rounded-[32px] border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-5 md:p-6"
          >
            <div className="hidden md:grid lg:grid-cols-[380px_1fr] gap-5 items-start">
              <div className="self-start rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.75),rgba(2,6,23,0.92))] p-4 md:p-5 flex flex-col shadow-inner">
                <div>
                  <div className="mb-4">
                    <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-emerald-400 mb-4" />

                    <p className="text-sm uppercase tracking-[0.3em] text-cyan-300 mb-2">
                      Color Picker
                    </p>

                    <p className="text-sm text-slate-400 leading-relaxed">
                      Recreate the target shade as closely as possible.
                    </p>
                  </div>

                  <div className="flex justify-center mt-6">
                    <div
                      className={`scale-95 origin-center transition ${showResult ? "opacity-60 pointer-events-none" : "opacity-100"
                        }`}
                    >
                      <HslColorPicker
                        color={color}
                        onChange={(newColor) => {
                          if (showResult) return;
                          setColor(newColor);
                          setShowResult(false);
                          setResult(null);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 mb-3">
                    Current Values
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-slate-950/40 border border-white/10 p-3">
                      <p className="min-h-[32px] flex items-center justify-center text-[11px] uppercase tracking-[0.14em] text-slate-400 leading-tight mb-1">
                        Hue
                      </p>
                      <p className="text-white font-semibold">{Math.round(color.h)}°</p>
                    </div>

                    <div className="rounded-xl bg-slate-950/40 border border-white/10 p-3">
                      <p className="min-h-[32px] flex items-center justify-center text-[11px] uppercase tracking-[0.14em] text-slate-400 leading-tight mb-1">
                        Saturation
                      </p>
                      <p className="text-white font-semibold">{Math.round(color.s)}%</p>
                    </div>

                    <div className="rounded-xl bg-slate-950/40 border border-white/10 p-3">
                      <p className="min-h-[32px] flex items-center justify-center text-[11px] uppercase tracking-[0.14em] text-slate-400 leading-tight mb-1">
                        Lightness
                      </p>
                      <p className="text-white font-semibold">{Math.round(color.l)}%</p>
                    </div>
                  </div>
                </div>

                {showResult && (
                  <button
                    onClick={handleNextRound}
                    className="w-full mt-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-emerald-400 py-3.5 font-semibold text-slate-950 hover:scale-[1.02] transition duration-300 shadow-lg"
                  >
                    {round === TOTAL_ROUNDS ? "See Final Score" : "Next Round"}
                  </button>
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-cyan-300 mb-2">
                      Round {round} / {TOTAL_ROUNDS}
                    </p>
                    <h1 className="text-3xl md:text-4xl font-bold">
                      {targetColor.name}
                    </h1>
                    <p className="text-slate-300 mt-1">Score: {score}</p>
                  </div>

                  <button
                    onClick={() => setScreen("home")}
                    className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 font-semibold hover:bg-white/10 transition shrink-0"
                  >
                    Back
                  </button>
                </div>

                <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-emerald-400"
                    style={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="rounded-[22px] bg-white/5 border border-white/10 p-4">
                    <p className="text-slate-400 text-sm mb-2">Your Guess</p>
                    <div
                      className="h-22 md:h-24 rounded-2xl border border-white/10 transition-all duration-300"
                      style={{
                        backgroundColor: currentColor,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                      }}
                    />
                  </div>

                  <div className="rounded-[22px] bg-white/5 border border-white/10 p-4">
                    <p className="text-slate-400 text-sm mb-2">Actual Shade</p>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={showResult ? "shown" : "hidden"}
                        initial={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className={`h-22 md:h-24 rounded-2xl border border-white/10 flex items-center justify-center text-slate-400 text-lg md:text-xl transition
                          ${showResult ? "shadow-[0_0_60px_rgba(255,255,255,0.12)]" : "shadow-[0_0_25px_rgba(255,255,255,0.05)]"}
                        `}
                        style={{
                          backgroundColor: showResult ? actualColor : "#1e293b",
                          boxShadow: showResult
                            ? "0 10px 30px rgba(0,0,0,0.3)"
                            : "none",
                        }}
                      >
                        {!showResult && "Hidden"}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-auto">
                  <AnimatePresence mode="wait">
                    {!showResult ? (
                      <motion.div
                        key="submit"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <button
                          onClick={handleSubmit}
                          className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-emerald-400 py-3.5 font-semibold text-slate-950 hover:scale-[1.01] transition duration-300 shadow-lg text-base md:text-lg"
                        >
                          Submit Guess
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="text-left">
                              <p className="text-2xl md:text-3xl font-semibold text-white leading-none">
                                {result.rating}
                              </p>
                              <p className="text-slate-300 mt-2 text-sm md:text-base">
                                Round Score: {result.roundScore} / 100
                              </p>
                            </div>

                            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 min-w-[150px] text-center">
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
                                Round Score
                              </p>
                              <p className="text-3xl font-bold text-white leading-none">
                                {result.roundScore}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-center">
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">
                                Hue
                              </p>
                              <p className="text-xl font-semibold text-white leading-none">
                                {result.hueDiff}°
                              </p>
                              <p className="text-xs text-slate-400 mt-2">off</p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-center">
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">
                                Saturation
                              </p>
                              <p className="text-xl font-semibold text-white leading-none">
                                {result.saturationDiff}%
                              </p>
                              <p className="text-xs text-slate-400 mt-2">off</p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-center">
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">
                                Lightness
                              </p>
                              <p className="text-xl font-semibold text-white leading-none">
                                {result.lightnessDiff}%
                              </p>
                              <p className="text-xs text-slate-400 mt-2">off</p>
                            </div>
                          </div>

                          <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(2,6,23,0.88))] p-4 overflow-hidden relative">
                            <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-emerald-400 opacity-90" />

                            <div className="pt-2 text-left">
                              <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300 mb-3">
                                Did You Know?
                              </p>

                              <p className="text-white text-sm md:text-[15px] leading-7 font-medium">
                                {targetColor.fact}
                              </p>

                              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">
                                  Where it appears
                                </p>
                                <p className="text-sm text-slate-300 leading-6">
                                  {targetColor.usage}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="md:hidden space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                  Round {round} / {TOTAL_ROUNDS}
                </p>
                <p className="text-sm text-slate-300 font-medium">Score: {score}</p>
              </div>

              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-emerald-400"
                  style={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }}
                />
              </div>

              <div>
                <h1 className="text-4xl font-bold break-words">
                  {targetColor.name}
                </h1>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.75),rgba(2,6,23,0.92))] p-4 shadow-inner">
                <div className="mb-4">
                  <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-emerald-400 mb-4" />

                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-300 mb-2">
                    Color Picker
                  </p>

                  <p className="text-sm text-slate-400 leading-relaxed">
                    Recreate the target shade as closely as possible.
                  </p>
                </div>

                <div className="flex justify-center mt-4">
                  <div
                    className={`scale-[0.82] origin-center transition ${showResult ? "opacity-60 pointer-events-none" : "opacity-100"
                      }`}
                  >
                    <HslColorPicker
                      color={color}
                      onChange={(newColor) => {
                        if (showResult) return;
                        setColor(newColor);
                        setShowResult(false);
                        setResult(null);
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 mb-3">
                    Current Values
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-slate-950/40 border border-white/10 p-2">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 mb-1">
                        Hue
                      </p>
                      <p className="text-white text-sm font-semibold">{Math.round(color.h)}°</p>
                    </div>

                    <div className="rounded-xl bg-slate-950/40 border border-white/10 p-2">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 mb-1">
                        Saturation
                      </p>
                      <p className="text-white text-sm font-semibold">{Math.round(color.s)}%</p>
                    </div>

                    <div className="rounded-xl bg-slate-950/40 border border-white/10 p-2">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 mb-1">
                        Lightness
                      </p>
                      <p className="text-white text-sm font-semibold">{Math.round(color.l)}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[22px] bg-white/5 border border-white/10 p-3">
                  <p className="text-slate-400 text-sm mb-2">Your Guess</p>
                  <div
                    className="h-28 rounded-2xl border border-white/10 transition-all duration-300"
                    style={{
                      backgroundColor: currentColor,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                    }}
                  />
                </div>

                <div className="rounded-[22px] bg-white/5 border border-white/10 p-3">
                  <p className="text-slate-400 text-sm mb-2">Actual Shade</p>
                  <div
                    className="h-28 rounded-2xl border border-white/10 flex items-center justify-center text-slate-400 text-xl"
                    style={{
                      backgroundColor: showResult ? actualColor : "#1e293b",
                      boxShadow: showResult ? "0 10px 30px rgba(0,0,0,0.3)" : "none",
                    }}
                  >
                    {!showResult && "Hidden"}
                  </div>
                </div>
              </div>

              {!showResult ? (
                <button
                  onClick={handleSubmit}
                  className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-emerald-400 py-4 font-semibold text-slate-950 shadow-lg text-xl"
                >
                  Submit Guess
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <div className="mb-4">
                      <p className="text-2xl font-semibold text-white">
                        {result.rating}
                      </p>
                      <p className="text-slate-300 mt-2">
                        Round Score: {result.roundScore} / 100
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-2 text-center">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">
                          Hue
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {result.hueDiff}°
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">off</p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-2 text-center">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">
                          Saturation
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {result.saturationDiff}%
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">off</p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-2 text-center">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">
                          Lightness
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {result.lightnessDiff}%
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">off</p>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(2,6,23,0.88))] p-4 overflow-hidden relative">
                      <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-emerald-400 opacity-90" />

                      <div className="pt-2 text-left">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300 mb-3">
                          Did You Know?
                        </p>

                        <p className="text-white text-sm leading-7 font-medium">
                          {targetColor.fact}
                        </p>

                        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">
                            Where it appears
                          </p>
                          <p className="text-sm text-slate-300 leading-6">
                            {targetColor.usage}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleNextRound}
                    className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-emerald-400 py-4 font-semibold text-slate-950 shadow-lg"
                  >
                    {round === TOTAL_ROUNDS ? "See Final Score" : "Next Round"}
                  </button>
                </div>
              )}
            </div>

            {screen === "end" && (
              <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#1e293b,_#0f172a_60%)] text-white px-6">
                <motion.div
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-10 text-center"
                >
                  <p className="text-sm uppercase tracking-[0.35em] text-cyan-300 mb-4">
                    Game Complete
                  </p>

                  <h1 className="text-5xl font-bold mb-4">Final Score</h1>

                  <div className="text-6xl font-bold bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent mb-8">
                    {score}
                  </div>

                  <p className="text-xl text-slate-300 mt-4 font-semibold">
                    {getFinalRank(score)}
                  </p>

                  <p className="text-slate-300 mb-8">
                    You scored {score} out of {TOTAL_ROUNDS * 100}.
                  </p>

                  <div className="mb-6 space-y-4">
                    <input
                      type="text"
                      placeholder="Enter your nickname"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-400 outline-none"
                    />

                    <button
                      onClick={handleSaveScore}
                      disabled={isSaving || scoreSaved}
                      className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-emerald-400 py-3 font-semibold text-slate-950 hover:scale-[1.02] transition duration-300 disabled:opacity-50"
                    >
                      {scoreSaved ? "Score Saved" : isSaving ? "Saving..." : "Save Score"}
                    </button>

                    {saveMessage && (
                      <p className="text-sm text-slate-300">{saveMessage}</p>
                    )}
                  </div>

                  <div className="mt-8 text-left">
                    <h2 className="text-2xl font-bold mb-4 text-center">Leaderboard</h2>

                    <div className="space-y-3">
                      {leaderboard.length === 0 ? (
                        <p className="text-slate-300 text-center">No scores yet.</p>
                      ) : (
                        leaderboard.map((item, index) => (
                          <div
                            key={item._id}
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-semibold text-white">
                                {getMedal(index)} {item.username}
                              </p>
                              <p className="text-sm text-slate-400">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            <p className="text-xl font-bold text-white">{item.totalScore}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleStartGame}
                    className="mt-8 rounded-2xl bg-white text-slate-900 px-6 py-3 font-semibold hover:scale-105 transition duration-300"
                  >
                    Play Again
                  </button>
                </motion.div>
              </div>
            )}

            <AnimatePresence>
              {showHowItWorks && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center px-4"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-slate-900/95 text-white shadow-2xl p-6 md:p-8"
                  >
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300 mb-2">
                          Guide
                        </p>
                        <h2 className="text-3xl font-bold">How It Works</h2>
                      </div>

                      <button
                        onClick={() => setShowHowItWorks(false)}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 font-semibold hover:bg-white/10 transition"
                      >
                        Close
                      </button>
                    </div>

                    <div className="space-y-4 text-slate-300 leading-7">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="font-semibold text-white mb-2">1. Read the color name</p>
                        <p>
                          Each round gives you a hidden target shade by name, like
                          <span className="text-white font-medium"> Green Gold </span>
                          or another niche color.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="font-semibold text-white mb-2">2. Recreate it</p>
                        <p>
                          Use the color picker to adjust
                          <span className="text-white font-medium"> hue</span>,
                          <span className="text-white font-medium"> saturation</span>, and
                          <span className="text-white font-medium"> lightness </span>
                          until your guess feels right.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="font-semibold text-white mb-2">3. Submit your guess</p>
                        <p>
                          After you submit, the real shade is revealed and you get a round
                          score based on how close your guess was.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="font-semibold text-white mb-2">4. Finish 5 rounds</p>
                        <p>
                          Complete all rounds, check your final score, and save your result
                          to the leaderboard.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showLeaderboard && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center px-4"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-slate-900/95 text-white shadow-2xl p-6 md:p-8"
                  >
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300 mb-2">
                          Rankings
                        </p>
                        <h2 className="text-3xl font-bold">Leaderboard</h2>
                      </div>

                      <button
                        onClick={() => setShowLeaderboard(false)}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 font-semibold hover:bg-white/10 transition"
                      >
                        Close
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {leaderboard.length === 0 ? (
                        <p className="text-slate-300 text-center py-6">No scores yet.</p>
                      ) : (
                        leaderboard.map((item, index) => (
                          <div
                            key={item._id}
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-semibold text-white">
                                {getMedal(index)} {item.username}
                              </p>
                              <p className="text-sm text-slate-400">
                                {new Date(item.createdAt).toLocaleString()}
                              </p>
                            </div>

                            <p className="text-xl font-bold text-white">{item.totalScore}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
          );
}