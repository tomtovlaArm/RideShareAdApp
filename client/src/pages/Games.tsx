import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PodFrame } from "@/components/layout/PodFrame";
import { ArrowLeft, RotateCcw, Trophy, Zap, Grid3X3, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GameId = "menu" | "tictactoe" | "memory" | "reaction";

const gameList = [
  { id: "tictactoe" as GameId, title: "Tic Tac Toe", icon: Grid3X3, color: "bg-blue-500", desc: "Classic X vs O" },
  { id: "memory" as GameId, title: "Memory Match", icon: Brain, color: "bg-purple-500", desc: "Find matching pairs" },
  { id: "reaction" as GameId, title: "Reaction Time", icon: Zap, color: "bg-amber-500", desc: "Test your reflexes" },
];

type TicTacToeCell = "X" | "O" | null;

function checkWinner(board: TicTacToeCell[]): TicTacToeCell {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function getAIMove(board: TicTacToeCell[]): number {
  const empty = board.map((c, i) => (c === null ? i : -1)).filter((i) => i !== -1);
  if (empty.length === 0) return -1;

  for (const i of empty) {
    const test = [...board];
    test[i] = "O";
    if (checkWinner(test) === "O") return i;
  }
  for (const i of empty) {
    const test = [...board];
    test[i] = "X";
    if (checkWinner(test) === "X") return i;
  }
  if (board[4] === null) return 4;
  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

function TicTacToe({ onBack }: { onBack: () => void }) {
  const [board, setBoard] = useState<TicTacToeCell[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [score, setScore] = useState({ player: 0, ai: 0, draws: 0 });
  const winner = checkWinner(board);
  const isDraw = !winner && board.every((c) => c !== null);
  const gameOver = !!winner || isDraw;

  useEffect(() => {
    if (!isPlayerTurn && !gameOver) {
      const timer = setTimeout(() => {
        const move = getAIMove(board);
        if (move >= 0) {
          const next = [...board];
          next[move] = "O";
          setBoard(next);
          setIsPlayerTurn(true);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, board, gameOver]);

  useEffect(() => {
    if (winner === "X") setScore((s) => ({ ...s, player: s.player + 1 }));
    else if (winner === "O") setScore((s) => ({ ...s, ai: s.ai + 1 }));
    else if (isDraw) setScore((s) => ({ ...s, draws: s.draws + 1 }));
  }, [winner, isDraw]);

  const handleClick = (i: number) => {
    if (board[i] || !isPlayerTurn || gameOver) return;
    const next = [...board];
    next[i] = "X";
    setBoard(next);
    setIsPlayerTurn(false);
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-6">
      <div className="flex items-center gap-4 w-full max-w-md">
        <button onClick={onBack} className="text-neutral-400 hover:text-white" data-testid="button-game-back">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-white font-display flex-1">Tic Tac Toe</h2>
        <div className="flex gap-3 text-xs font-mono">
          <span className="text-blue-400">You: {score.player}</span>
          <span className="text-neutral-500">Draw: {score.draws}</span>
          <span className="text-red-400">AI: {score.ai}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2" data-testid="tictactoe-board">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className={cn(
              "w-20 h-20 rounded-xl text-2xl font-bold flex items-center justify-center transition-all",
              cell === null && !gameOver
                ? "bg-neutral-800 hover:bg-neutral-700 cursor-pointer"
                : "bg-neutral-800/60 cursor-default",
              cell === "X" && "text-blue-400",
              cell === "O" && "text-red-400"
            )}
            data-testid={`tictactoe-cell-${i}`}
          >
            {cell}
          </button>
        ))}
      </div>

      <div className="h-8 flex items-center gap-3">
        {gameOver && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
            <span className={cn("text-sm font-semibold", winner === "X" ? "text-blue-400" : winner === "O" ? "text-red-400" : "text-neutral-400")}>
              {winner === "X" ? "You win!" : winner === "O" ? "AI wins!" : "It's a draw!"}
            </span>
            <Button size="sm" variant="outline" onClick={reset} className="text-xs gap-1" data-testid="button-ttt-restart">
              <RotateCcw size={14} /> Play Again
            </Button>
          </motion.div>
        )}
        {!gameOver && (
          <span className="text-xs text-neutral-500">{isPlayerTurn ? "Your turn (X)" : "AI thinking..."}</span>
        )}
      </div>
    </div>
  );
}

const EMOJIS = ["🎵", "🎸", "🎧", "🎤", "🎹", "🥁", "🎺", "🎻"];

function MemoryMatch({ onBack }: { onBack: () => void }) {
  const [cards, setCards] = useState<{ emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const lockRef = useRef(false);

  const initGame = useCallback(() => {
    const pairs = [...EMOJIS, ...EMOJIS];
    const shuffled = pairs.sort(() => Math.random() - 0.5).map((emoji) => ({ emoji, flipped: false, matched: false }));
    setCards(shuffled);
    setSelected([]);
    setMoves(0);
    setGameWon(false);
    lockRef.current = false;
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const handleFlip = (i: number) => {
    if (lockRef.current || cards[i].flipped || cards[i].matched || selected.length >= 2) return;

    const next = [...cards];
    next[i].flipped = true;
    const newSelected = [...selected, i];
    setCards(next);
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      lockRef.current = true;
      const [a, b] = newSelected;
      if (next[a].emoji === next[b].emoji) {
        next[a].matched = true;
        next[b].matched = true;
        setCards([...next]);
        setSelected([]);
        lockRef.current = false;
        if (next.every((c) => c.matched)) setGameWon(true);
      } else {
        setTimeout(() => {
          next[a].flipped = false;
          next[b].flipped = false;
          setCards([...next]);
          setSelected([]);
          lockRef.current = false;
        }, 800);
      }
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 px-6">
      <div className="flex items-center gap-4 w-full max-w-md">
        <button onClick={onBack} className="text-neutral-400 hover:text-white" data-testid="button-game-back">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-white font-display flex-1">Memory Match</h2>
        <span className="text-xs font-mono text-neutral-400">Moves: {moves}</span>
      </div>

      {gameWon ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3">
          <Trophy className="text-amber-400" size={40} />
          <p className="text-white font-bold">You matched all pairs in {moves} moves!</p>
          <Button size="sm" variant="outline" onClick={initGame} className="text-xs gap-1" data-testid="button-memory-restart">
            <RotateCcw size={14} /> Play Again
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-4 gap-2" data-testid="memory-board">
          {cards.map((card, i) => (
            <button
              key={i}
              onClick={() => handleFlip(i)}
              className={cn(
                "w-16 h-16 rounded-xl text-xl flex items-center justify-center transition-all duration-300",
                card.matched ? "bg-green-900/30 border border-green-500/30" :
                card.flipped ? "bg-neutral-700 border border-white/20" :
                "bg-neutral-800 hover:bg-neutral-700 border border-white/5 cursor-pointer"
              )}
              data-testid={`memory-card-${i}`}
            >
              {card.flipped || card.matched ? card.emoji : "?"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type ReactionState = "waiting" | "ready" | "toosoon" | "go" | "done";

function ReactionTime({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<ReactionState>("waiting");
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRound = () => {
    setState("ready");
    const delay = 1500 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      setState("go");
      setStartTime(Date.now());
    }, delay);
  };

  const handleClick = () => {
    if (state === "waiting") {
      startRound();
    } else if (state === "ready") {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState("toosoon");
    } else if (state === "go") {
      const time = Date.now() - startTime;
      setReactionTime(time);
      if (best === null || time < best) setBest(time);
      setState("done");
    } else if (state === "toosoon" || state === "done") {
      startRound();
    }
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const bgColor = state === "go" ? "bg-green-600" : state === "toosoon" ? "bg-red-600" : state === "ready" ? "bg-amber-600" : "bg-neutral-800";

  return (
    <div className="h-full flex flex-col px-6">
      <div className="flex items-center gap-4 pt-4 mb-4">
        <button onClick={onBack} className="text-neutral-400 hover:text-white" data-testid="button-game-back">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-white font-display flex-1">Reaction Time</h2>
        {best !== null && <span className="text-xs font-mono text-amber-400">Best: {best}ms</span>}
      </div>

      <button
        onClick={handleClick}
        className={cn("flex-1 rounded-2xl flex flex-col items-center justify-center transition-colors duration-200 cursor-pointer", bgColor)}
        data-testid="reaction-area"
      >
        {state === "waiting" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Zap size={40} className="text-amber-400 mx-auto mb-3" />
            <p className="text-white font-bold text-lg">Tap to Start</p>
            <p className="text-neutral-400 text-sm mt-1">Tap when the screen turns green</p>
          </motion.div>
        )}
        {state === "ready" && (
          <p className="text-white font-bold text-lg">Wait for green...</p>
        )}
        {state === "go" && (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
            <p className="text-white font-bold text-2xl">TAP NOW!</p>
          </motion.div>
        )}
        {state === "toosoon" && (
          <div className="text-center">
            <p className="text-white font-bold text-lg">Too soon!</p>
            <p className="text-white/70 text-sm mt-1">Tap to try again</p>
          </div>
        )}
        {state === "done" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <p className="text-5xl font-bold text-white font-mono">{reactionTime}ms</p>
            <p className="text-neutral-300 text-sm mt-2">
              {reactionTime < 250 ? "Lightning fast!" : reactionTime < 350 ? "Nice reflexes!" : reactionTime < 500 ? "Not bad!" : "Keep practicing!"}
            </p>
            <p className="text-neutral-400 text-xs mt-3">Tap to try again</p>
          </motion.div>
        )}
      </button>
    </div>
  );
}

export default function Games() {
  const [, setLocation] = useLocation();
  const [activeGame, setActiveGame] = useState<GameId>("menu");

  const goBack = () => setActiveGame("menu");

  return (
    <PodFrame onBack={() => (activeGame === "menu" ? setLocation("/") : setActiveGame("menu"))} showBack>
      <div className="h-full flex flex-col bg-gradient-to-b from-neutral-900 via-neutral-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[60%] bg-emerald-900/50 blur-[100px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[60%] bg-blue-900/50 blur-[100px] rounded-full" />
        </div>

        <AnimatePresence mode="wait">
          {activeGame === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col z-10 p-6"
            >
              <h1 className="text-xl font-bold text-white font-display mb-1">Mini Games</h1>
              <p className="text-neutral-400 text-sm mb-5">Pick a game and enjoy the ride</p>
              <div className="grid grid-cols-3 gap-3 flex-1">
                {gameList.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setActiveGame(game.id)}
                    className="flex flex-col items-center justify-center rounded-2xl bg-neutral-800/60 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all p-4 cursor-pointer group"
                    data-testid={`button-game-${game.id}`}
                  >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg", game.color)}>
                      <game.icon size={24} />
                    </div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{game.title}</h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{game.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          {activeGame === "tictactoe" && (
            <motion.div key="ttt" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 z-10">
              <TicTacToe onBack={goBack} />
            </motion.div>
          )}
          {activeGame === "memory" && (
            <motion.div key="mem" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 z-10">
              <MemoryMatch onBack={goBack} />
            </motion.div>
          )}
          {activeGame === "reaction" && (
            <motion.div key="rxn" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 z-10">
              <ReactionTime onBack={goBack} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PodFrame>
  );
}
