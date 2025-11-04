import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Target, TrendingUp, CheckCircle2, XCircle, Loader2, Lock } from 'lucide-react'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'

interface GuessResult {
  guess: string
  correctPosition: number
  correctDigit: number
  timestamp: string
}

interface Player {
  id: string
  fullName: string
  profilePicture: string | null
  guesses: GuessResult[]
  secretNumber?: string
}

interface RoomData {
  players: Player[]
  status: string
  winner: string | null
  currentTurn: number
  round: number
}

interface GameplayScreenProps {
  roomId: string
  accessToken: string
  userId: string
  onGameEnd: (isWinner: boolean) => void
}

export function GameplayScreen({ roomId, accessToken, userId, onGameEnd }: GameplayScreenProps) {
  const [guess, setGuess] = useState('')
  const [guesses, setGuesses] = useState<GuessResult[]>([])
  const [opponent, setOpponent] = useState<Player | null>(null)
  const [digitCount, setDigitCount] = useState(4)
  const [loading, setLoading] = useState(false)
  const [currentTurn, setCurrentTurn] = useState(0)
  const [round, setRound] = useState(1)
  const [playerIndex, setPlayerIndex] = useState(0)
  const [turnTransition, setTurnTransition] = useState(false)
  const [mySecretNumber, setMySecretNumber] = useState('')
  const [turnDeadline, setTurnDeadline] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(30)

  const fetchGameState = async () => {
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
        const currentPlayer = data.room.players.find((p: Player) => p.id === userId)
        const opponentPlayer = data.room.players.find((p: Player) => p.id !== userId)
        const pIndex = data.room.players.findIndex((p: Player) => p.id === userId)

        if (currentPlayer) {
          setGuesses(currentPlayer.guesses || [])
          if (currentPlayer.secretNumber) {
            setDigitCount(currentPlayer.secretNumber.length)
            setMySecretNumber(currentPlayer.secretNumber)
          }
        }

        if (opponentPlayer) {
          setOpponent(opponentPlayer)
        }

        setPlayerIndex(pIndex)
        setCurrentTurn(data.room.currentTurn ?? 0)
        setRound(data.room.round ?? 1)
        setTurnDeadline(data.room.turnDeadline)

        // Check if game is finished
        if (data.room.status === 'finished') {
          onGameEnd(data.room.winner === userId)
        }
      }
    } catch (error) {
      console.error('Fetch game state error:', error)
    }
  }

  useEffect(() => {
    fetchGameState()
    const interval = setInterval(fetchGameState, 2000)
    return () => clearInterval(interval)
  }, [roomId])

  // Timer countdown
  useEffect(() => {
    if (!turnDeadline) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const deadline = new Date(turnDeadline).getTime()
      const remaining = Math.max(0, Math.floor((deadline - now) / 1000))
      
      setTimeRemaining(remaining)

      // Auto-skip turn if time runs out
      if (remaining === 0 && currentTurn === playerIndex) {
        handleSkipTurn()
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [turnDeadline, currentTurn, playerIndex])

  const handleSkipTurn = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ea873bbf/rooms/${roomId}/skip-turn`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (response.ok && data.skipped) {
        toast.error('⏰ Time\'s up! Turn skipped.')
        fetchGameState()
      }
    } catch (error) {
      console.error('Skip turn error:', error)
    }
  }

  // Detect turn changes and play sound/vibration
  useEffect(() => {
    const prevTurn = sessionStorage.getItem(`turn_${roomId}`)
    const currentTurnStr = String(currentTurn)
    
    if (prevTurn !== null && prevTurn !== currentTurnStr) {
      const isNowMyTurn = currentTurn === playerIndex
      
      // Trigger transition animation
      setTurnTransition(true)
      setTimeout(() => setTurnTransition(false), 600)
      
      // Play sound effect (only if it's now my turn)
      if (isNowMyTurn && typeof Audio !== 'undefined') {
        try {
          // Simple beep sound using Web Audio API
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.value = 800
          oscillator.type = 'sine'
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.3)
        } catch (e) {
          console.log('Audio not supported')
        }
      }
      
      // Vibration (only if it's now my turn)
      if (isNowMyTurn && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100])
      }
    }
    
    sessionStorage.setItem(`turn_${roomId}`, currentTurnStr)
  }, [currentTurn, playerIndex, roomId])

  const handleGuess = async (e: React.FormEvent) => {
    e.preventDefault()

    if (guess.length !== digitCount) {
      toast.error(`Please enter exactly ${digitCount} digits`)
      return
    }

    if (!/^\d+$/.test(guess)) {
      toast.error('Please enter only numbers')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ea873bbf/rooms/${roomId}/guess`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ guess }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || 'Unknown error'
        if (errorMsg === 'Not your turn') {
          toast.error('Wait for your opponent to finish their turn!')
        } else {
          toast.error('Failed to submit guess: ' + errorMsg)
        }
        setLoading(false)
        return
      }

      if (data.isWinner) {
        toast.success('🎉 You won!')
        setTimeout(() => onGameEnd(true), 1000)
      } else {
        const { correctPosition, correctDigit } = data.feedback
        if (correctPosition > 0 || correctDigit > 0) {
          toast.success(`${correctPosition} correct positions, ${correctDigit} correct digits!`)
        } else {
          toast.error('No matches. Try again!')
        }
        
        // Show opponent's turn message
        setTimeout(() => {
          toast.info(`Waiting for ${opponent?.fullName}'s turn...`)
        }, 1500)
      }

      setGuess('')
      setLoading(false)
      
      // Immediately fetch updated state
      setTimeout(() => fetchGameState(), 500)
    } catch (error) {
      toast.error('Guess error: ' + String(error))
      setLoading(false)
    }
  }

  const isMyTurn = currentTurn === playerIndex
  const currentPlayerName = isMyTurn ? 'Your' : opponent?.fullName + "'s"
  
  // Timer color based on time remaining
  const getTimerColor = () => {
    if (timeRemaining > 20) return 'from-green-400 to-emerald-500'
    if (timeRemaining > 10) return 'from-yellow-400 to-orange-400'
    return 'from-red-500 to-pink-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-4 relative">
      {/* Turn transition flash overlay */}
      <AnimatePresence>
        {turnTransition && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={`fixed inset-0 pointer-events-none z-50 ${isMyTurn ? 'bg-green-400' : 'bg-orange-400'}`}
          />
        )}
      </AnimatePresence>
      
      <div className="max-w-4xl mx-auto pt-4">
        {/* Round Counter & Timer */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center justify-between gap-4"
        >
          <div className="flex-1 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <p className="text-white">Round {round}</p>
            </div>
          </div>

          {/* 30-Second Timer */}
          <motion.div
            animate={timeRemaining <= 5 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: timeRemaining <= 5 ? Infinity : 0 }}
            className="flex-1 flex justify-center"
          >
            <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${getTimerColor()} px-6 py-3 rounded-full shadow-lg`}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-white min-w-[3ch] text-center">{timeRemaining}s</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Turn Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4"
        >
          <Card className={`p-4 ${isMyTurn ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-red-500'} border-0`}>
            <div className="flex items-center justify-center gap-3">
              <motion.div
                animate={{ rotate: isMyTurn ? 0 : 360 }}
                transition={{ duration: 0.5 }}
              >
                <Target className="w-6 h-6 text-white" />
              </motion.div>
              <p className="text-white text-center">
                {currentPlayerName} Turn
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Your Secret Number Display */}
        {mySecretNumber && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
              <div className="flex items-center justify-center gap-3">
                <Lock className="w-5 h-5 text-green-600" />
                <div className="text-center">
                  <p className="text-xs text-green-700 mb-1">Your Secret Number</p>
                  <p className="text-2xl tracking-widest text-green-600">{mySecretNumber}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Header - Players Info */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="p-4 bg-white/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-3 transition-all ${currentTurn === 1 ? 'ring-4 ring-blue-400 rounded-xl p-2' : ''}`}>
                <Avatar className="w-12 h-12 ring-2 ring-blue-400">
                  <AvatarImage src={opponent?.profilePicture || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-400 text-white">
                    {opponent?.fullName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-gray-900">{opponent?.fullName}</p>
                  <p className="text-sm text-gray-600">{opponent?.guesses?.length || 0} guesses</p>
                </div>
              </div>
              <div className={`text-right transition-all ${currentTurn === 0 ? 'ring-4 ring-purple-400 rounded-xl p-2' : ''}`}>
                <p className="text-sm text-gray-600">Your Guesses</p>
                <p className="text-2xl text-purple-600">{guesses.length}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Guess Input or Waiting Screen */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          {!isMyTurn ? (
            <Card className="p-8 bg-white rounded-3xl shadow-2xl">
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="flex justify-center"
                >
                  <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
                </motion.div>
                <div>
                  <h3 className="text-gray-900 text-xl mb-2">Waiting for opponent...</h3>
                  <p className="text-gray-600">{opponent?.fullName} is making their move</p>
                </div>
                <div className="flex justify-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    className="w-3 h-3 bg-blue-500 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    className="w-3 h-3 bg-purple-500 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    className="w-3 h-3 bg-pink-500 rounded-full"
                  />
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 bg-white rounded-3xl shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-6 h-6 text-purple-600" />
                <h3 className="text-gray-900">Make Your Guess</h3>
              </div>

              <form onSubmit={handleGuess} className="space-y-4">
                <Input
                  type="text"
                  value={guess}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, digitCount)
                    setGuess(value)
                  }}
                  placeholder={`Enter ${digitCount} digits`}
                  className="h-16 text-center text-2xl tracking-widest rounded-2xl"
                  maxLength={digitCount}
                  autoFocus
                />

                <Button
                  type="submit"
                  disabled={loading || guess.length !== digitCount}
                  className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-2xl shadow-lg"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Submit Guess'
                  )}
                </Button>
              </form>
            </Card>
          )}
        </motion.div>

        {/* Guess History */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-white" />
            <h3 className="text-white">Your Guesses</h3>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            <AnimatePresence>
              {guesses.length === 0 ? (
                <Card className="p-6 text-center bg-white/10 backdrop-blur-sm border-white/20">
                  <p className="text-white/80">No guesses yet. Start guessing!</p>
                </Card>
              ) : (
                guesses.map((guessItem, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4 bg-white hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white">
                            {guesses.length - index}
                          </div>
                          <div>
                            <p className="text-xl tracking-wider text-gray-900">
                              {guessItem.guess}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(guessItem.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-green-600 mb-1">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm">Position</span>
                            </div>
                            <p className="text-2xl">{guessItem.correctPosition}</p>
                          </div>

                          <div className="text-center">
                            <div className="flex items-center gap-1 text-orange-600 mb-1">
                              <Target className="w-4 h-4" />
                              <span className="text-sm">Digit</span>
                            </div>
                            <p className="text-2xl">{guessItem.correctDigit}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
