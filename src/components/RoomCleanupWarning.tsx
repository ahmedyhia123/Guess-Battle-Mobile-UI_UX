import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Card } from './ui/card'
import { AlertTriangle, Clock } from 'lucide-react'

interface RoomCleanupWarningProps {
  lastActivity: string
  status: 'waiting' | 'playing' | 'finished'
}

export function RoomCleanupWarning({ lastActivity, status }: RoomCleanupWarningProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  useEffect(() => {
    const checkInactivity = () => {
      const now = new Date().getTime()
      const lastActivityTime = new Date(lastActivity).getTime()
      const timeSinceActivity = now - lastActivityTime

      let threshold = 0
      let warningThreshold = 0

      if (status === 'waiting') {
        threshold = 5 * 60 * 1000 // 5 minutes
        warningThreshold = 4.5 * 60 * 1000 // 4.5 minutes
      } else if (status === 'playing') {
        threshold = 10 * 60 * 1000 // 10 minutes
        warningThreshold = 9.5 * 60 * 1000 // 9.5 minutes
      } else if (status === 'finished') {
        threshold = 30 * 1000 // 30 seconds
        warningThreshold = 15 * 1000 // 15 seconds
      }

      if (timeSinceActivity >= warningThreshold && timeSinceActivity < threshold) {
        setShowWarning(true)
        setTimeRemaining(Math.floor((threshold - timeSinceActivity) / 1000))
      } else {
        setShowWarning(false)
      }
    }

    checkInactivity()
    const interval = setInterval(checkInactivity, 1000)
    return () => clearInterval(interval)
  }, [lastActivity, status])

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
        >
          <Card className="p-4 bg-gradient-to-r from-orange-500 to-red-500 border-0 shadow-2xl">
            <div className="flex items-center gap-3 text-white">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <AlertTriangle className="w-6 h-6" />
              </motion.div>
              <div className="flex-1">
                <p className="text-sm">Inactivity Warning</p>
                <p className="text-xs opacity-90">
                  Room will be closed in {timeRemaining}s due to inactivity
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <p className="text-lg">{timeRemaining}s</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
