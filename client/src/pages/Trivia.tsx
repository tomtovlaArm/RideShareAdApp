import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { PodFrame } from "@/components/layout/PodFrame";
import { triviaQuestions } from "@/data/trivia";
import { Check, X, Trophy, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import canvasConfetti from 'canvas-confetti';

export default function Trivia() {
  const [, setLocation] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  const currentQuestion = triviaQuestions[currentQuestionIndex];

  useEffect(() => {
    if (gameComplete) {
        canvasConfetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
  }, [gameComplete]);

  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);

    if (option === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }

    // Auto advance after short delay
    setTimeout(() => {
      if (currentQuestionIndex < triviaQuestions.length - 1) {
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
  };

  return (
    <PodFrame onBack={() => setLocation("/")} showBack={!gameComplete}>
      <div className="h-full flex flex-col p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-display font-bold text-white">Trivia</h2>
            <div className="px-3 py-1 bg-neutral-800 rounded-full border border-neutral-700">
                <span className="text-xs text-neutral-400">Score: <span className="text-white font-bold">{score}</span></span>
            </div>
        </div>

        {!gameComplete ? (
            <motion.div 
                key={currentQuestionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col"
            >
                {/* Progress Bar */}
                <div className="w-full h-1 bg-neutral-800 rounded-full mb-6 overflow-hidden">
                    <motion.div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        initial={{ width: `${((currentQuestionIndex) / triviaQuestions.length) * 100}%` }}
                        animate={{ width: `${((currentQuestionIndex + 1) / triviaQuestions.length) * 100}%` }}
                    />
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-white leading-tight mb-8">
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
        ) : (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
            >
                <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500 mb-4">
                    <Trophy size={48} />
                </div>
                <div>
                    <h2 className="text-3xl font-display font-bold text-white mb-2">Game Over!</h2>
                    <p className="text-neutral-400">You scored {score} out of {triviaQuestions.length}</p>
                </div>
                
                <div className="w-full space-y-3 pt-8">
                    <Button onClick={resetGame} className="w-full h-12 rounded-full bg-white text-black hover:bg-neutral-200 font-bold">
                        <RefreshCcw className="mr-2 w-4 h-4" /> Play Again
                    </Button>
                    <Button variant="outline" onClick={() => setLocation("/")} className="w-full h-12 rounded-full border-neutral-700 text-white hover:bg-neutral-800">
                        Back to Menu
                    </Button>
                </div>
            </motion.div>
        )}
      </div>
    </PodFrame>
  );
}
