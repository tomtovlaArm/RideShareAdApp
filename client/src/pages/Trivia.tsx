import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { PodFrame } from "@/components/layout/PodFrame";
import { triviaQuestions as fallbackQuestions } from "@/data/trivia";
import { Check, X, Trophy, RefreshCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import canvasConfetti from 'canvas-confetti';

interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

export default function Trivia() {
  const [, setLocation] = useLocation();
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/trivia?count=5");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setQuestions(data);
      } else {
        throw new Error("Empty response");
      }
    } catch {
      setQuestions(fallbackQuestions);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (gameComplete) {
      canvasConfetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [gameComplete]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionClick = (option: string) => {
    if (isAnswered || !currentQuestion) return;

    setSelectedOption(option);
    setIsAnswered(true);

    if (option === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        setGameComplete(true);
      }
    }, 1500);
  };

  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setGameComplete(false);
    fetchQuestions();
  };

  if (isLoading) {
    return (
      <PodFrame onBack={() => setLocation("/")} showBack>
        <div className="h-full flex flex-col items-center justify-center p-6 space-y-4">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
          <p className="text-neutral-400 text-sm">Generating AI trivia...</p>
        </div>
      </PodFrame>
    );
  }

  return (
    <PodFrame onBack={() => setLocation("/")} showBack={!gameComplete}>
      <div className="h-full flex flex-col p-6">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-display font-bold text-white" data-testid="text-trivia-title">Trivia</h2>
            <p className="text-xs text-neutral-400">{loadError ? "Offline mode" : "Powered by ChatGPT"}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-8 h-8 border-neutral-700 bg-neutral-800 text-neutral-400 hover:text-white"
              onClick={resetGame}
              data-testid="button-refresh-trivia"
            >
              <RefreshCcw size={14} />
            </Button>
            <div className="px-3 py-1 bg-neutral-800 rounded-full border border-neutral-700 flex items-center">
              <span className="text-xs text-neutral-400">Score: <span className="text-white font-bold" data-testid="text-score">{score}</span></span>
            </div>
          </div>
        </div>

        {!gameComplete && currentQuestion ? (
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="w-full h-1 bg-neutral-800 rounded-full mb-6 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
                animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-white leading-tight mb-8" data-testid="text-question">
                {currentQuestion.question}
              </h3>

              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = option === currentQuestion.correctAnswer;

                  let buttonStyle = "bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800";
                  if (isAnswered) {
                    if (isCorrect) buttonStyle = "bg-green-500/20 border-green-500 text-green-400";
                    else if (isSelected && !isCorrect) buttonStyle = "bg-red-500/20 border-red-500 text-red-400";
                    else buttonStyle = "bg-neutral-800/20 border-neutral-800 text-neutral-600";
                  }

                  return (
                    <motion.button
                      key={idx}
                      whileTap={!isAnswered ? { scale: 0.98 } : {}}
                      onClick={() => handleOptionClick(option)}
                      className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all duration-200 text-left ${buttonStyle}`}
                      disabled={isAnswered}
                      data-testid={`button-option-${idx}`}
                    >
                      <span className="font-medium">{option}</span>
                      {isAnswered && isCorrect && <Check size={18} />}
                      {isAnswered && isSelected && !isCorrect && <X size={18} />}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : gameComplete ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
          >
            <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500 mb-4">
              <Trophy size={48} />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold text-white mb-2" data-testid="text-game-over">Game Over!</h2>
              <p className="text-neutral-400" data-testid="text-final-score">You scored {score} out of {questions.length}</p>
            </div>

            <div className="w-full space-y-3 pt-8">
              <Button onClick={resetGame} className="w-full h-12 rounded-full bg-white text-black hover:bg-neutral-200 font-bold" data-testid="button-play-again">
                <RefreshCcw className="mr-2 w-4 h-4" /> Play Again
              </Button>
              <Button variant="outline" onClick={() => setLocation("/")} className="w-full h-12 rounded-full border-neutral-700 text-white hover:bg-neutral-800" data-testid="button-back-menu">
                Back to Menu
              </Button>
            </div>
          </motion.div>
        ) : null}
      </div>
    </PodFrame>
  );
}
