import { useState, useEffect, useMemo } from 'react'
import { WelcomeScreen } from './components/WelcomeScreen'
import { LoginScreen } from './components/LoginScreen'
import { SignUpScreen } from './components/SignUpScreen'
import { RoomsLobby } from './components/RoomsLobby'
import { ReadyWaitingScreen } from './components/ReadyWaitingScreen'
import { NumberSelectionScreen } from './components/NumberSelectionScreen'
import { GameplayScreen } from './components/GameplayScreen'
import { ResultScreen } from './components/ResultScreen'
import { GameHistoryScreen } from './components/GameHistoryScreen'
import { ProfileScreen } from './components/ProfileScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { Toaster } from './components/ui/sonner'
import { getSupabaseClient } from './utils/supabase/client'
import { projectId, publicAnonKey } from './utils/supabase/info'
import { Analytics } from '@vercel/analytics/react';


type Screen = 
  | 'welcome'
  | 'login'
  | 'signup'
  | 'lobby'
  | 'ready'
  | 'number-selection'
  | 'gameplay'
  | 'result'
  | 'history'
  | 'profile'
  | 'settings'

// Get singleton Supabase client
const supabaseClient = getSupabaseClient()

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome')
  const [user, setUser] = useState<any>(null)
  const [accessToken, setAccessToken] = useState<string>('')
  const [currentRoomId, setCurrentRoomId] = useState<string>('')
  const [isWinner, setIsWinner] = useState(false)

  // Check for existing session on mount and listen for auth changes (OAuth callback)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabaseClient.auth.getSession()

      if (session && !error) {
        setUser(session.user)
        setAccessToken(session.access_token)
        setCurrentScreen('lobby')
      }
    }

    checkSession()

    // Listen for auth state changes (handles OAuth redirects)
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user)
        setAccessToken(session.access_token)
        setCurrentScreen('lobby')
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setAccessToken('')
        setCurrentScreen('welcome')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Background room cleanup scheduler (runs every 2 minutes)
  useEffect(() => {
    const cleanupRooms = async () => {
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ea873bbf/cleanup-rooms`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        )
      } catch (error) {
        console.error('Room cleanup error:', error)
      }
    }

    // Run cleanup every 2 minutes
    const interval = setInterval(cleanupRooms, 2 * 60 * 1000)
    
    // Run immediately on mount
    cleanupRooms()
    
    return () => clearInterval(interval)
  }, [])

  const handleLoginSuccess = (userData: any, token: string) => {
    setUser(userData)
    setAccessToken(token)
    setCurrentScreen('lobby')
  }

  const handleSignUpSuccess = (userData: any, token: string) => {
    setUser(userData)
    setAccessToken(token)
    setCurrentScreen('lobby')
  }

  const handleRoomJoined = (roomId: string) => {
    setCurrentRoomId(roomId)
    setCurrentScreen('ready')
  }

  const handleBothReady = () => {
    setCurrentScreen('number-selection')
  }

  const handleGameStart = () => {
    setCurrentScreen('gameplay')
  }

  const handleGameEnd = (winner: boolean) => {
    setIsWinner(winner)
    setCurrentScreen('result')
  }

  const handlePlayAgain = () => {
    setCurrentRoomId('')
    setCurrentScreen('lobby')
  }

  const handleLogout = async () => {
    await supabaseClient.auth.signOut()
    setUser(null)
    setAccessToken('')
    setCurrentRoomId('')
    setCurrentScreen('welcome')
  }

  const handleBackToLobby = () => {
    setCurrentRoomId('')
    setCurrentScreen('lobby')
  }

  return (
    <>
      {currentScreen === 'welcome' && (
        <WelcomeScreen
          onLogin={() => setCurrentScreen('login')}
          onSignUp={() => setCurrentScreen('signup')}
        />
      )}

      {currentScreen === 'login' && (
        <LoginScreen
          onBack={() => setCurrentScreen('welcome')}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {currentScreen === 'signup' && (
        <SignUpScreen
          onBack={() => setCurrentScreen('welcome')}
          onSignUpSuccess={handleSignUpSuccess}
        />
      )}

      {currentScreen === 'lobby' && (
        <RoomsLobby
          accessToken={accessToken}
          userId={user?.id || ''}
          onRoomJoined={handleRoomJoined}
          onProfile={() => setCurrentScreen('profile')}
          onHistory={() => setCurrentScreen('history')}
          onSettings={() => setCurrentScreen('settings')}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === 'ready' && (
        <ReadyWaitingScreen
          roomId={currentRoomId}
          accessToken={accessToken}
          userId={user?.id || ''}
          onBothReady={handleBothReady}
          onBack={handleBackToLobby}
        />
      )}

      {currentScreen === 'number-selection' && (
        <NumberSelectionScreen
          roomId={currentRoomId}
          accessToken={accessToken}
          onGameStart={handleGameStart}
        />
      )}

      {currentScreen === 'gameplay' && (
        <GameplayScreen
          roomId={currentRoomId}
          accessToken={accessToken}
          userId={user?.id || ''}
          onGameEnd={handleGameEnd}
        />
      )}

      {currentScreen === 'result' && (
        <ResultScreen
          isWinner={isWinner}
          roomId={currentRoomId}
          accessToken={accessToken}
          userId={user?.id || ''}
          onPlayAgain={handlePlayAgain}
          onExit={handleBackToLobby}
        />
      )}

      {currentScreen === 'history' && (
        <GameHistoryScreen
          accessToken={accessToken}
          onBack={() => setCurrentScreen('lobby')}
        />
      )}

      {currentScreen === 'profile' && (
        <ProfileScreen
          userId={user?.id || ''}
          accessToken={accessToken}
          onBack={() => setCurrentScreen('lobby')}
        />
      )}

      {currentScreen === 'settings' && (
        <SettingsScreen
          onBack={() => setCurrentScreen('lobby')}
          onLogout={handleLogout}
        />
      )}

      <Toaster position="top-center" richColors />
      <Analytics />
    </>
  )
}
