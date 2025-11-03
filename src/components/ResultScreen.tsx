import { useEffect } from 'react'
import { motion } from 'motion/react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Trophy, Target, TrendingUp, Home } from 'lucide-react'
import confetti from 'canvas-confetti'

interface ResultScreenProps {
  isWinner: boolean
  onPlayAgain: () => void
  onExit: () => void
}

export function ResultScreen({ isWinner, onPlayAgain, onExit }: ResultScreenProps) {
  useEffect(() => {
    if (isWinner) {
      // Confetti animation
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#8B5CF6', '#3B82F6', '#EC4899'],
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#8B5CF6', '#3B82F6', '#EC4899'],
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      frame()
    }
  }, [isWinner])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="max-w-md w-full"
      >
        <Card className="p-8 bg-white rounded-3xl shadow-2xl text-center overflow-hidden relative">
          {/* Decorative Background */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-purple-500 to-pink-500 opacity-10" />

          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              delay: 0.2 
            }}
            className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center relative z-10 ${
              isWinner 
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                : 'bg-gradient-to-br from-gray-400 to-gray-600'
            }`}
          >
            {isWinner ? (
              <Trophy className="w-12 h-12 text-white" />
            ) : (
              <Target className="w-12 h-12 text-white" />
            )}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`mb-3 ${
              isWinner ? 'text-purple-600' : 'text-gray-700'
            }`}
          >
            {isWinner ? '🎉 Victory!' : 'Better Luck Next Time'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-8"
          >
            {isWinner 
              ? "Congratulations! You've cracked the code!"
              : "Your opponent guessed the number first. Keep practicing!"
            }
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-4 mb-8"
          >
            <div className="p-4 bg-purple-50 rounded-2xl">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-purple-600" />
                <p className="text-sm text-purple-900">Result</p>
              </div>
              <p className="text-2xl text-purple-600">
                {isWinner ? 'Win' : 'Loss'}
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-900">Status</p>
              </div>
              <p className="text-2xl text-blue-600">
                {isWinner ? '✓' : '✗'}
              </p>
            </div>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Button
              onClick={onPlayAgain}
              className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-2xl shadow-lg"
            >
              Play Again
            </Button>

            <Button
              onClick={onExit}
              variant="outline"
              className="w-full h-14 border-2 rounded-2xl"
            >
              <Home className="w-5 h-5 mr-2" />
              Exit to Lobby
            </Button>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  )
}
