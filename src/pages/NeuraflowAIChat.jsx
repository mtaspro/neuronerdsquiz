import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaCog, FaUser, FaRobot, FaStar } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import botAvatar from '../assets/botavatar.png';

const NeuraflowAIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState('qwen/qwen3-235b-a22b:free');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const models = [
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', description: 'Best for complex reasoning & analysis' },
    { id: 'mistralai/mistral-small-3.2-24b-instruct:free', name: 'Mistral Small', description: 'Fast responses & coding tasks' },
    { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B', description: 'Creative writing & conversations' },
    { id: 'google/gemini-2.5-pro-exp-03-25', name: 'Gemini 2.5 Pro', description: 'Advanced Math and Scientific Problem Solving' },
    { id: 'qwen/qwen3-235b-a22b:free', name: 'Qwen 3 235B', description: 'Excellent Bengali language support' }
  ];

  // Load conversation history on component mount
  useEffect(() => {
    const loadConversationHistory = () => {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userId = userData.id || 'guest';
      const savedMessages = localStorage.getItem(`ai_chat_${userId}`);
      
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages).map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(parsedMessages);
        } catch (error) {
          console.error('Error loading chat history:', error);
          setMessages(getWelcomeMessage());
        }
      } else {
        setMessages(getWelcomeMessage());
      }
    };
    
    loadConversationHistory();
  }, []);
  
  const getWelcomeMessage = () => [
    {
      id: 1,
      type: 'bot',
      content: "👋 Hello! I'm **Neuraflow AI**, your intelligent study companion! ✨\n\nI'm here to help you with:\n• 📚 Academic questions across all subjects\n• 🎯 Quiz platform features and updates\n• 🏆 Study strategies and tips\n• 💬 General conversations\n\nHow can I assist you today?",
      timestamp: new Date()
    }
  ];
  
  // Save conversation history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userId = userData.id || 'guest';
      localStorage.setItem(`ai_chat_${userId}`, JSON.stringify(messages));
    }
  }, [messages]);

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
- Avoid unnecessary humor or filler (e.g., no "ahaha", "lol").
- Use friendly emojis when helpful 🙂 but don't overuse.
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
-Boys
    - Akhyar Fardin – CEO & Admin  
    - Ahmed Azmain Mahtab – Developer & Management Lead  
    - Md. Tanvir Mahtab – Co-founder & Managing Director  
    - Ahnaf Akif   
    - Md. Tahshin Mahmud Irham 
    - Muntasir
    - Samiul Alam Akib 
    - Jitu Chakraborty 
    - Amdad Hossen Nafiz
-Girls
    - Zahin Ushrut (Parsa)
    - Shakira Nowshin
    - Nanzibah Azmaeen 
    - Ayesha Siddika Aziz Nishu
    - Fathema Zahra 

At present all the members are Students of *Chattogram College*,Bangladesh and reading in class XI and are passionate about learning and helping each other succeed.

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
      
      // Start streaming effect
      setIsStreaming(true);
      setStreamingMessage('');
      
      // Simulate typewriter effect
      let currentText = '';
      const words = response.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        setStreamingMessage(currentText);
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
      }
      
      // Add final message
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsStreaming(false);
      setStreamingMessage('');
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
    
    // Get recent conversation history for context (last 5 pairs = 10 messages)
    const recentMessages = messages.slice(-10).map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    const response = await axios.post(`${apiUrl}/api/ai-chat`, {
      message: userInput,
      model: selectedModel,
      systemPrompt: systemPrompt,
      conversationHistory: recentMessages
    });
    return response.data.response;
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-all duration-500">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-4 shadow-lg"
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <motion.div
              animate={{ rotate: isTyping ? 360 : 0 }}
              transition={{ duration: 2, repeat: isTyping ? Infinity : 0, ease: "linear" }}
              className="relative"
            >
              <img src={botAvatar} alt="Neuraflow AI" className="w-12 h-12 rounded-full ring-2 ring-blue-500/30" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
            </motion.div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Neuraflow AI</h1>
              <div className="flex items-center space-x-2">
                <FaStar className="text-yellow-500 text-xs" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Your intelligent study companion</p>
              </div>
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
                  className="absolute right-0 top-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-64 z-50"
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
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-4 max-w-4xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <motion.div 
                    className="flex-shrink-0"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {message.type === 'bot' ? (
                      <div className="relative">
                        <img src={botAvatar} alt="Neuraflow AI" className="w-10 h-10 rounded-full ring-2 ring-blue-500/30 shadow-lg" />
                        <FaRobot className="absolute -bottom-1 -right-1 text-blue-500 text-xs bg-white dark:bg-gray-900 rounded-full p-1 w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg ring-2 ring-white/50">
                        <FaUser className="text-white text-sm" />
                      </div>
                    )}
                  </motion.div>

                  {/* Message Bubble */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`group relative px-6 py-4 rounded-3xl shadow-lg backdrop-blur-sm ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-blue-500/25'
                        : 'bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white border border-gray-200/50 dark:border-gray-700/50 shadow-gray-500/10'
                    }`}
                  >
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    
                    {/* Timestamp on hover */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute -bottom-8 left-0 text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded-lg backdrop-blur-sm"
                    >
                      {formatTimestamp(message.timestamp)}
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming Message */}
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start space-x-4 max-w-4xl">
                <div className="relative">
                  <img src={botAvatar} alt="Neuraflow AI" className="w-10 h-10 rounded-full ring-2 ring-blue-500/30 shadow-lg" />
                  <FaRobot className="absolute -bottom-1 -right-1 text-blue-500 text-xs bg-white dark:bg-gray-900 rounded-full p-1 w-4 h-4" />
                </div>
                <div className="bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white border border-gray-200/50 dark:border-gray-700/50 shadow-lg backdrop-blur-sm px-6 py-4 rounded-3xl">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <span dangerouslySetInnerHTML={{ __html: streamingMessage + '<span class="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse"></span>' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && !isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-4 max-w-4xl">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <img src={botAvatar} alt="Neuraflow AI" className="w-10 h-10 rounded-full ring-2 ring-blue-500/30 shadow-lg" />
                  </motion.div>
                  <div className="bg-white/90 dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 px-6 py-4 rounded-3xl shadow-lg backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <motion.div 
                          className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div 
                          className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div 
                          className="w-3 h-3 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Neuraflow AI is thinking...</span>
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
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50 px-4 py-6"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <motion.input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about studies, quizzes, or development... ✨"
                className="w-full px-6 py-4 bg-white/90 dark:bg-gray-800/90 rounded-3xl border border-gray-200/50 dark:border-gray-700/50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 shadow-lg backdrop-blur-sm"
                disabled={isTyping || isStreaming}
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
              {inputText && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  <span className="text-xs">{inputText.length}</span>
                </motion.div>
              )}
            </div>
            <motion.button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping || isStreaming}
              className="p-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl transition-all duration-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                animate={{ rotate: isTyping || isStreaming ? 360 : 0 }}
                transition={{ duration: 1, repeat: (isTyping || isStreaming) ? Infinity : 0, ease: "linear" }}
              >
                <FaPaperPlane className="text-lg" />
              </motion.div>
            </motion.button>
          </div>
        </div>
      </motion.div>

    </div>
  );
};

export default NeuraflowAIChat;