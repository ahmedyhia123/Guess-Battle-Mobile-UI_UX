import { useState } from 'react'
import { motion } from 'motion/react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { ArrowLeft, User, Mail, Lock, Chrome, Upload } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'

interface SignUpScreenProps {
  onBack: () => void
  onSignUpSuccess: (user: any, accessToken: string) => void
}

export function SignUpScreen({ onBack, onSignUpSuccess }: SignUpScreenProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicture(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ea873bbf/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email,
            password,
            fullName,
            profilePicture,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        toast.error('Sign up failed: ' + (data.error || 'Unknown error'))
        setLoading(false)
        return
      }

      // Auto-login after sign up
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      )

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        toast.error('Auto-login failed: ' + loginError.message)
        setLoading(false)
        return
      }

      if (loginData.session) {
        toast.success('Account created successfully!')
        onSignUpSuccess(loginData.user, loginData.session.access_token)
      }
    } catch (error) {
      toast.error('Sign up error: ' + String(error))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative max-h-[95vh] overflow-y-auto"
      >
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 z-10"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8 mt-4">
          <h2 className="text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600">Join the battle!</p>
        </div>

        {/* Profile Picture Upload */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profilePicture || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white">
                {fullName ? fullName.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="profile-pic"
              className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700 shadow-lg"
            >
              <Upload className="w-4 h-4" />
            </label>
            <input
              id="profile-pic"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignUp} className="space-y-5">
          <div>
            <Label htmlFor="fullName" className="text-gray-700">Full Name</Label>
            <div className="relative mt-2">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-11 h-12 rounded-xl"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-gray-700">Email</Label>
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-12 rounded-xl"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-700">Password</Label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 h-12 rounded-xl"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-gray-500">or sign up with</span>
          </div>
        </div>

        {/* Social Sign Up */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl border-2"
            onClick={() => toast.error('Please complete Google OAuth setup at https://supabase.com/docs/guides/auth/social-login/auth-google')}
          >
            <Chrome className="w-5 h-5 mr-2" />
            Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl border-2"
            onClick={() => toast.error('Please complete Facebook OAuth setup at https://supabase.com/docs/guides/auth/social-login/auth-facebook')}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
