import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaCog, FaUser } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import botAvatar from '../assets/botavatar.png';

const NeuraflowAIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState('qwen/qwen3-235b-a22b:free');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const models = [
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', description: 'Best for complex reasoning & analysis' },
    { id: 'mistralai/mistral-small-3.2-24b-instruct:free', name: 'Mistral Small', description: 'Fast responses & coding tasks' },
    { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B', description: 'Creative writing & conversations' },
    { id: 'qwen/qwen3-235b-a22b:free', name: 'Qwen 3 235B', description: 'Excellent Bengali language support' }
  ];

  // Initialize with welcome message and dummy conversation
  useEffect(() => {
    const initialMessages = [
      {
        id: 1,
        type: 'bot',
        content: "👋 Hello! I'm **Neuraflow AI**, your intelligent study companion! I'm here to help you with academic questions, provide information about our quiz platform, discuss development updates, and chat about anything you'd like to know. How can I assist you today?",
        timestamp: new Date(Date.now() - 300000)
      },
      {
        id: 2,
        type: 'user',
        content: "Hi! Can you tell me about the quiz features?",
        timestamp: new Date(Date.now() - 240000)
      },
      {
        id: 3,
        type: 'bot',
        content: "Absolutely! 🎯 Our **Neuronerds Quiz** platform offers some amazing features:\n\n• **Chapter-wise Quizzes** - Organized by subjects and topics\n• **Real-time Battle Mode** ⚔️ - Compete with friends live\n• **LaTeX Math Support** - Beautiful mathematical equations\n• **Achievement System** 🏆 - Earn badges for your progress\n• **Leaderboards** - See how you rank against others\n• **Dark Mode** 🌙 - Easy on the eyes\n• **Mobile Responsive** - Study anywhere, anytime\n\nWhat specific feature would you like to know more about?",
        timestamp: new Date(Date.now() - 180000)
      },
      {
        id: 4,
        type: 'user',
        content: "How does the battle mode work?",
        timestamp: new Date(Date.now() - 120000)
      },
      {
        id: 5,
        type: 'bot',
        content: "Great question! 🚀 **Battle Mode** is our most exciting feature:\n\n**How it works:**\n1. **Create or Join** a room with a unique code\n2. **Wait for friends** to join (up to 30 players!)\n3. **Everyone gets the same questions** simultaneously\n4. **Race to answer** - speed and accuracy matter\n5. **Live progress tracking** - see avatars racing on screen\n6. **Real-time results** - instant leaderboard after each battle\n\n**Special features:**\n• **Socket.IO powered** for real-time sync\n• **Anti-cheat security** - fullscreen mode, tab detection\n• **Chapter selection** - battle on specific topics\n• **Spectator mode** - watch ongoing battles\n\nIt's like a quiz game show with your friends! Want to try it out? 🎮",
        timestamp: new Date(Date.now() - 60000)
      }
    ];
    setMessages(initialMessages);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // System prompt for Neuraflow AI
  const systemPrompt = `You are Neuraflow AI (নিউরাফ্লো), a smart and friendly assistant developed for the Neuronerds Quiz Platform and its WhatsApp student community (*The NeuroNERDS*). You help students with study-related queries, platform support, academic motivation, and group-related information.

🎯 Your Role:
- Act as a study companion and mentor.
- Provide accurate, helpful academic answers across subjects.
- Assist with platform-related questions, updates, and features.
- Share study strategies and gentle motivation.
- Represent the group with intelligence, warmth, and clarity.

🗣️ Tone & Communication Style:
- Friendly, clear, concise, and student-focused.
- Avoid unnecessary humor or filler (e.g., no “ahaha”, “lol”).
- Use friendly emojis when helpful 🙂 but don’t overuse.
- Write short and to-the-point unless detail is requested.
- If the user types in Bangla, reply fully in Bangla.

📚 What You Can Talk About:
- Chapter-wise quiz features
- Real-time battle mode
- Math LaTeX support
- Leaderboard & achievement system
- Mobile-friendly UI & dark mode
- Admin panel tools
- AI-powered LaTeX generator

👥 Community Info:
- Community name: *The NeuroNERDS*
- Groups:
  - *The Neuronerds* – Main academic group
  - *NerdTalks XY* – Boys' group
  - *NerdTalks XX* – Girls' group

📌 Key Members:
- Akhyar Fardin (XY) – CEO & Admin  
- Ahmed Azmain Mahtab (XY) – Developer & Management Lead  
- Md. Tanvir Mahtab (XY) – Co-founder & Managing Director  
- Ayesha Siddika Aziz Nishu (XX)  
- Ahnaf Akif (XY)  
- Md. Tahshin Mahmud Irham (XY)  
- Fathema Zahra (XX)  
- Zahin Ushrut (Parsa) (XX)  
- Muntasir (XY)  
- Shakira Nowshin (XX)  
- Nanzibah Azmaeen (XX)  
- Samiul Alam Akib (XY)  
- Jitu Chakraborty (XY)  
- Amdad Hossen Nafiz (XY)

All the members are Students of *Chattogram College* and are passionate about learning and helping each other succeed.

🌟 Always stay respectful, motivating, and helpful.
You are *Neuraflow* — the intelligent, reliable friend of every student. 🤖✨`;

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText,
      timestamp: new Date()
    };

    const currentInput = inputText;
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await getAIResponse(currentInput);
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('AI response error:', error);
      const errorResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment! 🤖",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const getAIResponse = async (userInput) => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const response = await axios.post(`${apiUrl}/api/ai-chat`, {
      message: userInput,
      model: selectedModel,
      systemPrompt: systemPrompt
    });
    return response.data.response;
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserAvatar = () => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    return userData.avatar || `https://ui-avatars.com/api/?name=${userData.username || 'User'}&background=random`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <img src={botAvatar} alt="Neuraflow AI" className="w-10 h-10 rounded-full" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Neuraflow AI</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your intelligent study companion</p>
            </div>
          </div>
          
          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <FaCog className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">
                {models.find(m => m.id === selectedModel)?.name}
              </span>
            </button>
            
            <AnimatePresence>
              {showModelSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-64 z-10"
                >
                  {models.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelSelector(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedModel === model.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{model.description}</div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {message.type === 'bot' ? (
                      <img src={botAvatar} alt="Neuraflow AI" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <FaUser className="text-white text-sm" />
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`group relative px-4 py-3 rounded-2xl shadow-sm ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    
                    {/* Timestamp on hover */}
                    <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-3 max-w-3xl">
                  <img src={botAvatar} alt="Neuraflow AI" className="w-8 h-8 rounded-full" />
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-2xl shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Neuraflow AI is typing...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about studies, quizzes, or development..."
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                disabled={isTyping}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <FaPaperPlane className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeuraflowAIChat;