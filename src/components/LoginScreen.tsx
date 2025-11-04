import { useState } from 'react'
import { motion } from 'motion/react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { ArrowLeft, Mail, Lock, Chrome } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'

// Create singleton Supabase client
const supabaseClient = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

interface LoginScreenProps {
  onBack: () => void
  onLoginSuccess: (user: any, accessToken: string) => void
}

export function LoginScreen({ onBack, onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error('Login failed: ' + error.message)
        setLoading(false)
        return
      }

      if (data.session) {
        toast.success('Welcome back!')
        onLoginSuccess(data.user, data.session.access_token)
      }
    } catch (error) {
      toast.error('Login error: ' + String(error))
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    toast.error('Please complete Google OAuth setup at https://supabase.com/docs/guides/auth/social-login/auth-google')
  }

  const handleFacebookLogin = async () => {
    toast.error('Please complete Facebook OAuth setup at https://supabase.com/docs/guides/auth/social-login/auth-facebook')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative"
      >
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8 mt-4">
          <h2 className="text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Login to continue your battle</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
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
              />
            </div>
          </div>

          <button
            type="button"
            className="text-purple-600 hover:text-purple-700 text-sm"
            onClick={() => toast.info('Password reset not implemented in demo')}
          >
            Forgot password?
          </button>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-gray-500">or continue with</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl border-2"
            onClick={handleGoogleLogin}
          >
            <Chrome className="w-5 h-5 mr-2" />
            Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl border-2"
            onClick={handleFacebookLogin}
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
