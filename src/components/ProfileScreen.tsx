import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { ArrowLeft, Edit2, Trophy, Target, TrendingUp, Upload } from 'lucide-react'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'

interface UserProfile {
  id: string
  email: string
  fullName: string
  profilePicture: string | null
  level: number
  wins: number
  losses: number
  totalGames: number
  accuracy: number
}

interface ProfileScreenProps {
  userId: string
  accessToken: string
  onBack: () => void
}

export function ProfileScreen({ userId, accessToken, onBack }: ProfileScreenProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPicture, setEditPicture] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ea873bbf/profile/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (response.ok) {
        setProfile(data.profile)
        setEditName(data.profile.fullName)
        setEditPicture(data.profile.profilePicture)
      } else {
        toast.error('Failed to load profile: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      toast.error('Profile error: ' + String(error))
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditPicture(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ea873bbf/profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            fullName: editName,
            profilePicture: editPicture,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        toast.error('Failed to update profile: ' + (data.error || 'Unknown error'))
        setSaving(false)
        return
      }

      setProfile(data.profile)
      setEditing(false)
      toast.success('Profile updated!')
    } catch (error) {
      toast.error('Update error: ' + String(error))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <p className="text-white">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <p className="text-white">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-4">
      <div className="max-w-2xl mx-auto pt-4">
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
          {!editing && (
            <Button
              onClick={() => setEditing(true)}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <Edit2 className="w-5 h-5 mr-2" />
              Edit
            </Button>
          )}
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 bg-white rounded-3xl shadow-2xl mb-6">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                <Avatar className="w-32 h-32 ring-4 ring-purple-400">
                  <AvatarImage src={(editing ? editPicture : profile.profilePicture) || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-4xl">
                    {(editing ? editName : profile.fullName).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {editing && (
                  <label
                    htmlFor="profile-pic-edit"
                    className="absolute bottom-0 right-0 bg-purple-600 text-white p-3 rounded-full cursor-pointer hover:bg-purple-700 shadow-lg"
                  >
                    <Upload className="w-5 h-5" />
                  </label>
                )}
                <input
                  id="profile-pic-edit"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Name */}
              {editing ? (
                <div className="w-full max-w-xs space-y-4">
                  <div>
                    <Label htmlFor="editName">Full Name</Label>
                    <Input
                      id="editName"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-2 h-11 rounded-xl text-center"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditing(false)
                        setEditName(profile.fullName)
                        setEditPicture(profile.profilePicture)
                      }}
                      variant="outline"
                      className="flex-1 rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-gray-900 mb-1">{profile.fullName}</h2>
                  <p className="text-gray-600">{profile.email}</p>
                  <div className="mt-3 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full">
                    <p className="text-purple-700">Level {profile.level}</p>
                  </div>
                </>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Stats */}
        {!editing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-white mb-4">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 bg-white/95 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Wins</p>
                    <p className="text-2xl text-gray-900">{profile.wins}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/95 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Losses</p>
                    <p className="text-2xl text-gray-900">{profile.losses}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/95 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Games</p>
                    <p className="text-2xl text-gray-900">{profile.totalGames}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/95 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white text-xl">%</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Win Rate</p>
                    <p className="text-2xl text-gray-900">
                      {profile.totalGames > 0 
                        ? Math.round((profile.wins / profile.totalGames) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
