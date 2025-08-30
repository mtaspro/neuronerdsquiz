import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaTrophy, FaUsers, FaClock, FaCheck, FaTimes } from 'react-icons/fa';
import BattleNotification from '../components/BattleNotification';
import { useSocket, battleSocketHelpers } from '../utils/socketManager';
import { useNotification } from '../components/NotificationSystem';
import useExamSecurity from '../hooks/useExamSecurity';
import SecurityWarning from '../components/SecurityWarning';
import SecurityInitModal from '../components/SecurityInitModal';
import MathText from '../components/MathText';
import soundManager from '../utils/soundUtils';
import LifelineTools from '../components/LifelineTools';
import { useLifelines } from '../hooks/useLifelines';
import { secureStorage } from '../utils/secureStorage.js';
import LoadingAnimation from '../components/LoadingAnimation';
import axios from 'axios';

const QuizBattleRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: showError, info } = useNotification();
  
  // Get selected chapter from navigation state
  const selectedChapter = location.state?.chapter;
  
  // Use the new socket hook with component-specific ID
  const socket = useSocket(`battle-room-${roomId}`);
  
  const [connected, setConnected] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [battleStarted, setBattleStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [battleEnded, setBattleEnded] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  // Security system state
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityActive, setSecurityActive] = useState(false);
  const [currentViolation, setCurrentViolation] = useState(null);
  const [securityInitialized, setSecurityInitialized] = useState(false);
  
  // Lifeline states
  const [lifelineConfig, setLifelineConfig] = useState(null);
  const [hiddenOptions, setHiddenOptions] = useState(new Set());
  const [helpUsed, setHelpUsed] = useState(false);
  
  // Initialize lifelines
  const {
    usedCounts,
    lifelineEffects,
    canUseLifeline,
    useLifeline,
    resetLifelines
  } = useLifelines(lifelineConfig);

  // Security system hook
  const {
    warnings,
    maxWarnings,
    isFullscreen,
    securityStatus,
    initializeSecurity,
    cleanupSecurity,
    remainingWarnings,
    enterFullscreen
  } = useExamSecurity({
    isActive: securityActive,
    onSecurityViolation: (violation) => {
      console.log('Battle security violation:', violation);
      setCurrentViolation(violation);
    },
    onAutoSubmit: (reason) => {
      console.log('Battle auto-submit triggered:', reason);
      showError(`Battle auto-ended due to security violations: ${reason.reason}`);
      handleLeaveRoom();
    },
    maxWarnings: 3,
    enableFullscreen: true,
    enableTabSwitchDetection: true,
    enableRightClickBlock: true,
    enableDevToolsBlock: true,
    enableExitConfirmation: true
  });

  // Get user data from secureStorage
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await secureStorage.getUserData();
        if (!user?._id) {
          navigate('/login');
          return;
        }
        setUserData(user);
      } catch (error) {
        console.error('Failed to load user data:', error);
        navigate('/login');
      }
    };
    
    loadUserData();
  }, [navigate]);

  useEffect(() => {
    if (!userData?._id || !socket) {
      return;
    }

    let isInitialized = false;

    const initializeSocket = async () => {
      if (isInitialized) return;
      isInitialized = true;

      try {
        // Clear any existing listeners first
        socket.removeAllListeners();

        // Set up event handlers
        socket.addListener('connect', () => {
          setConnected(true);
          info('Connected to battle server');
          const username = userData.username || userData.email?.split('@')[0] || 'User';
          socket.battleHelpers.joinRoom(roomId, userData._id, username);
        });

        socket.addListener('roomJoined', (data) => {
          setRoomData(data);
          setUsers(data.users);
          success(`Joined battle room: ${roomId}`);
          
          if (data.users.length > 0 && data.users[0].id === userData._id) {
            setIsRoomCreator(true);
            info('You are the room creator');
          }

          if (!securityInitialized) {
            setShowSecurityModal(true);
          }
        });

        socket.addListener('userJoined', (data) => {
          // Only show notification if it's not the current user
          if (data.userId !== userData._id) {
            setUsers(prev => {
              const exists = prev.some(user => user.id === data.userId);
              if (exists) return prev;
              return [...prev, { id: data.userId, username: data.username, isReady: false }];
            });
            addNotification('user-joined', 'Player Joined', `${data.username} joined the battle!`);
          }
        });

        socket.addListener('userLeft', (data) => {
          setUsers(prev => prev.filter(user => user.id !== data.userId));
          addNotification('user-left', 'Player Left', `${data.username} left the battle.`);
        });

        socket.addListener('userReadyStatus', (data) => {
          setUsers(prev => prev.map(user => 
            user.id === data.userId ? { ...user, isReady: data.isReady } : user
          ));
        });

        socket.addListener('battleStarted', async (data) => {
          setBattleStarted(true);
          setQuestions(data.questions);
          setCurrentQuestion(0);
          setQuestionStartTime(Date.now());
          
          // Load lifeline configuration for battle
          try {
            const apiUrl = import.meta.env.VITE_API_URL || '';
            const lifelineResponse = await axios.get(`${apiUrl}/api/quizzes/lifeline-config?isBattle=true`);
            setLifelineConfig(lifelineResponse.data);
          } catch (err) {
            console.error('Failed to load lifeline config for battle:', err);
          }
          
          addNotification('battle-started', 'Battle Started!', 'The quiz battle has begun!');
          success('Battle has started! Good luck!');
        });

        socket.addListener('updateProgress', (data) => {
          setUsers(prev => prev.map(user => 
            user.id === data.userId 
              ? { ...user, currentQuestion: data.currentQuestion, score: data.score }
              : user
          ));
        });

        socket.addListener('userFinished', (data) => {
          addNotification('user-finished', 'Player Finished!', `${data.username} completed the quiz!`);
        });

        socket.addListener('battleEnded', async (data) => {
          setBattleEnded(true);
          setResults(data.results || []);
          
          const currentUserResult = userData?._id && data.results ? data.results.find(r => r.userId === userData._id) : null;
          const isWinner = currentUserResult && userData?._id && data.results && data.results[0] && data.results[0].userId === userData._id;
          soundManager.play(isWinner ? 'battleWin' : 'battleLose');
          
          if (currentUserResult && userData?._id) {
            submitBattleScore(currentUserResult.score, isWinner);
          }
          
          addNotification('battle-ended', 'Battle Complete!', 'The quiz battle has ended!');
          success('Battle completed! Check your results!');
        });

        socket.addListener('error', (data) => {
          console.error('Socket error:', data);
          // Don't set error state or redirect for room creator start errors
          if (data.message && data.message.includes('Only room creator can start')) {
            console.log('Ignoring room creator error - battle may have started successfully');
            return;
          }
          setError(data.message);
          showError(`Battle error: ${data.message}`);
        });

        socket.addListener('connect_error', (error) => {
          setError('Failed to connect to battle server');
          showError('Failed to connect to battle server. Please check your connection.');
        });

        socket.addListener('disconnect', (reason) => {
          setConnected(false);
          if (reason !== 'io client disconnect') {
            showError('Disconnected from battle server');
          }
        });

        socket.addListener('chatMessage', (data) => {
          setChatMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            username: data.username,
            message: data.message,
            timestamp: new Date()
          }]);
        });

        await socket.connect();
        
        const connectionInfo = socket.getConnectionInfo();
        if (connectionInfo.connected) {
          setConnected(true);
          const username = userData.username || userData.email?.split('@')[0] || 'User';
          socket.battleHelpers.joinRoom(roomId, userData._id, username);
        }

      } catch (error) {
        console.error('Failed to initialize socket:', error);
        setError('Failed to connect to battle server');
        showError('Failed to connect to battle server. Please check your connection.');
      }
    };

    initializeSocket();

    return () => {
      if (socket) {
        socket.removeAllListeners();
      }
    };
  }, [roomId, userData?._id]);

  // Timer effect for tracking time spent on current question
  useEffect(() => {
    let interval;
    if (battleStarted && questionStartTime && !answered) {
      interval = setInterval(() => {
        setTimeSpent(Date.now() - questionStartTime);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [battleStarted, questionStartTime, answered]);

  const handleReadyToggle = () => {
    if (!userData?._id) return;
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    battleSocketHelpers.setReady(roomId, userData._id, newReadyState);
  };

  const handleStartBattle = async () => {
    try {
      soundManager.play('battleStart');
      let questionsToUse = [];
      
      // Try to fetch questions from the selected chapter
      if (selectedChapter) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const token = secureStorage.getToken();
          
          // First, get the quiz config for this chapter to know how many questions to use
          let battleQuestionCount = 10; // Default
          try {
            const configResponse = await fetch(`${apiUrl}/api/admin/quiz-config/${encodeURIComponent(selectedChapter)}`);
            if (configResponse.ok) {
              const config = await configResponse.json();
              battleQuestionCount = config.battleQuestions || 10;
              console.log(`📊 Using ${battleQuestionCount} questions for battle (from quiz config)`);
            }
          } catch (configError) {
            console.warn('Could not fetch quiz config, using default 10 questions:', configError);
          }
          
          // Fetch ALL questions from chapter (not filtered by user progress)
          const response = await fetch(`${apiUrl}/api/quizzes?chapter=${encodeURIComponent(selectedChapter)}`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : ''
            }
          });
          
          if (response.ok) {
            const chapterQuestions = await response.json();
            
            if (chapterQuestions && chapterQuestions.length > 0) {
              // Shuffle questions and take the configured number for battle
              const shuffled = chapterQuestions.sort(() => 0.5 - Math.random());
              const questionsToTake = Math.min(battleQuestionCount, chapterQuestions.length);
              
              // Transform questions to match battle format
              questionsToUse = shuffled.slice(0, questionsToTake).map(q => ({
                _id: q._id,
                question: q.question,
                options: q.options,
                correctAnswer: q.options.indexOf(q.correctAnswer),
                explanation: q.explanation
              }));
              
              success(`Loaded ${questionsToUse.length} random questions from ${selectedChapter} (Config: ${battleQuestionCount})`);
            } else {
              showError(`No questions found in ${selectedChapter}`);
            }
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.error('Failed to fetch chapter questions:', error);
          showError(`Failed to load questions from ${selectedChapter}: ${error.message}`);
        }
      }
      
      // Prevent battle start if no questions loaded
      if (questionsToUse.length === 0) {
        showError(`Cannot start battle: No questions available${selectedChapter ? ` for chapter "${selectedChapter}"` : ''}. Please select a different chapter or contact admin.`);
        return;
      }
      
      // Ensure minimum 5 questions for battle
      if (questionsToUse.length < 5) {
        showError(`Cannot start battle: Only ${questionsToUse.length} questions available in "${selectedChapter}". Need at least 5 questions.`);
        return;
      }

      // Mark battle as started in backend
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        await fetch(`${apiUrl}/api/battle/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secureStorage.getToken()}`
          },
          body: JSON.stringify({ roomId })
        });
      } catch (error) {
        console.error('Failed to mark battle as started:', error);
      }
      
      battleSocketHelpers.startBattle(roomId, questionsToUse, userData._id);
    } catch (error) {
      console.error('Error starting battle:', error);
      showError('Failed to start battle. Please try again.');
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    if (answered) return;
    // In battle mode, once an answer is selected, it cannot be changed
    if (selectedAnswer !== null) return;
    soundManager.play('click');
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || answered) return;

    const isCorrect = selectedAnswer === questions?.[currentQuestion]?.correctAnswer;
    const finalTimeSpent = Date.now() - questionStartTime;
    const lifelineUsed = helpUsed ? 'help' : null;

    // Play sound based on answer
    soundManager.play(isCorrect ? 'correctAnswer' : 'wrongAnswer');

    if (userData?._id) {
      battleSocketHelpers.submitAnswer(
        roomId,
        userData._id,
        currentQuestion,
        selectedAnswer,
        isCorrect,
        finalTimeSpent,
        selectedChapter,
        lifelineUsed
      );
    }

    setAnswered(true);
    setTimeSpent(finalTimeSpent);
  };

  // Handle lifeline usage in battle
  const handleUseLifeline = (type) => {
    const currentQuestionId = questions?.[currentQuestion]?._id || `battle-q-${currentQuestion}`;
    
    if (!useLifeline(type, currentQuestionId)) {
      showError('Cannot use this lifeline anymore');
      return;
    }
    
    switch (type) {
      case 'skip':
        // Skip to next question without penalty
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(prev => prev + 1);
          setSelectedAnswer(null);
          setAnswered(false);
          setQuestionStartTime(Date.now());
          setTimeSpent(0);
          setHelpUsed(false);
          setHiddenOptions(new Set());
        }
        break;
        
      case 'help':
        // Show correct answer
        const correctIndex = questions?.[currentQuestion]?.correctAnswer;
        setSelectedAnswer(correctIndex);
        setHelpUsed(true);
        success('Correct answer revealed! Score will be reduced by 50%');
        break;
        
      case 'fiftyFifty':
        // Hide 2 wrong options
        const correctIdx = questions?.[currentQuestion]?.correctAnswer;
        const wrongIndices = questions?.[currentQuestion]?.options
          ?.map((_, idx) => idx)
          .filter(idx => idx !== correctIdx) || [];
        
        // Randomly select 2 wrong options to hide
        const shuffled = wrongIndices.sort(() => 0.5 - Math.random());
        const toHide = shuffled.slice(0, 2);
        setHiddenOptions(new Set(toHide));
        success('2 wrong options removed!');
        break;
        
      case 'extraTime':
        // Extra time not available in battles
        showError('Extra time is not available in battle mode');
        break;
    }
  };
  
  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      soundManager.play('questionNext');
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      setQuestionStartTime(Date.now());
      setTimeSpent(0);
      setHelpUsed(false);
      setHiddenOptions(new Set());
    }
  };

  // Security handlers
  const handleSecurityAccept = async () => {
    try {
      setSecurityActive(true);
      await initializeSecurity();
      setSecurityInitialized(true);
      setShowSecurityModal(false);
    } catch (error) {
      console.error('Security initialization error:', error);
      setSecurityInitialized(true);
      setShowSecurityModal(false);
    }
  };

  const handleSecurityCancel = () => {
    setShowSecurityModal(false);
    navigate('/dashboard');
  };

  const handleViolationDismiss = () => {
    setCurrentViolation(null);
  };

  // Cleanup security on unmount
  useEffect(() => {
    return () => {
      if (securityActive) {
        cleanupSecurity();
      }
    };
  }, [securityActive, cleanupSecurity]);

  // Cleanup on component unmount (browser close, navigation, etc.)
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (userData?._id && isRoomCreator && !battleStarted) {
        // Use navigator.sendBeacon for reliable cleanup on page unload
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const data = JSON.stringify({ roomId, userId: userData._id });
        
        try {
          navigator.sendBeacon(`${apiUrl}/api/battle/expire`, data);
        } catch (error) {
          console.error('Failed to expire battle room on unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Don't call handleLeaveRoom on unmount to prevent interfering with battle start
    };
  }, [userData?._id, isRoomCreator, battleStarted, roomId]);

  const handleLeaveRoom = async () => {
    if (userData?._id) {
      battleSocketHelpers.leaveRoom(roomId, userData._id);
      
      // If user is room creator and battle hasn't started, expire the room
      if (isRoomCreator && !battleStarted) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          await fetch(`${apiUrl}/api/battle/expire`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${secureStorage.getToken()}`
            },
            body: JSON.stringify({ roomId, userId: userData._id })
          });
        } catch (error) {
          console.error('Failed to expire battle room:', error);
        }
      }
    }
    navigate('/dashboard');
  };

  const submitBattleScore = async (score, won) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      
      const response = await fetch(`${apiUrl}/api/battle-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score, won })
      });
      
      if (response.ok) {
        console.log('✅ Battle score submitted successfully');
        success('Battle score updated on leaderboard!');
      } else {
        console.error('❌ Failed to submit battle score:', response.statusText);
        showError('Failed to update battle leaderboard');
      }
    } catch (error) {
      console.error('❌ Error submitting battle score:', error);
      showError('Error updating battle leaderboard');
    }
  };

  const addNotification = (type, title, message) => {
    const id = Date.now() + Math.random();
    const notification = { id, type, title, message };
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !connected) return;
    
    console.log('Sending chat message:', newMessage);
    socket.emit('sendChatMessage', {
      roomId,
      username: userData.username || userData.email?.split('@')[0] || 'User',
      message: newMessage.trim()
    });
    
    setNewMessage('');
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const getProgressPercentage = (user) => {
    if (!battleStarted || !questions?.length || !user?.currentQuestion) return 0;
    return (user.currentQuestion / questions.length) * 100;
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, '0')}`;
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white"
        >
          <LoadingAnimation message="Connecting to Battle Room..." size="large" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-700 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white rounded-lg p-8 shadow-2xl"
        >
          <FaTimes className="text-red-500 text-4xl mx-auto mb-4" />
          <h2 className="text-red-600 text-xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Security Initialization Modal */}
      <SecurityInitModal
        isOpen={showSecurityModal}
        onAccept={handleSecurityAccept}
        onCancel={handleSecurityCancel}
        quizType="battle"
      />

      {/* Security Warning */}
      {currentViolation && (
        <SecurityWarning
          violation={currentViolation}
          warnings={warnings}
          maxWarnings={maxWarnings}
          onDismiss={handleViolationDismiss}
          autoHide={true}
          hideDelay={5000}
        />
      )}

      {/* Security Status Indicator */}
      {securityActive && (
        <div className="fixed top-4 right-4 z-40 flex flex-col space-y-2">
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            🔒 Battle Secure Mode {warnings > 0 && `(${remainingWarnings} warnings left)`}
          </div>
          {!isFullscreen && (
            <button
              onClick={enterFullscreen}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 transition-colors"
              title="Click to enter fullscreen mode"
            >
              <span>📺</span>
              <span>Fullscreen</span>
            </button>
          )}
        </div>
      )}

      {/* Notifications */}
      <BattleNotification 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      {/* Header */}
      <div className="bg-black bg-opacity-30 backdrop-blur-sm border-b border-white border-opacity-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                🔥 Quiz Battle
              </h1>
              <div className="flex items-center space-x-2 text-sm">
                <FaUsers className="text-blue-400" />
                <span>{users.length}/30 Players</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                Room: <span className="font-mono bg-white bg-opacity-20 px-2 py-1 rounded">{roomId}</span>
              </div>
              <button
                onClick={handleLeaveRoom}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!battleStarted ? (
          /* Waiting Room */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Waiting for Players</h2>
              <p className="text-gray-300">Get ready for an epic quiz battle!</p>
              {selectedChapter && (
                <div className="mt-4 inline-block bg-orange-500 bg-opacity-20 border border-orange-400 rounded-lg px-4 py-2">
                  <span className="text-orange-300 text-sm font-semibold">Chapter: {selectedChapter}</span>
                </div>
              )}
            </div>

            {/* Players List and Chat */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Players List */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-center">Players ({users?.length || 0})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users?.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border-2 transition-all duration-300 ${
                        user.isReady ? 'border-green-400 bg-green-400 bg-opacity-20' : 'border-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center font-bold text-lg">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{user.username}</h3>
                          <div className="flex items-center space-x-2 text-sm">
                            {user.isReady ? (
                              <>
                                <FaCheck className="text-green-400" />
                                <span className="text-green-400">Ready</span>
                              </>
                            ) : (
                              <span className="text-gray-400">Waiting...</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Chat Box */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-center">Battle Chat</h3>
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20 h-80 flex flex-col">
                  {/* Chat Messages */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-2">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm mt-8">
                        💬 Start chatting with other players!
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div key={msg.id} className="text-sm">
                          <span className="font-semibold text-blue-300">{msg.username}:</span>
                          <span className="ml-2 text-gray-200">{msg.message}</span>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  
                  {/* Chat Input */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-white border-opacity-20">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-white bg-opacity-20 text-white placeholder-gray-300 px-3 py-2 rounded-lg border border-white border-opacity-30 focus:outline-none focus:border-blue-400 text-sm"
                        maxLength={100}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Ready Button */}
            <div className="text-center mb-8">
              <button
                onClick={handleReadyToggle}
                className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  isReady
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {isReady ? '✓ Ready' : 'Get Ready'}
              </button>
            </div>

            {/* Start Battle Button (Room Creator Only) */}
            {isRoomCreator && users?.length >= 2 && users?.every(user => user.isReady) && securityInitialized && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <button
                  onClick={handleStartBattle}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  <FaPlay className="inline mr-2" />
                  Start Battle!
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : battleEnded ? (
          /* Results Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <FaTrophy className="text-6xl text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Battle Results</h2>
            </div>

            <div className="space-y-4">
              {(results || []).map((result, index) => (
                <motion.div
                  key={result.userId}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border-2 ${
                    index === 0 ? 'border-yellow-400 bg-yellow-400 bg-opacity-20' : 'border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-yellow-400 text-black' : 'bg-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{result.username}</h3>
                        <p className="text-gray-300">
                          {result.correctAnswers}/{result.totalQuestions} correct
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-400">{result.score}</div>
                      <div className="text-sm text-gray-300">
                        {formatTime(result.totalTime)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/leaderboard')}
                  className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 px-8 py-3 rounded-lg font-semibold transition-colors text-white shadow-lg"
                >
                  🏆 View Global Battle Leaderboard
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-blue-500 hover:bg-blue-600 px-8 py-3 rounded-lg font-semibold transition-colors text-white"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Battle Interface */
          <div className="max-w-6xl mx-auto">
            {/* Progress Track */}
            <div className="mb-8">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full h-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-30"></div>
                {users?.map((user, index) => (
                  <motion.div
                    key={user.id}
                    className="absolute top-0 h-full flex items-center"
                    style={{ left: `${getProgressPercentage(user)}%` }}
                    animate={{ left: `${getProgressPercentage(user)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg border-2 border-white">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <div className="text-xs font-semibold">{user.username}</div>
                        <div className="text-xs text-gray-300">{user.score} pts</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Question Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Question Panel */}
              <div className="lg:col-span-2">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-300">
                      Question {currentQuestion + 1} of {questions?.length || 0}
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <FaClock className="text-yellow-400" />
                      <span>{formatTime(timeSpent)}</span>
                    </div>
                  </div>

                  {/* Lifeline Tools */}
                  {lifelineConfig && Object.keys(lifelineConfig).length > 0 && (
                    <LifelineTools
                      config={lifelineConfig}
                      usedCounts={usedCounts}
                      onUseLifeline={handleUseLifeline}
                      disabled={answered}
                      currentQuestion={questions?.[currentQuestion]}
                    />
                  )}
                  
                  <h3 className="text-xl font-semibold mb-6">
                    <MathText>{questions?.[currentQuestion]?.question || 'Loading question...'}</MathText>
                  </h3>
                  
                  {helpUsed && (
                    <div className="bg-yellow-500 bg-opacity-20 border border-yellow-400 rounded-lg p-3 mb-4">
                      <p className="text-yellow-300 text-sm">
                        💡 Correct answer revealed! Your score for this question will be reduced by 50%.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {questions?.[currentQuestion]?.options?.map((option, index) => {
                      const isHidden = hiddenOptions.has(index);
                      const isCorrect = helpUsed && index === questions?.[currentQuestion]?.correctAnswer;
                      
                      if (isHidden) {
                        return (
                          <div key={index} className="w-full p-4 rounded-lg bg-gray-600 bg-opacity-50 opacity-50">
                            <div className="flex items-center text-gray-400">
                              <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
                              <span>Option removed by 50-50</span>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <motion.button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          disabled={answered}
                          className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${
                            selectedAnswer === index
                              ? isCorrect
                                ? 'bg-green-500 text-white shadow-lg'
                                : 'bg-blue-500 text-white shadow-lg'
                              : answered && index === questions?.[currentQuestion]?.correctAnswer
                              ? 'bg-green-500 text-white'
                              : answered && selectedAnswer === index && index !== questions?.[currentQuestion]?.correctAnswer
                              ? 'bg-red-500 text-white'
                              : isCorrect
                              ? 'bg-green-400 bg-opacity-30 border border-green-400 text-white'
                              : 'bg-white bg-opacity-10 hover:bg-opacity-20 text-white'
                          }`}
                          whileHover={{ scale: answered ? 1 : 1.02 }}
                          whileTap={{ scale: answered ? 1 : 0.98 }}
                        >
                          <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
                          {isCorrect && <span className="text-green-300 mr-2">✓</span>}
                          <MathText>{option}</MathText>
                        </motion.button>
                      );
                    })}
                  </div>

                  {!answered && selectedAnswer !== null && (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleSubmitAnswer}
                      className="w-full mt-6 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                      Submit Answer
                    </motion.button>
                  )}

                  {answered && currentQuestion < (questions?.length || 0) - 1 && (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleNextQuestion}
                      className="w-full mt-6 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                      Next Question
                    </motion.button>
                  )}
                </motion.div>
              </div>

              {/* Players Panel */}
              <div className="lg:col-span-1">
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FaUsers className="mr-2" />
                    Players
                  </h3>
                  <div className="space-y-3">
                    {users?.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{user.username}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-yellow-400">{user.score || 0}</div>
                          <div className="text-xs text-gray-300">
                            Q{(user.currentQuestion || 0) + 1}/{questions?.length || 0}
                          </div>
                        </div>
                      </div>
                    )) || []}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizBattleRoom; 