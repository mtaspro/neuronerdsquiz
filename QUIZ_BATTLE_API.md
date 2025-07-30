# Quiz Battle - Real-time Multiplayer API Documentation

## Overview

The Quiz Battle feature enables real-time multiplayer quiz competitions where 2-6 users can join a battle room and race to complete a set of quiz questions. The system uses Socket.IO for real-time communication and provides a flexible scoring system based on speed and accuracy.

## Socket.IO Events

### Client to Server Events

#### `joinBattleRoom`
Join an existing battle room or create a new one.

**Parameters:**
```javascript
{
  roomId: string,      // Unique room identifier
  userId: string,      // User's unique ID
  username: string     // User's display name
}
```

**Server Response:**
- `roomJoined` - Successfully joined room
- `roomFull` - Room has reached maximum capacity (6 users)
- `battleInProgress` - Battle is already active or finished
- `error` - Other errors

#### `startBattle`
Start the quiz battle (only room creator can start).

**Parameters:**
```javascript
{
  roomId: string,
  questions: [
    {
      question: string,
      options: string[],
      correctAnswer: number  // Index of correct option (0-based)
    }
  ]
}
```

**Requirements:**
- Minimum 2 players in room
- Only the first user (room creator) can start
- Room must be in 'waiting' status

**Server Response:**
- `battleStarted` - Battle successfully started
- `error` - If requirements not met

#### `answerQuestion`
Submit an answer to the current question.

**Parameters:**
```javascript
{
  roomId: string,
  userId: string,
  questionIndex: number,  // 0-based question index
  answer: number,         // Selected option index
  isCorrect: boolean,     // Whether the answer is correct
  timeSpent: number       // Time spent in milliseconds
}
```

**Server Response:**
- `updateProgress` - Broadcast to all users with updated progress
- `userFinished` - When user completes all questions
- `battleEnded` - When all users finish

#### `setReady`
Set user's ready status.

**Parameters:**
```javascript
{
  roomId: string,
  userId: string,
  isReady: boolean
}
```

**Server Response:**
- `userReadyStatus` - Broadcast to all users

#### `leaveRoom`
Leave the battle room.

**Parameters:**
```javascript
{
  roomId: string,
  userId: string
}
```

**Server Response:**
- `userLeft` - Broadcast to remaining users

### Server to Client Events

#### `roomJoined`
Sent when user successfully joins a room.

```javascript
{
  roomId: string,
  users: [
    {
      id: string,
      username: string,
      isReady: boolean
    }
  ],
  status: 'waiting' | 'active' | 'finished'
}
```

#### `userJoined`
Broadcast when a new user joins the room.

```javascript
{
  userId: string,
  username: string,
  totalUsers: number
}
```

#### `battleStarted`
Sent when battle begins.

```javascript
{
  questions: Array,
  startTime: Date,
  totalQuestions: number
}
```

#### `updateProgress`
Broadcast when a user submits an answer.

```javascript
{
  userId: string,
  username: string,
  currentQuestion: number,
  score: number,
  totalQuestions: number
}
```

#### `userFinished`
Broadcast when a user completes all questions.

```javascript
{
  userId: string,
  username: string,
  finalScore: number,
  totalTime: number
}
```

#### `battleEnded`
Sent when all users finish the battle.

```javascript
{
  results: [
    {
      userId: string,
      username: string,
      score: number,
      totalTime: number,
      answers: Array,
      correctAnswers: number,
      totalQuestions: number
    }
  ],
  questions: Array,
  startTime: Date,
  endTime: Date
}
```

#### `userReadyStatus`
Broadcast when user changes ready status.

```javascript
{
  userId: string,
  username: string,
  isReady: boolean
}
```

#### `userLeft`
Broadcast when user leaves the room.

```javascript
{
  userId: string,
  username: string,
  totalUsers: number
}
```

#### `error`
Error messages.

```javascript
{
  message: string
}
```

## REST API Endpoints

### GET `/api/battle-rooms`
Get list of all active battle rooms.

**Response:**
```javascript
[
  {
    id: string,
    userCount: number,
    status: 'waiting' | 'active' | 'finished',
    maxUsers: number
  }
]
```

### GET `/api/battle-rooms/:roomId`
Get detailed status of a specific room.

**Response:**
```javascript
{
  id: string,
  userCount: number,
  status: string,
  maxUsers: number,
  users: [
    {
      id: string,
      username: string,
      isReady: boolean,
      currentQuestion: number,
      score: number
    }
  ]
}
```

## Scoring System

The scoring system rewards both accuracy and speed:

- **Base Score**: 100 points for correct answers
- **Speed Bonus**: Up to 50 points based on response time
  - Formula: `Math.max(0, 50 - Math.floor(timeSpent / 1000))`
  - Faster responses earn higher bonuses

## Room Management

### Room States
- `waiting` - Room is waiting for players to join and get ready
- `active` - Battle is in progress
- `finished` - Battle has completed

### Room Limits
- **Maximum Users**: 6 per room
- **Minimum Users**: 2 to start a battle
- **Auto-cleanup**: Inactive rooms are removed after 1 hour

### User Management
- Users can join/leave rooms freely
- Room creator (first user) has permission to start the battle
- Disconnected users are automatically removed from rooms

## Error Handling

The system handles various error scenarios:

- **Room Full**: When trying to join a room with 6 users
- **Battle In Progress**: When trying to join an active/finished battle
- **Insufficient Players**: When trying to start with less than 2 players
- **Unauthorized Start**: When non-creator tries to start battle
- **Invalid Room**: When referencing non-existent rooms

## Implementation Notes

### BattleService Class
The backend uses a dedicated `BattleService` class to manage:
- Room creation and deletion
- User management
- Battle state tracking
- Score calculation
- Result generation

### Real-time Updates
All progress updates are broadcast to all users in the room, providing:
- Live progress tracking
- Real-time score updates
- Immediate feedback on user actions

### Connection Management
- Automatic cleanup of disconnected users
- Room deletion when empty
- Periodic cleanup of inactive rooms

## Testing

Use the provided `test-socket.js` file to test the Socket.IO functionality:

```bash
node test-socket.js
```

This will test:
- Connection establishment
- Room joining
- Battle starting
- Answer submission
- Proper cleanup 