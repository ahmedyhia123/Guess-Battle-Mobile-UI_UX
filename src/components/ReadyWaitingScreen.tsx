import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Card } from './ui/card'
import { Check, Loader2, ArrowLeft } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { RoomCleanupWarning } from './RoomCleanupWarning'

interface Player {
  id: string
  fullName: string
  profilePicture: string | null
  ready: boolean
}

interface ReadyWaitingScreenProps {
  roomId: string
  accessToken: string
  userId: string
  onBothReady: () => void
  onBack: () => void
}

export function ReadyWaitingScreen({ roomId, accessToken, userId, onBothReady, onBack }: ReadyWaitingScreenProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [isReady, setIsReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastActivity, setLastActivity] = useState(new Date().toISOString())
  const [roomStatus, setRoomStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting')

  const fetchRoomStatus = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ea873bbf/rooms/${roomId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      const data = await response.json()

      if (response.ok && data.room) {
        setPlayers(data.room.players)
        setLastActivity(data.room.lastActivity || data.room.createdAt)
        setRoomStatus(data.room.status || 'waiting')
        
        // Check if both players are ready
        if (data.room.players.length === 2 && data.room.players.every((p: Player) => p.ready)) {
          onBothReady()
        }

        // Update local ready state
        const currentPlayer = data.room.players.find((p: Player) => p.id === userId)
        if (currentPlayer) {
          setIsReady(currentPlayer.ready)
        }
      }
    } catch (error) {
      console.error('Fetch room status error:', error)
    }
  }

  useEffect(() => {
    fetchRoomStatus()
    const interval = setInterval(fetchRoomStatus, 2000)
    return () => clearInterval(interval)
  }, [roomId])

  const handleToggleReady = async () => {
    setLoading(true)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ea873bbf/rooms/${roomId}/ready`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ ready: !isReady }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        toast.error('Failed to update ready status: ' + (data.error || 'Unknown error'))
        setLoading(false)
        return
      }

      setIsReady(!isReady)
      toast.success(isReady ? 'Not ready' : 'Ready!')
    } catch (error) {
      toast.error('Ready status error: ' + String(error))
    } finally {
      setLoading(false)
    }
  }

  const currentPlayer = players.find(p => p.id === userId)
  const opponent = players.find(p => p.id !== userId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      {/* Cleanup Warning */}
      <RoomCleanupWarning lastActivity={lastActivity} status={roomStatus} />
      
      <div className="max-w-md w-full">
        {/* Back Button */}
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-white hover:bg-white/20 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Leave Room
        </Button>

        {/* Room ID */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <p className="text-white/80 mb-2">Room ID</p>
          <p className="text-white text-2xl tracking-wider">{roomId}</p>
        </motion.div>

        {/* Players */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          {/* Current Player */}
          <Card className="p-6 bg-white/95 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <Avatar className="w-20 h-20 mb-3 ring-4 ring-purple-400">
                <AvatarImage src={currentPlayer?.profilePicture || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white">
                  {currentPlayer?.fullName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-gray-900 mb-2 text-center">{currentPlayer?.fullName || 'You'}</p>
              {isReady ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-5 h-5" />
                  <span>Ready</span>
                </div>
              ) : (
                <span className="text-gray-500">Not Ready</span>
              )}
            </div>
          </Card>

          {/* Opponent */}
          <Card className="p-6 bg-white/95 backdrop-blur-sm">
            {opponent ? (
              <div className="flex flex-col items-center">
                <Avatar className="w-20 h-20 mb-3 ring-4 ring-blue-400">
                  <AvatarImage src={opponent.profilePicture || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-400 text-white">
                    {opponent.fullName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-gray-900 mb-2 text-center">{opponent.fullName}</p>
                {opponent.ready ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <Check className="w-5 h-5" />
                    <span>Ready</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Waiting...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-3" />
                <p className="text-gray-500 text-center">Waiting for opponent...</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Ready Button */}
        {players.length === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleToggleReady}
              disabled={loading}
              className={`w-full h-14 rounded-2xl shadow-lg transition-all ${
                isReady
                  ? 'bg-gray-400 hover:bg-gray-500'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isReady ? (
                'Not Ready'
              ) : (
                'Ready'
              )}
            </Button>
          </motion.div>
        )}

        {/* Status Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          {players.length === 2 ? (
            players.every(p => p.ready) ? (
              <p className="text-white">🎮 Starting game...</p>
            ) : (
              <p className="text-white/80">Waiting for both players to be ready</p>
            )
          ) : (
            <p className="text-white/80">Waiting for second player to join...</p>
          )}
        </motion.div>
      </div>
    </div>
  )
}
