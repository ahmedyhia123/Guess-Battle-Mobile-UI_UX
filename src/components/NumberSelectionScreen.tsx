import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import { Lock, Loader2 } from 'lucide-react'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'

interface NumberSelectionScreenProps {
  roomId: string
  accessToken: string
  onGameStart: () => void
}

export function NumberSelectionScreen({ roomId, accessToken, onGameStart }: NumberSelectionScreenProps) {
  const [secretNumber, setSecretNumber] = useState('')
  const [digitCount, setDigitCount] = useState(4)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Fetch room data to get digit count
  useEffect(() => {
    const fetchRoomData = async () => {
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
          setDigitCount(data.room.digitCount || 4)
        }
      } catch (error) {
        console.error('Fetch room data error:', error)
      }
    }

    fetchRoomData()
  }, [roomId, accessToken])

  useEffect(() => {
    // Poll to check if both players have set their numbers
    const checkGameStatus = async () => {
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

        if (response.ok && data.room?.status === 'playing') {
          onGameStart()
        }
      } catch (error) {
        console.error('Check game status error:', error)
      }
    }

    if (submitted) {
      const interval = setInterval(checkGameStatus, 2000)
      return () => clearInterval(interval)
    }
  }, [submitted, roomId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (secretNumber.length !== digitCount) {
      toast.error(`Please enter exactly ${digitCount} digits`)
      return
    }

    // Validate all digits are numbers
    if (!/^\d+$/.test(secretNumber)) {
      toast.error('Please enter only numbers')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ea873bbf/rooms/${roomId}/set-number`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ secretNumber }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        toast.error('Failed to set number: ' + (data.error || 'Unknown error'))
        setLoading(false)
        return
      }

      toast.success('Secret number set! Waiting for opponent...')
      setSubmitted(true)
    } catch (error) {
      toast.error('Set number error: ' + String(error))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card className="p-8 bg-white rounded-3xl shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            >
              <Lock className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-gray-900 mb-2">Choose Your Secret Number</h2>
            <p className="text-gray-600">Pick a number between {digitCount} digits</p>
          </div>

          {!submitted ? (
            <>
              {/* Digit Count Display */}
              <div className="mb-6 p-4 bg-purple-50 rounded-xl">
                <p className="text-purple-900 text-sm text-center">
                  The host has set the number length to <strong>{digitCount} digits</strong>
                </p>
              </div>

              {/* Number Input */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Input
                    type="text"
                    value={secretNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, digitCount)
                      setSecretNumber(value)
                    }}
                    placeholder={`Enter ${digitCount} digits`}
                    className="h-16 text-center text-2xl tracking-widest rounded-2xl"
                    maxLength={digitCount}
                    autoFocus
                  />
                  <p className="text-sm text-gray-500 text-center mt-2">
                    {secretNumber.length}/{digitCount} digits
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || secretNumber.length !== digitCount}
                  className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl shadow-lg"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Confirm Number'
                  )}
                </Button>
              </form>

              {/* Hint */}
              <div className="mt-6 p-4 bg-purple-50 rounded-xl">
                <p className="text-purple-900 text-sm text-center">
                  💡 Choose wisely! Your opponent will try to guess this number.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
              <h3 className="text-gray-900 mb-2">Number Locked In! 🔒</h3>
              <p className="text-gray-600 mb-4">Waiting for opponent to choose their number...</p>
              
              {/* Show own secret number */}
              <div className="mt-6 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                <p className="text-green-900 text-sm mb-2">Your Secret Number:</p>
                <p className="text-3xl tracking-widest text-green-600">{secretNumber}</p>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
