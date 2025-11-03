import { motion } from 'motion/react'
import { Button } from './ui/button'
import { Gamepad2, Zap } from 'lucide-react'

interface WelcomeScreenProps {
  onLogin: () => void
  onSignUp: () => void
}

export function WelcomeScreen({ onLogin, onSignUp }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md w-full"
      >
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            delay: 0.2 
          }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 10, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Gamepad2 className="w-24 h-24 text-white drop-shadow-2xl" />
            </motion.div>
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
              }}
              className="absolute -top-2 -right-2"
            >
              <Zap className="w-8 h-8 text-yellow-300" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white mb-3"
        >
          Guess Battle
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/90 mb-12 px-4"
        >
          Challenge your friends in the ultimate number guessing showdown!
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <Button
            onClick={onLogin}
            className="w-full bg-white text-purple-600 hover:bg-gray-100 h-14 rounded-2xl shadow-lg"
          >
            Login
          </Button>
          
          <Button
            onClick={onSignUp}
            variant="outline"
            className="w-full border-2 border-white text-white hover:bg-white/10 h-14 rounded-2xl shadow-lg"
          >
            Sign Up
          </Button>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-32 h-32 bg-purple-300/10 rounded-full blur-3xl" />
      </motion.div>
    </div>
  )
}
