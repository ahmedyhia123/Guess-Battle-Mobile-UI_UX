import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Trophy, Target, TrendingUp, Home, Lock, Eye, Clock } from 'lucide-react'
import confetti from 'canvas-confetti'
import { projectId } from '../utils/supabase/info'

interface ResultScreenProps {
  isWinner: boolean
  roomId?: string
  accessToken?: string
  userId?: string
  onPlayAgain: () => void
  onExit: () => void
}

interface GameData {
  mySecretNumber: string
  opponentSecretNumber: string
  myGuesses: number
  opponentGuesses: number
  rounds: number
  opponentName: string
  duration: string
}

export function ResultScreen({ isWinner, roomId, accessToken, userId, onPlayAgain, onExit }: ResultScreenProps) {
  const [showReveal, setShowReveal] = useState(false)
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [loading, setLoading] = useState(true)

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

    // Fetch game data
    if (roomId && accessToken && userId) {
      fetchGameData()
    }

    // Show reveal animation after 1 second
    setTimeout(() => setShowReveal(true), 1000)
  }, [isWinner, roomId, accessToken, userId])

  const fetchGameData = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ea873bbf/rooms/${roomId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (response.ok && data.room) {
        const me = data.room.players.find((p: any) => p.id === userId)
        const opponent = data.room.players.find((p: any) => p.id !== userId)

        if (me && opponent) {
          const startTime = new Date(data.room.startedAt).getTime()
          const endTime = new Date(data.room.finishedAt).getTime()
          const durationSec = Math.floor((endTime - startTime) / 1000)
          const minutes = Math.floor(durationSec / 60)
          const seconds = durationSec % 60

          setGameData({
            mySecretNumber: me.secretNumber || '????',
            opponentSecretNumber: opponent.secretNumber || '????',
            myGuesses: me.guesses?.length || 0,
            opponentGuesses: opponent.guesses?.length || 0,
            rounds: data.room.round || 1,
            opponentName: opponent.fullName || 'Opponent',
            duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
          })
        }
      }
      setLoading(false)
    } catch (error) {
      console.error('Fetch game data error:', error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="max-w-lg w-full"
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
            className="text-gray-600 mb-6"
          >
            {isWinner 
              ? "Congratulations! You've cracked the code!"
              : "Your opponent guessed the number first. Keep practicing!"
            }
          </motion.p>

          {/* Secret Numbers Reveal */}
          {showReveal && gameData && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
              className="mb-6"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-purple-600" />
                <p className="text-purple-900">Secret Numbers Revealed</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Your Number */}
                <div className="p-4 bg-green-50 rounded-2xl border-2 border-green-200">
                  <p className="text-xs text-green-700 mb-2">Your Number</p>
                  <p className="text-3xl tracking-wider text-green-600">{gameData.mySecretNumber}</p>
                </div>

                {/* Opponent's Number */}
                <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-200">
                  <p className="text-xs text-red-700 mb-2">{gameData.opponentName}</p>
                  <p className="text-3xl tracking-wider text-red-600">{gameData.opponentSecretNumber}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Match Stats */}
          {gameData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-3 gap-3 mb-6"
            >
              <div className="p-3 bg-purple-50 rounded-xl">
                <p className="text-xs text-purple-700 mb-1">Rounds</p>
                <p className="text-xl text-purple-600">{gameData.rounds}</p>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-700 mb-1">Your Guesses</p>
                <p className="text-xl text-blue-600">{gameData.myGuesses}</p>
              </div>

              <div className="p-3 bg-orange-50 rounded-xl">
                <p className="text-xs text-orange-700 mb-1">Duration</p>
                <p className="text-xl text-orange-600">{gameData.duration}</p>
              </div>
            </motion.div>
          )}

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
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
