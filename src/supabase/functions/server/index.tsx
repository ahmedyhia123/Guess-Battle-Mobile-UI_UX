import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', logger(console.log))
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

// Sign up
app.post('/make-server-ea873bbf/signup', async (c) => {
  try {
    const { email, password, fullName, profilePicture } = await c.req.json()
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        full_name: fullName,
        profile_picture: profilePicture || null,
      },
      email_confirm: true, // Auto-confirm since email server not configured
    })

    if (authError) {
      console.log('Sign up auth error:', authError)
      return c.json({ error: authError.message }, 400)
    }

    // Create user profile in KV store
    const userId = authData.user.id
    const userProfile = {
      id: userId,
      email,
      fullName,
      profilePicture: profilePicture || null,
      level: 1,
      wins: 0,
      losses: 0,
      totalGames: 0,
      accuracy: 0,
      createdAt: new Date().toISOString(),
    }

    await kv.set(`user:${userId}`, userProfile)

    return c.json({ 
      success: true, 
      user: authData.user,
      profile: userProfile,
    })
  } catch (error) {
    console.log('Sign up error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get user profile
app.get('/make-server-ea873bbf/profile/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const profile = await kv.get(`user:${userId}`)
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404)
    }

    return c.json({ profile })
  } catch (error) {
    console.log('Get profile error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Update user profile
app.post('/make-server-ea873bbf/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { fullName, profilePicture } = await c.req.json()
    const profile = await kv.get(`user:${user.id}`)
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404)
    }

    const updatedProfile = {
      ...profile,
      fullName: fullName || profile.fullName,
      profilePicture: profilePicture !== undefined ? profilePicture : profile.profilePicture,
    }

    await kv.set(`user:${user.id}`, updatedProfile)

    return c.json({ success: true, profile: updatedProfile })
  } catch (error) {
    console.log('Update profile error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Create room
app.post('/make-server-ea873bbf/rooms', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { roomName, password, isPublic, digitCount } = await c.req.json()
    const roomId = crypto.randomUUID().slice(0, 8).toUpperCase()
    const userProfile = await kv.get(`user:${user.id}`)

    // Validate digit count
    const validDigitCount = digitCount && digitCount >= 3 && digitCount <= 8 ? digitCount : 4

    const room = {
      id: roomId,
      name: roomName,
      password: password || null,
      isPublic: isPublic !== false,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      digitCount: validDigitCount, // Host-controlled number length
      players: [
        {
          id: user.id,
          fullName: userProfile?.fullName || 'Player',
          profilePicture: userProfile?.profilePicture || null,
          ready: false,
          secretNumber: null,
          guesses: [],
        }
      ],
      status: 'waiting', // waiting, playing, finished
      currentTurn: 0, // Index of player whose turn it is (0 or 1)
      round: 1, // Current round number
      turnStartTime: null, // Timestamp when current turn started
      turnDeadline: null, // Timestamp when current turn expires
      winner: null,
      startedAt: null,
      finishedAt: null,
      lastActivity: new Date().toISOString(), // Track last activity for auto-cleanup
    }

    await kv.set(`room:${roomId}`, room)

    // Add to public rooms list if public
    if (room.isPublic) {
      const publicRooms = await kv.get('public_rooms') || []
      publicRooms.push({
        id: roomId,
        name: roomName,
        playerCount: 1,
        createdBy: userProfile?.fullName || 'Player',
        digitCount: validDigitCount,
      })
      await kv.set('public_rooms', publicRooms)
    }

    return c.json({ success: true, room })
  } catch (error) {
    console.log('Create room error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get all public rooms
app.get('/make-server-ea873bbf/rooms', async (c) => {
  try {
    const publicRooms = await kv.get('public_rooms') || []
    return c.json({ rooms: publicRooms })
  } catch (error) {
    console.log('Get rooms error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get room details
app.get('/make-server-ea873bbf/rooms/:roomId', async (c) => {
  try {
    const roomId = c.req.param('roomId')
    const room = await kv.get(`room:${roomId}`)
    
    if (!room) {
      return c.json({ error: 'Room not found' }, 404)
    }

    return c.json({ room })
  } catch (error) {
    console.log('Get room error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Join room
app.post('/make-server-ea873bbf/rooms/:roomId/join', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const roomId = c.req.param('roomId')
    const { password } = await c.req.json()
    const room = await kv.get(`room:${roomId}`)

    if (!room) {
      return c.json({ error: 'Room not found' }, 404)
    }

    if (room.players.length >= 2) {
      return c.json({ error: 'Room is full' }, 400)
    }

    if (room.password && room.password !== password) {
      return c.json({ error: 'Incorrect password' }, 403)
    }

    if (room.players.some((p: any) => p.id === user.id)) {
      return c.json({ error: 'Already in room' }, 400)
    }

    const userProfile = await kv.get(`user:${user.id}`)

    room.players.push({
      id: user.id,
      fullName: userProfile?.fullName || 'Player',
      profilePicture: userProfile?.profilePicture || null,
      ready: false,
      secretNumber: null,
      guesses: [],
    })

    room.lastActivity = new Date().toISOString()

    await kv.set(`room:${roomId}`, room)

    // Update public rooms list
    if (room.isPublic) {
      const publicRooms = await kv.get('public_rooms') || []
      const updatedRooms = publicRooms.map((r: any) => 
        r.id === roomId ? { ...r, playerCount: room.players.length } : r
      )
      await kv.set('public_rooms', updatedRooms)
    }

    return c.json({ success: true, room })
  } catch (error) {
    console.log('Join room error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Set ready status
app.post('/make-server-ea873bbf/rooms/:roomId/ready', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const roomId = c.req.param('roomId')
    const { ready } = await c.req.json()
    const room = await kv.get(`room:${roomId}`)

    if (!room) {
      return c.json({ error: 'Room not found' }, 404)
    }

    const playerIndex = room.players.findIndex((p: any) => p.id === user.id)
    if (playerIndex === -1) {
      return c.json({ error: 'Not in this room' }, 403)
    }

    room.players[playerIndex].ready = ready

    await kv.set(`room:${roomId}`, room)

    return c.json({ success: true, room })
  } catch (error) {
    console.log('Set ready error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Set secret number
app.post('/make-server-ea873bbf/rooms/:roomId/set-number', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const roomId = c.req.param('roomId')
    const { secretNumber } = await c.req.json()
    const room = await kv.get(`room:${roomId}`)

    if (!room) {
      return c.json({ error: 'Room not found' }, 404)
    }

    const playerIndex = room.players.findIndex((p: any) => p.id === user.id)
    if (playerIndex === -1) {
      return c.json({ error: 'Not in this room' }, 403)
    }

    // Validate secret number length matches room's digit count
    if (secretNumber.length !== room.digitCount) {
      return c.json({ error: `Secret number must be exactly ${room.digitCount} digits` }, 400)
    }

    room.players[playerIndex].secretNumber = secretNumber
    room.lastActivity = new Date().toISOString()

    // Check if both players have set their numbers
    if (room.players.length === 2 && room.players.every((p: any) => p.secretNumber)) {
      room.status = 'playing'
      room.startedAt = new Date().toISOString()
      room.currentTurn = 0 // Player 1 starts
      room.round = 1
      
      // Set turn timer (30 seconds)
      const now = new Date()
      room.turnStartTime = now.toISOString()
      room.turnDeadline = new Date(now.getTime() + 30000).toISOString()
    }

    await kv.set(`room:${roomId}`, room)

    return c.json({ success: true, room })
  } catch (error) {
    console.log('Set number error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Make a guess
app.post('/make-server-ea873bbf/rooms/:roomId/guess', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const roomId = c.req.param('roomId')
    const { guess } = await c.req.json()
    const room = await kv.get(`room:${roomId}`)

    if (!room) {
      return c.json({ error: 'Room not found' }, 404)
    }

    if (room.status !== 'playing') {
      return c.json({ error: 'Game not in progress' }, 400)
    }

    const playerIndex = room.players.findIndex((p: any) => p.id === user.id)
    if (playerIndex === -1) {
      return c.json({ error: 'Not in this room' }, 403)
    }

    // Check if it's this player's turn
    if (room.currentTurn !== playerIndex) {
      return c.json({ error: 'Not your turn' }, 400)
    }

    // Validate guess length
    if (guess.length !== room.digitCount) {
      return c.json({ error: `Guess must be exactly ${room.digitCount} digits` }, 400)
    }

    // Update last activity
    room.lastActivity = new Date().toISOString()

    const opponentIndex = playerIndex === 0 ? 1 : 0
    const opponentNumber = room.players[opponentIndex].secretNumber

    // Calculate feedback
    const guessArray = guess.split('')
    const secretArray = opponentNumber.split('')
    
    let correctPosition = 0
    let correctDigit = 0
    const usedSecret: boolean[] = new Array(secretArray.length).fill(false)
    const usedGuess: boolean[] = new Array(guessArray.length).fill(false)

    // First pass: check correct positions
    for (let i = 0; i < guessArray.length; i++) {
      if (guessArray[i] === secretArray[i]) {
        correctPosition++
        usedSecret[i] = true
        usedGuess[i] = true
      }
    }

    // Second pass: check correct digits in wrong positions
    for (let i = 0; i < guessArray.length; i++) {
      if (!usedGuess[i]) {
        for (let j = 0; j < secretArray.length; j++) {
          if (!usedSecret[j] && guessArray[i] === secretArray[j]) {
            correctDigit++
            usedSecret[j] = true
            break
          }
        }
      }
    }

    const guessResult = {
      guess,
      correctPosition,
      correctDigit,
      timestamp: new Date().toISOString(),
    }

    room.players[playerIndex].guesses.push(guessResult)

    // Check if player won
    const isWinner = correctPosition === secretArray.length
    
    if (isWinner) {
      room.status = 'finished'
      room.winner = user.id
      room.finishedAt = new Date().toISOString()

      // Update player stats
      const winnerProfile = await kv.get(`user:${user.id}`)
      const loserProfile = await kv.get(`user:${room.players[opponentIndex].id}`)

      if (winnerProfile) {
        winnerProfile.wins++
        winnerProfile.totalGames++
        winnerProfile.accuracy = (winnerProfile.wins / winnerProfile.totalGames) * 100
        await kv.set(`user:${user.id}`, winnerProfile)
      }

      if (loserProfile) {
        loserProfile.losses++
        loserProfile.totalGames++
        loserProfile.accuracy = (loserProfile.wins / loserProfile.totalGames) * 100
        await kv.set(`user:${room.players[opponentIndex].id}`, loserProfile)
      }

      // Save game history for both players
      const gameRecord = {
        id: crypto.randomUUID(),
        roomId,
        opponentId: room.players[opponentIndex].id,
        opponentName: room.players[opponentIndex].fullName,
        result: 'win',
        rounds: room.players[playerIndex].guesses.length,
        timestamp: new Date().toISOString(),
      }

      const opponentGameRecord = {
        id: crypto.randomUUID(),
        roomId,
        opponentId: user.id,
        opponentName: room.players[playerIndex].fullName,
        result: 'loss',
        rounds: room.players[opponentIndex].guesses.length,
        timestamp: new Date().toISOString(),
      }

      const winnerHistory = await kv.get(`history:${user.id}`) || []
      winnerHistory.unshift(gameRecord)
      await kv.set(`history:${user.id}`, winnerHistory)

      const loserHistory = await kv.get(`history:${room.players[opponentIndex].id}`) || []
      loserHistory.unshift(opponentGameRecord)
      await kv.set(`history:${room.players[opponentIndex].id}`, loserHistory)

      // Remove from public rooms
      if (room.isPublic) {
        const publicRooms = await kv.get('public_rooms') || []
        const updatedRooms = publicRooms.filter((r: any) => r.id !== roomId)
        await kv.set('public_rooms', updatedRooms)
      }
    } else {
      // Not a winner - switch turns
      room.currentTurn = opponentIndex
      // Increment round after both players have had a turn
      if (room.currentTurn === 0) {
        room.round++
      }
      
      // Set new turn timer (30 seconds)
      const now = new Date()
      room.turnStartTime = now.toISOString()
      room.turnDeadline = new Date(now.getTime() + 30000).toISOString()
    }

    await kv.set(`room:${roomId}`, room)

    return c.json({ 
      success: true, 
      room,
      feedback: guessResult,
      isWinner,
    })
  } catch (error) {
    console.log('Guess error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get game history
app.get('/make-server-ea873bbf/history', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const history = await kv.get(`history:${user.id}`) || []

    return c.json({ history })
  } catch (error) {
    console.log('Get history error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get user stats
app.get('/make-server-ea873bbf/stats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const profile = await kv.get(`user:${user.id}`)

    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404)
    }

    return c.json({ 
      stats: {
        wins: profile.wins,
        losses: profile.losses,
        totalGames: profile.totalGames,
        accuracy: profile.accuracy,
        level: profile.level,
      }
    })
  } catch (error) {
    console.log('Get stats error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Skip turn (when timer expires)
app.post('/make-server-ea873bbf/rooms/:roomId/skip-turn', async (c) => {
  try {
    const roomId = c.req.param('roomId')
    const room = await kv.get(`room:${roomId}`)

    if (!room) {
      return c.json({ error: 'Room not found' }, 404)
    }

    if (room.status !== 'playing') {
      return c.json({ error: 'Game not in progress' }, 400)
    }

    // Check if turn has actually expired
    const now = new Date()
    const deadline = new Date(room.turnDeadline)
    
    if (now < deadline) {
      return c.json({ error: 'Turn has not expired yet' }, 400)
    }

    // Switch to opponent's turn
    const opponentIndex = room.currentTurn === 0 ? 1 : 0
    room.currentTurn = opponentIndex
    
    // Increment round after both players have had a turn
    if (room.currentTurn === 0) {
      room.round++
    }
    
    // Set new turn timer
    room.turnStartTime = now.toISOString()
    room.turnDeadline = new Date(now.getTime() + 30000).toISOString()
    room.lastActivity = now.toISOString()

    await kv.set(`room:${roomId}`, room)

    return c.json({ 
      success: true, 
      room,
      skipped: true,
    })
  } catch (error) {
    console.log('Skip turn error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Cleanup inactive rooms
app.post('/make-server-ea873bbf/cleanup-rooms', async (c) => {
  try {
    const publicRooms = await kv.get('public_rooms') || []
    const roomsToCheck = publicRooms.map((r: any) => r.id)
    
    const now = new Date()
    const cleanedRooms: string[] = []
    
    for (const roomId of roomsToCheck) {
      const room = await kv.get(`room:${roomId}`)
      if (!room) continue
      
      const lastActivity = new Date(room.lastActivity || room.createdAt)
      const timeSinceActivity = now.getTime() - lastActivity.getTime()
      
      // Delete if:
      // 1. Waiting status and no activity for 5 minutes
      // 2. Playing status and no activity for 10 minutes  
      // 3. Finished status and 30 seconds have passed
      let shouldDelete = false
      
      if (room.status === 'waiting' && timeSinceActivity > 5 * 60 * 1000) {
        shouldDelete = true
      } else if (room.status === 'playing' && timeSinceActivity > 10 * 60 * 1000) {
        shouldDelete = true
      } else if (room.status === 'finished' && room.finishedAt) {
        const timeSinceFinish = now.getTime() - new Date(room.finishedAt).getTime()
        if (timeSinceFinish > 30 * 1000) {
          shouldDelete = true
        }
      }
      
      if (shouldDelete) {
        await kv.del(`room:${roomId}`)
        cleanedRooms.push(roomId)
      }
    }
    
    // Update public rooms list
    if (cleanedRooms.length > 0) {
      const updatedPublicRooms = publicRooms.filter((r: any) => !cleanedRooms.includes(r.id))
      await kv.set('public_rooms', updatedPublicRooms)
    }
    
    return c.json({ 
      success: true, 
      cleanedCount: cleanedRooms.length,
      cleanedRooms,
    })
  } catch (error) {
    console.log('Cleanup rooms error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

Deno.serve(app.fetch)
