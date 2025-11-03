import { useState } from 'react'
import { motion } from 'motion/react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { ArrowLeft, Lock, Moon, Sun, Bell, LogOut } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface SettingsScreenProps {
  onBack: () => void
  onLogout: () => void
}

export function SettingsScreen({ onBack, onLogout }: SettingsScreenProps) {
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [soundEffects, setSoundEffects] = useState(true)
  const [vibration, setVibration] = useState(true)

  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setChangingPassword(true)

    // In a real implementation, you would call the Supabase API to change password
    setTimeout(() => {
      toast.success('Password changed successfully!')
      setShowPasswordChange(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setChangingPassword(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4">
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
          <h1 className="text-white">Settings</h1>
          <div className="w-20" /> {/* Spacer */}
        </motion.div>

        {/* Settings Cards */}
        <div className="space-y-4">
          {/* Appearance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-white rounded-2xl">
              <h3 className="text-gray-900 mb-4">Appearance</h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? (
                    <Moon className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Sun className="w-5 h-5 text-yellow-600" />
                  )}
                  <div>
                    <p className="text-gray-900">Dark Mode</p>
                    <p className="text-sm text-gray-600">Change theme appearance</p>
                  </div>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={(checked) => {
                    setDarkMode(checked)
                    toast.info(checked ? 'Dark mode enabled' : 'Light mode enabled')
                  }}
                />
              </div>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-white rounded-2xl">
              <h3 className="text-gray-900 mb-4">Notifications & Sounds</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-gray-900">Push Notifications</p>
                      <p className="text-sm text-gray-600">Get notified about game invites</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔊</span>
                    <div>
                      <p className="text-gray-900">Sound Effects</p>
                      <p className="text-sm text-gray-600">Play sounds during gameplay</p>
                    </div>
                  </div>
                  <Switch
                    checked={soundEffects}
                    onCheckedChange={setSoundEffects}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📳</span>
                    <div>
                      <p className="text-gray-900">Vibration</p>
                      <p className="text-sm text-gray-600">Haptic feedback on actions</p>
                    </div>
                  </div>
                  <Switch
                    checked={vibration}
                    onCheckedChange={setVibration}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 bg-white rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-purple-600" />
                <h3 className="text-gray-900">Security</h3>
              </div>

              {!showPasswordChange ? (
                <Button
                  onClick={() => setShowPasswordChange(true)}
                  variant="outline"
                  className="w-full rounded-xl"
                >
                  Change Password
                </Button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="mt-2 h-11 rounded-xl"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-2 h-11 rounded-xl"
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-2 h-11 rounded-xl"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={changingPassword}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl"
                    >
                      {changingPassword ? 'Changing...' : 'Change Password'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowPasswordChange(false)
                        setCurrentPassword('')
                        setNewPassword('')
                        setConfirmPassword('')
                      }}
                      variant="outline"
                      className="flex-1 rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </motion.div>

          {/* Logout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={onLogout}
              variant="outline"
              className="w-full h-14 border-2 border-white text-white hover:bg-white/10 rounded-2xl"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
