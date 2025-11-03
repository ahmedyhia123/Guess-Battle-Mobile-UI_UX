import { useState, useEffect } from 'react'
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
import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './utils/supabase/info'

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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome')
  const [user, setUser] = useState<any>(null)
  const [accessToken, setAccessToken] = useState<string>('')
  const [currentRoomId, setCurrentRoomId] = useState<string>('')
  const [isWinner, setIsWinner] = useState(false)

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      )

      const { data: { session }, error } = await supabase.auth.getSession()

      if (session && !error) {
        setUser(session.user)
        setAccessToken(session.access_token)
        setCurrentScreen('lobby')
      }
    }

    checkSession()
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
    const supabase = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    )

    await supabase.auth.signOut()
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
    </>
  )
}
