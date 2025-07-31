// Simple Socket.IO client test
import { io } from 'socket.io-client';

const socket = io(process.env.VITE_SOCKET_SERVER_URL || 'http://localhost:5000');

socket.on('connect', () => {
  console.log('✅ Connected to server');
  
  // Test joining a room
  socket.emit('joinBattleRoom', {
    roomId: 'test-room-1',
    userId: 'test-user-1',
    username: 'TestUser1'
  });
});

socket.on('roomJoined', (data) => {
  console.log('✅ Joined room:', data);
});

socket.on('userJoined', (data) => {
  console.log('👤 User joined:', data);
});

socket.on('error', (data) => {
  console.log('❌ Error:', data);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

// Test room creation and joining
setTimeout(() => {
  console.log('🧪 Testing room operations...');
  
  // Test starting a battle
  socket.emit('startBattle', {
    roomId: 'test-room-1',
    questions: [
      {
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1
      },
      {
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 2
      }
    ]
  });
}, 2000);

// Test answering a question
setTimeout(() => {
  console.log('🧪 Testing answer submission...');
  
  socket.emit('answerQuestion', {
    roomId: 'test-room-1',
    userId: 'test-user-1',
    questionIndex: 0,
    answer: 1,
    isCorrect: true,
    timeSpent: 5000
  });
}, 4000);

// Cleanup after 10 seconds
setTimeout(() => {
  console.log('🧹 Cleaning up...');
  socket.disconnect();
  process.exit(0);
}, 10000); 