import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Plus, Search, RefreshCw, Lock, Users, LogOut, User, History, Settings } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'

interface Room {
  id: string
  name: string
  playerCount: number
  createdBy: string
}

interface RoomsLobbyProps {
  accessToken: string
  userId: string
  onRoomJoined: (roomId: string) => void
  onProfile: () => void
  onHistory: () => void
  onSettings: () => void
  onLogout: () => void
}

export function RoomsLobby({ accessToken, userId, onRoomJoined, onProfile, onHistory, onSettings, onLogout }: RoomsLobbyProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Create room form
  const [roomName, setRoomName] = useState('')
  const [roomPassword, setRoomPassword] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  // Join room form
  const [joinRoomId, setJoinRoomId] = useState('')
  const [joinPassword, setJoinPassword] = useState('')

  const fetchRooms = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ea873bbf/rooms`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      const data = await response.json()

      if (response.ok) {
        setRooms(data.rooms || [])
      }
    } catch (error) {
      console.error('Fetch rooms error:', error)
    }
  }

  useEffect(() => {
    fetchRooms()
    // Poll for room updates every 3 seconds
    const interval = setInterval(fetchRooms, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchRooms()
    setTimeout(() => setRefreshing(false), 500)
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ea873bbf/rooms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            roomName,
            password: roomPassword || null,
            isPublic,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        toast.error('Failed to create room: ' + (data.error || 'Unknown error'))
        setLoading(false)
        return
      }

      toast.success('Room created! Room ID: ' + data.room.id)
      setShowCreateDialog(false)
      setRoomName('')
      setRoomPassword('')
      setIsPublic(true)
      onRoomJoined(data.room.id)
    } catch (error) {
      toast.error('Create room error: ' + String(error))
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async (roomId: string, password?: string) => {
    setLoading(true)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ea873bbf/rooms/${roomId}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ password: password || '' }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        toast.error('Failed to join room: ' + (data.error || 'Unknown error'))
        setLoading(false)
        return
      }

      toast.success('Joined room!')
      setShowJoinDialog(false)
      setJoinRoomId('')
      setJoinPassword('')
      onRoomJoined(roomId)
    } catch (error) {
      toast.error('Join room error: ' + String(error))
    } finally {
      setLoading(false)
    }
  }

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 pt-4"
        >
          <h1 className="text-white">Game Rooms</h1>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onProfile}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <User className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onHistory}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <History className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettings}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="h-14 bg-white text-purple-600 hover:bg-gray-100 rounded-2xl shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Room
          </Button>
          <Button
            onClick={() => setShowJoinDialog(true)}
            variant="outline"
            className="h-14 border-2 border-white text-white hover:bg-white/10 rounded-2xl shadow-lg bg-[rgb(140,75,75)]"
          >
            <Users className="w-5 h-5 mr-2" />
            Join Room
          </Button>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search rooms..."
              className="pl-12 h-12 bg-white rounded-2xl"
            />
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-12 w-12 bg-white text-purple-600 hover:bg-gray-100 rounded-2xl shadow-lg"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </motion.div>

        {/* Rooms List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {filteredRooms.length === 0 ? (
            <Card className="p-8 text-center bg-white/10 backdrop-blur-sm border-white/20">
              <p className="text-white/80">No active rooms found. Create one to start playing!</p>
            </Card>
          ) : (
            filteredRooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 bg-white hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-gray-900">{room.name}</h3>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {room.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {room.playerCount}/2
                        </span>
                        <span>Created by {room.createdBy}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={loading || room.playerCount >= 2}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl"
                    >
                      {room.playerCount >= 2 ? 'Full' : 'Join'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      {/* Create Room Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Room</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRoom} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="roomName">Room Name</Label>
              <Input
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="My Awesome Room"
                className="mt-2 h-11 rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="roomPassword">Password (Optional)</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="roomPassword"
                  type="password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="Leave empty for no password"
                  className="pl-11 h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <Label htmlFor="isPublic" className="cursor-pointer">Make room public</Label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Join Room Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join Room</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleJoinRoom(joinRoomId, joinPassword); }} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="joinRoomId">Room ID</Label>
              <Input
                id="joinRoomId"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                placeholder="Enter Room ID"
                className="mt-2 h-11 rounded-xl uppercase"
                required
              />
            </div>

            <div>
              <Label htmlFor="joinPassword">Password (if required)</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="joinPassword"
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pl-11 h-11 rounded-xl"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
