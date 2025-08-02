import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEye, FaUsers, FaClock, FaTrophy, FaPlay, FaStop, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { useSocket } from '../utils/socketManager';

const SpectatorMode = ({ roomId, onClose }) => {
  const [battleData, setBattleData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [battleStatus, setBattleStatus] = useState('waiting'); // waiting, active, finished
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [results, setResults] = useState([]);
  const [connected, setConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const socket = useSocket(`spectator-${roomId}`);

  useEffect(() => {
    if (!roomId) return;

    // Set up socket event listeners for spectator mode
    const initializeSpectator = async () => {
      try {
        // Connect as spectator
        await socket.connect();

        socket.addListener('connect', () => {
          console.log('🔌 Spectator connected to room:', roomId);
          setConnected(true);
          
          // Join as spectator
          socket.emit('joinSpectator', { roomId });
        });

        socket.addListener('spectatorJoined', (data) => {
          console.log('👀 Joined as spectator:', data);
          setBattleData(data.room);
          setPlayers(data.room.users || []);
          setBattleStatus(data.room.status || 'waiting');
          if (data.room.questions) {
            setQuestions(data.room.questions);
          }
        });

        socket.addListener('userJoined', (data) => {
          console.log('👤 Player joined:', data);
          setPlayers(prev => [...prev.filter(p => p.id !== data.userId), {
            id: data.userId,
            username: data.username,
            isReady: false,
            currentQuestion: 0,
            score: 0
          }]);
          addNotification(`${data.username} joined the battle!`, 'info');
        });

        socket.addListener('userLeft', (data) => {
          console.log('👋 Player left:', data);
          setPlayers(prev => prev.filter(p => p.id !== data.userId));
          addNotification(`${data.username} left the battle`, 'warning');
        });

        socket.addListener('userReadyStatus', (data) => {
          setPlayers(prev => prev.map(player => 
            player.id === data.userId 
              ? { ...player, isReady: data.isReady }
              : player
          ));
        });

        socket.addListener('battleStarted', (data) => {
          console.log('🚀 Battle started (spectator view):', data);
          setBattleStatus('active');
          setQuestions(data.questions);
          setCurrentQuestion(0);
          addNotification('Battle has started!', 'success');
          playSound('start');
        });

        socket.addListener('updateProgress', (data) => {
          console.log('📊 Progress update (spectator):', data);
          setPlayers(prev => prev.map(player => 
            player.id === data.userId 
              ? { 
                  ...player, 
                  currentQuestion: data.currentQuestion, 
                  score: data.score 
                }
              : player
          ));
        });

        socket.addListener('userFinished', (data) => {
          console.log('🏁 Player finished (spectator):', data);
          addNotification(`${data.username} finished the quiz!`, 'success');
          playSound('finish');
        });

        socket.addListener('battleEnded', (data) => {
          console.log('🏆 Battle ended (spectator):', data);
          setBattleStatus('finished');
          setResults(data.results);
          addNotification('Battle completed!', 'success');
          playSound('end');
        });

        socket.addListener('error', (error) => {
          console.error('❌ Spectator error:', error);
          addNotification(error.message || 'Connection error', 'error');
        });

        socket.addListener('disconnect', () => {
          console.log('❌ Spectator disconnected');
          setConnected(false);
        });

      } catch (error) {
        console.error('💥 Failed to initialize spectator mode:', error);
        addNotification('Failed to connect as spectator', 'error');
      }
    };

    initializeSpectator();

    return () => {
      socket.removeAllListeners();
      socket.emit('leaveSpectator', { roomId });
    };
  }, [roomId]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, timestamp: new Date() };
    setNotifications(prev => [...prev, notification].slice(-5)); // Keep only last 5

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const playSound = (type) => {
    if (!soundEnabled) return;
    
    // Create audio context for sound effects
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different sounds for different events
      switch (type) {
        case 'start':
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.1);
          break;
        case 'finish':
          oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
          break;
        case 'end':
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.2);
          break;
      }
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const getProgressPercentage = (player) => {
    if (!questions.length) return 0;
    return (player.currentQuestion / questions.length) * 100;
  };

  const getPlayerPosition = (player) => {
    const sortedPlayers = [...players].sort((a, b) => {
      if (a.currentQuestion !== b.currentQuestion) {
        return b.currentQuestion - a.currentQuestion;
      }
      return b.score - a.score;
    });
    return sortedPlayers.findIndex(p => p.id === player.id) + 1;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-bold">Connecting to Battle Room...</h2>
          <p className="text-gray-300">Joining as spectator</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black bg-opacity-30 backdrop-blur-sm border-b border-white border-opacity-20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <FaEye className="text-2xl text-yellow-400" />
            <div>
              <h1 className="text-2xl font-bold">Spectator Mode</h1>
              <p className="text-sm text-gray-300">Room: {roomId}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <FaUsers className="text-blue-400" />
              <span>{players.length} Players</span>
            </div>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              {soundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
            </button>
            
            <button
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
            >
              Exit Spectator
            </button>
          </div>
        </div>
      </div>

      {/* Battle Status */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white border-opacity-20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${
                battleStatus === 'waiting' ? 'bg-yellow-400' :
                battleStatus === 'active' ? 'bg-green-400 animate-pulse' :
                'bg-blue-400'
              }`} />
              <span className="text-lg font-semibold">
                {battleStatus === 'waiting' ? 'Waiting for Players' :
                 battleStatus === 'active' ? 'Battle in Progress' :
                 'Battle Completed'}
              </span>
            </div>
            
            {battleStatus === 'active' && questions.length > 0 && (
              <div className="text-sm text-gray-300">
                Question {Math.max(...players.map(p => p.currentQuestion)) + 1} / {questions.length}
              </div>
            )}
          </div>

          {/* Live Progress Track */}
          {battleStatus !== 'waiting' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FaTrophy className="mr-2 text-yellow-400" />
                Live Battle Track
              </h3>
              
              {/* Progress Track Visualization */}
              <div className="bg-gray-800 rounded-lg p-4 relative overflow-hidden">
                <div className="relative h-16">
                  {/* Track Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg"></div>
                  
                  {/* Finish Line */}
                  <div className="absolute right-0 top-0 h-full w-1 bg-yellow-400"></div>
                  
                  {/* Players on Track */}
                  {players.map((player, index) => {
                    const progress = getProgressPercentage(player);
                    const position = getPlayerPosition(player);
                    
                    return (
                      <motion.div
                        key={player.id}
                        className="absolute top-0 h-full flex items-center"
                        animate={{ left: `${Math.min(progress, 95)}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        style={{ zIndex: players.length - index }}
                      >
                        <div className="relative">
                          {/* Player Avatar */}
                          <motion.div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 ${
                              position === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-300' :
                              position === 2 ? 'bg-gradient-to-br from-gray-400 to-gray-600 border-gray-300' :
                              position === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 border-amber-400' :
                              'bg-gradient-to-br from-blue-400 to-purple-500 border-blue-300'
                            }`}
                            whileHover={{ scale: 1.1 }}
                          >
                            {player.username.charAt(0).toUpperCase()}
                          </motion.div>
                          
                          {/* Player Info Tooltip */}
                          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 rounded-lg p-2 text-xs whitespace-nowrap">
                            <div className="font-semibold text-yellow-400">{player.username}</div>
                            <div className="text-white">Score: {player.score}</div>
                            <div className="text-gray-300">Q{player.currentQuestion + 1}/{questions.length}</div>
                            <div className="text-blue-400">#{position}</div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Progress Labels */}
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>Start</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>Finish</span>
                </div>
              </div>
            </div>
          )}

          {/* Players List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border-2 transition-all ${
                  getPlayerPosition(player) === 1 ? 'border-yellow-400 bg-yellow-400 bg-opacity-20' :
                  getPlayerPosition(player) === 2 ? 'border-gray-400 bg-gray-400 bg-opacity-20' :
                  getPlayerPosition(player) === 3 ? 'border-amber-600 bg-amber-600 bg-opacity-20' :
                  'border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      getPlayerPosition(player) === 1 ? 'bg-yellow-400 text-black' :
                      getPlayerPosition(player) === 2 ? 'bg-gray-400 text-white' :
                      getPlayerPosition(player) === 3 ? 'bg-amber-600 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      #{getPlayerPosition(player)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{player.username}</h3>
                      <div className="text-sm text-gray-300">
                        {battleStatus === 'waiting' ? (
                          player.isReady ? '✓ Ready' : 'Waiting...'
                        ) : (
                          `Q${player.currentQuestion + 1}/${questions.length}`
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {battleStatus !== 'waiting' && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-yellow-400">{player.score}</div>
                      <div className="text-xs text-gray-300">points</div>
                    </div>
                  )}
                </div>
                
                {/* Progress Bar */}
                {battleStatus === 'active' && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <motion.div
                        className="h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                        animate={{ width: `${getProgressPercentage(player)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Live Notifications */}
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              className={`fixed top-20 right-4 p-3 rounded-lg shadow-lg border-l-4 ${
                notification.type === 'success' ? 'bg-green-500 border-green-400' :
                notification.type === 'warning' ? 'bg-yellow-500 border-yellow-400' :
                notification.type === 'error' ? 'bg-red-500 border-red-400' :
                'bg-blue-500 border-blue-400'
              }`}
              style={{ zIndex: 1000 }}
            >
              <div className="text-white text-sm font-semibold">
                {notification.message}
              </div>
              <div className="text-xs text-gray-200">
                {formatTime(notification.timestamp)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Results */}
        {battleStatus === 'finished' && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20"
          >
            <h3 className="text-2xl font-bold mb-4 text-center">🏆 Final Results</h3>
            <div className="space-y-3">
              {results.map((result, index) => (
                <motion.div
                  key={result.userId}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0 ? 'bg-yellow-400 bg-opacity-20 border border-yellow-400' :
                    index === 1 ? 'bg-gray-400 bg-opacity-20 border border-gray-400' :
                    index === 2 ? 'bg-amber-600 bg-opacity-20 border border-amber-600' :
                    'bg-blue-500 bg-opacity-20 border border-blue-500'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-400 text-black' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{result.username}</h4>
                      <p className="text-sm text-gray-300">
                        {result.correctAnswers}/{result.totalQuestions} correct
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">{result.score}</div>
                    <div className="text-sm text-gray-300">points</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SpectatorMode;