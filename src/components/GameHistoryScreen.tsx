import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { ArrowLeft, Trophy, Target, Calendar, Filter } from 'lucide-react'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'

interface GameRecord {
  id: string
  roomId: string
  opponentId: string
  opponentName: string
  result: 'win' | 'loss'
  rounds: number
  timestamp: string
}

interface GameHistoryScreenProps {
  accessToken: string
  onBack: () => void
}

export function GameHistoryScreen({ accessToken, onBack }: GameHistoryScreenProps) {
  const [history, setHistory] = useState<GameRecord[]>([])
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ea873bbf/history`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (response.ok) {
        setHistory(data.history || [])
      } else {
        toast.error('Failed to load history: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      toast.error('History error: ' + String(error))
    } finally {
      setLoading(false)
    }
  }

  const filteredHistory = history.filter(game => {
    if (filter === 'all') return true
    return game.result === (filter === 'wins' ? 'win' : 'loss')
  })

  const stats = {
    total: history.length,
    wins: history.filter(g => g.result === 'win').length,
    losses: history.filter(g => g.result === 'loss').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4">
      <div className="max-w-4xl mx-auto pt-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <h1 className="text-white">Game History</h1>
          <div className="w-20" /> {/* Spacer */}
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <Card className="p-4 bg-white/95 backdrop-blur-sm text-center">
            <p className="text-sm text-gray-600 mb-1">Total Games</p>
            <p className="text-3xl text-gray-900">{stats.total}</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-400 to-emerald-500 text-center">
            <p className="text-sm text-white/90 mb-1">Wins</p>
            <p className="text-3xl text-white">{stats.wins}</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-red-400 to-pink-500 text-center">
            <p className="text-sm text-white/90 mb-1">Losses</p>
            <p className="text-3xl text-white">{stats.losses}</p>
          </Card>
        </motion.div>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 mb-6"
        >
          <Filter className="w-5 h-5 text-white" />
          <div className="flex gap-2">
            {(['all', 'wins', 'losses'] as const).map((filterOption) => (
              <Button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`rounded-xl ${
                  filter === filterOption
                    ? 'bg-white text-purple-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* History List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {loading ? (
            <Card className="p-8 text-center bg-white/10 backdrop-blur-sm border-white/20">
              <p className="text-white/80">Loading history...</p>
            </Card>
          ) : filteredHistory.length === 0 ? (
            <Card className="p-8 text-center bg-white/10 backdrop-blur-sm border-white/20">
              <p className="text-white/80">
                {filter === 'all' 
                  ? 'No games played yet. Start your first battle!'
                  : `No ${filter} found.`
                }
              </p>
            </Card>
          ) : (
            filteredHistory.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 bg-white hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Result Icon */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        game.result === 'win' 
                          ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                          : 'bg-gradient-to-br from-red-400 to-pink-500'
                      }`}>
                        {game.result === 'win' ? (
                          <Trophy className="w-6 h-6 text-white" />
                        ) : (
                          <Target className="w-6 h-6 text-white" />
                        )}
                      </div>

                      {/* Game Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-gray-900">vs {game.opponentName}</p>
                          <Badge 
                            variant={game.result === 'win' ? 'default' : 'destructive'}
                            className="rounded-full"
                          >
                            {game.result}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {game.rounds} rounds
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(game.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Room ID */}
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Room ID</p>
                      <p className="text-sm text-gray-700 font-mono">{game.roomId}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  )
}
