import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaCog, FaUser, FaRobot, FaStar, FaImage, FaTimes, FaMicrophone, FaMicrophoneSlash, FaVolumeUp, FaSearch, FaPalette } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import MathText from '../components/MathText';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import neuraXAvatar from '../assets/NeuraXavatar.png';

const NeuraflowAIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState('qwen/qwen3-32b');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isNewChat, setIsNewChat] = useState(true);

  const [ocrProgress, setOcrProgress] = useState(0);
  const [searchStatus, setSearchStatus] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  const models = [
    { id: 'qwen/qwen3-32b', name: 'Qwen 32B', description: 'Fast responses & multilingual support' },
    { id: 'qwen/qwen3-235b-a22b:free', name: 'Bengali Expert', description: 'Perfect for Bengali language support' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Code Expert', description: 'Best for coding & complex reasoning' },
    { id: 'DavidAU/Llama-3.2-8X3B-MOE-Dark-Champion-Instruct-uncensored-abliterated-18.4B-GGUF', name: 'Dark Champion', description: 'Uncensored & powerful reasoning' }
  ];

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        
        // Auto-detect Bengali and switch language
        const bengaliPattern = /[\u0980-\u09FF]/;
        if (bengaliPattern.test(transcript)) {
          recognitionRef.current.lang = 'bn-BD';
        }
        
        setInputText(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Spacebar voice toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && !isTyping && !isStreaming && !isProcessingOCR) {
        // Only if input is not focused
        if (document.activeElement !== inputRef.current) {
          e.preventDefault();
          if (isListening) {
            stopListening();
          } else {
            startListening();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isListening, isTyping, isStreaming, isProcessingOCR]);

  // Load chat history list on component mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userId = userData.id || 'guest';
      
      // Load from localStorage first
      const localChats = JSON.parse(localStorage.getItem(`chat_history_${userId}`) || '[]');
      setChatHistory(localChats);
      
      // Try to load from server for logged-in users
      if (userId !== 'guest') {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const token = localStorage.getItem('authToken');
          const response = await axios.get(`${apiUrl}/api/ai-chat/history-list`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const serverChats = response.data.chats || [];
          if (serverChats.length > 0) {
            setChatHistory(serverChats);
          }
        } catch (serverError) {
          console.log('Server chat history not available, using local storage');
        }
      }
    } catch (error) {
      console.log('No chat history found');
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setIsNewChat(true);
    setShowHistory(false);
  };

  const loadChat = async (chatId) => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userId = userData.id || 'guest';
      
      // Try to load from localStorage first
      const savedMessages = JSON.parse(localStorage.getItem(`ai_chat_${userId}_${chatId}`) || '[]');
      
      if (savedMessages.length > 0) {
        const parsedMessages = savedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
        setCurrentChatId(chatId);
        setIsNewChat(false);
        setShowHistory(false);
        return;
      }
      
      // Fallback to server if available
      if (userId !== 'guest') {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`${apiUrl}/api/ai-chat/history/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const parsedMessages = response.data.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        setMessages(parsedMessages);
      }
      
      setCurrentChatId(chatId);
      setIsNewChat(false);
      setShowHistory(false);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };
  
  const getWelcomeMessage = () => [
    {
      id: 1,
      type: 'bot',
      content: "👋 Hello! I'm **NeuraX**, your advanced AI assistant! ⚡\n\nI can help you with:\n• 📚 Academic questions across all subjects\n• 🔍 Real-time web search\n• 📷 Image analysis & OCR\n• 🎤 Voice interactions\n• 💬 General conversations\n\nWhat would you like to explore today?",
      timestamp: new Date()
    }
  ];
  
  // Save conversation history whenever messages change
  useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userId = userData.id || 'guest';
      
      // Save messages to specific chat
      localStorage.setItem(`ai_chat_${userId}_${currentChatId}`, JSON.stringify(messages));
      
      // Update chat history with last message time
      const updatedChats = chatHistory.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, lastMessage: new Date().toISOString() }
          : chat
      );
      setChatHistory(updatedChats);
      localStorage.setItem(`chat_history_${userId}`, JSON.stringify(updatedChats));
      
      // Save to server for logged-in users
      if (userId !== 'guest') {
        saveChatToServer(messages);
      }
    }
  }, [messages, currentChatId, chatHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // System prompt for NeuraX
  const systemPrompt = `You are NeuraX (নিউরএক্স), a smart and friendly assistant developed for the Neuronerds Quiz Platform and its WhatsApp student community (*The NeuroNERDS*). You help students with study-related queries, platform support, academic motivation, and group-related information.

🎯 Your Role:
- Act as a study companion and mentor.
- Provide accurate, helpful academic answers across subjects.
- Assist with platform-related questions, updates, and features.
- Share study strategies and gentle motivation.
- Represent the group with intelligence, warmth, and clarity.

📷 Image Analysis:
- When users upload images, you'll receive OCR text as [Text in Image] and descriptions as [Image Description] or [Image Context]
- Use this information to answer questions about the image content
- Help with solving problems, explaining diagrams, reading text, or analyzing visual content
- Be specific about what you can see in the provided image analysis

🔍 Web Search Intelligence:
- If you need current information, recent news, latest updates, or real-time data to answer properly, respond with: "[SEARCH_NEEDED: search_query_here]"
- Use web search for: current events, latest news, recent developments, live data, today's information, breaking news, recent discoveries
- Don't search for: basic academic concepts, historical facts, general knowledge, math problems, established scientific principles
- After receiving search results, provide a natural response incorporating the information without mentioning the search

🗣️ Tone & Communication Style:
- Friendly, clear, concise, and student-focused.
- Never show what you are reasoning or thinking in <think></think> tags.
- Avoid unnecessary humor or filler (e.g., no "ahaha", "lol").
- Use friendly emojis when helpful 🙂 but don't overuse.
- Write short and to-the-point unless detail is requested.
- If the user types in Bangla, reply fully in Bangla.
- When you receive image analysis data like [Text in Image] or [Image Description], use that information to help the user with their question about the image.

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
You are *NeuraX* — the intelligent, reliable friend of every student. 🤖✨`;

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const extractTextFromImage = async (imageFile) => {
    setIsProcessingOCR(true);
    setOcrProgress(0);
    try {
      const { data: { text } } = await Tesseract.recognize(imageFile, 'eng+ben', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
        langPath: './tesseract-lang',
        cachePath: './tesseract-cache',
        gzip: true
      });
      return text.trim();
    } catch (error) {
      console.error('OCR Error:', error);
      return '';
    } finally {
      setIsProcessingOCR(false);
      setOcrProgress(0);
    }
  };

  const generateImageCaption = async (imageFile) => {
    return await generateLocalCaption(imageFile);
  };

  const generateLocalCaption = async (imageFile) => {
    const fileSize = (imageFile.size / 1024).toFixed(1);
    const fileType = imageFile.type.split('/')[1].toUpperCase();
    return `${fileType} image (${fileSize} KB) - Image analysis available`;
  };

  const uploadImageToCloud = async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.post(`${apiUrl}/api/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.imageUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      return URL.createObjectURL(imageFile);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text) => {
    if (synthRef.current && !isSpeaking) {
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const performWebSearch = async (query) => {
    try {
      setSearchStatus('Searching the web...');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      // Add date context for fresher results
      const enhancedQuery = `${query.trim()} 2024 2025 latest recent`;
      const response = await axios.post(`${apiUrl}/api/web-search`, {
        query: enhancedQuery
      });
      
      const results = response.data.results;
      if (results && results.length > 0) {
        setSearchStatus('Found results!');
        const searchSummary = results.slice(0, 3).map((result, index) => 
          `${index + 1}. **${result.title}**\n   ${result.snippet}\n   Source: ${result.link}`
        ).join('\n\n');
        
        return `🔍 **Web Search Results:**\n\n${searchSummary}\n\n*⚠️ Search results may not reflect the most recent information. For latest updates, please verify from official sources.*`;
      }
      setSearchStatus('No results found');
      return '🔍 No web search results found.';
    } catch (error) {
      console.error('Web search error:', error);
      setSearchStatus('Search failed');
      return '🔍 Web search temporarily unavailable.';
    } finally {
      setTimeout(() => setSearchStatus(''), 2000);
    }
  };

  const generateImage = async (prompt) => {
    setIsGeneratingImage(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.post(`${apiUrl}/api/generate-image`, {
        prompt: prompt.trim()
      });
      
      return response.data.imageUrl;
    } catch (error) {
      console.error('Image generation error:', error);
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageGeneration = async (prompt) => {
    const generatedImageUrl = await generateImage(prompt);
    
    if (generatedImageUrl) {
      const imageMessage = {
        id: Date.now(),
        type: 'bot',
        content: '',
        image: generatedImageUrl,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, imageMessage]);
    } else {
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        content: '❌ Sorry, image generation is temporarily unavailable. Please check the API credentials or try again later.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const saveChatToServer = async (messages) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('authToken');
      await axios.post(`${apiUrl}/api/ai-chat/save-history`, {
        messages: messages
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.log('Failed to save chat to server:', error);
    }
  };

  const clearChatHistory = async () => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userId = userData.id || 'guest';
    
    localStorage.removeItem(`ai_chat_${userId}`);
    
    if (userId !== 'guest') {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const token = localStorage.getItem('authToken');
        await axios.delete(`${apiUrl}/api/ai-chat/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.log('Failed to clear server history:', error);
      }
    }
    
    setMessages(getWelcomeMessage());
    setShowChatMenu(false);
  };

  const quickActions = [
    { icon: '📚', text: 'Help with homework', prompt: 'Help me with my homework' },
    { icon: '🧮', text: 'Solve math problem', prompt: 'Help me solve this math problem' },
    { icon: '🔍', text: 'Search latest news', prompt: 'What are the latest news today?', enableSearch: true },
    { icon: '📖', text: 'Explain concept', prompt: 'Explain this concept to me' },
    { icon: '🌐', text: 'Translate text', prompt: 'Translate this text' },
    { icon: '📷', text: 'Analyze image', prompt: 'Upload an image to analyze' }
  ];

  const handleQuickAction = (action) => {
    if (action.enableSearch) {
      setEnableWebSearch(true);
    }
    setInputText(action.prompt);
    setShowQuickActions(false);
    inputRef.current?.focus();
  };

  const isValidPrompt = (text) => {
    if (!text || !text.trim()) return false;
    const cleanText = text.trim().toLowerCase();
    const invalidPatterns = /^(\.{1,}|\?{1,}|!{1,}|[a-z]{1,2}|hi|hey|hello)$/;
    return cleanText.length >= 3 && !invalidPatterns.test(cleanText);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;
    
    if (selectedImage && !isValidPrompt(inputText)) {
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        content: '⚠️ Please provide a clear description of what you want me to do with this image. For example: "What is this?", "Help me solve this", "Explain this diagram", etc.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Create new chat if this is the first message
    if (messages.length === 0 && !currentChatId) {
      const newChatId = Date.now().toString();
      const chatTitle = inputText.trim().slice(0, 50) + (inputText.trim().length > 50 ? '...' : '');
      
      setCurrentChatId(newChatId);
      setIsNewChat(false);
      
      // Add to chat history
      const newChat = {
        id: newChatId,
        title: chatTitle,
        lastMessage: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      setChatHistory(prev => [newChat, ...prev]);
      
      // Save to localStorage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userId = userData.id || 'guest';
      const existingChats = JSON.parse(localStorage.getItem(`chat_history_${userId}`) || '[]');
      localStorage.setItem(`chat_history_${userId}`, JSON.stringify([newChat, ...existingChats]));
    }

    let messageContent = inputText;
    let uploadedImageUrl = null;
    
    if (selectedImage && isValidPrompt(inputText)) {
      setIsProcessingOCR(true);
      
      const imageUrl = await uploadImageToCloud(selectedImage);
      
      const [ocrText, caption] = await Promise.all([
        extractTextFromImage(selectedImage),
        generateImageCaption(selectedImage)
      ]);
      
      let imageAnalysis = '';
      if (ocrText && ocrText.length > 10) {
        imageAnalysis = `[Text in Image]: ${ocrText}`;
        if (caption) imageAnalysis += `\n[Image Context]: ${caption}`;
      } else if (caption) {
        imageAnalysis = `[Image Description]: ${caption}`;
      }
      
      if (imageAnalysis) {
        messageContent = inputText ? `${inputText}\n\n${imageAnalysis}` : imageAnalysis;
      }
      
      uploadedImageUrl = imageUrl;
      setIsProcessingOCR(false);
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageContent,
      image: selectedImage
        ? (isValidPrompt(inputText)
            ? uploadedImageUrl
            : URL.createObjectURL(selectedImage))
        : null,
      timestamp: new Date()
    };

    const currentInput = messageContent;
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsTyping(true);

    try {
      const aiResult = await getAIResponse(currentInput);
      
      // Image generation removed
      
      const response = aiResult.response || aiResult;
      
      // Ensure response is a string
      const responseText = typeof response === 'string' ? response : String(response || 'Sorry, I encountered an error processing your request.');
      
      setIsStreaming(true);
      setStreamingMessage('');
      
      let currentText = '';
      const words = responseText.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        setStreamingMessage(currentText);
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
      }
      
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsStreaming(false);
      setStreamingMessage('');
      
      // Removed auto-speak - only manual via Listen button
    } catch (error) {
      console.error('AI response error:', error);
      let errorMessage = "I'm sorry, I'm having trouble connecting right now. Please try again in a moment! 🤖";
      
      if (enableWebSearch && error.response?.status === 500) {
        errorMessage = "Web search is temporarily unavailable. Let me try to answer without searching the web.";
        // Retry without web search
        setEnableWebSearch(false);
        setTimeout(() => handleSendMessage(), 1000);
        return;
      }
      
      const errorResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: errorMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const getAIResponse = async (userInput) => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    
    const recentMessages = messages.slice(-10).map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    const response = await axios.post(`${apiUrl}/api/ai-chat`, {
      message: userInput,
      model: selectedModel,
      systemPrompt: systemPrompt,
      conversationHistory: recentMessages,
      enableWebSearch: enableWebSearch
    });
    return response.data;
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-purple-900/20"></div>
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      </div>
      
      {/* Sidebar */}
      <motion.div 
        initial={{ x: -300 }}
        animate={{ x: showHistory ? 0 : -300 }}
        className="fixed left-0 top-0 h-full w-80 md:w-80 sm:w-72 bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 z-50 overflow-y-auto"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-200">Chat History</h2>
            <button
              onClick={() => setShowHistory(false)}
              className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <FaTimes className="text-gray-400" />
            </button>
          </div>
          
          <button
            onClick={startNewChat}
            className="w-full mb-4 p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 flex items-center space-x-2"
          >
            <span>✨</span>
            <span>New Chat</span>
          </button>
          
          <div className="space-y-2">
            {chatHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={() => loadChat(chat.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  currentChatId === chat.id 
                    ? 'bg-blue-600/20 border border-blue-500/30' 
                    : 'hover:bg-gray-800/50'
                }`}
              >
                <div className="text-sm font-medium text-gray-200 truncate">
                  {chat.title || 'Untitled Chat'}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(chat.lastMessage).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 w-full">
        {/* Header */}
        <div className="border-b border-gray-800/50 backdrop-blur-xl bg-black/20 px-4 md:px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={() => setShowHistory(true)}
                className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <div className="w-5 h-5 flex flex-col justify-center space-y-1">
                  <div className="w-full h-0.5 bg-gray-400"></div>
                  <div className="w-full h-0.5 bg-gray-400"></div>
                  <div className="w-full h-0.5 bg-gray-400"></div>
                </div>
              </button>
              
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg overflow-hidden border border-gray-600/30">
                  <img src={neuraXAvatar} alt="NeuraX" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="text-base md:text-lg font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">NeuraX</h1>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={startNewChat}
                className="px-3 md:px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors text-xs md:text-sm border border-gray-700/50"
              >
                <span className="hidden sm:inline">New Chat</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>
        </div>

        {/* Welcome Screen or Messages */}
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-4 md:px-6 py-8">
            <div className="max-w-2xl mx-auto text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-6 md:mb-8"
              >
                <div className="w-16 h-16 md:w-24 md:h-24 mx-auto rounded-3xl overflow-hidden shadow-2xl bg-white/5 backdrop-blur-sm border border-gray-700/30">
                  <img src={neuraXAvatar} alt="NeuraX" className="w-full h-full object-cover" />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 text-white">
                  NeuraX
                </h1>
                <p className="text-lg md:text-xl text-gray-400 mb-6 md:mb-8">
                  How can I help you today?
                </p>
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8"
              >
                {[
                  { icon: '🎤', title: 'Voice Chat', desc: 'Speak naturally' },
                  { icon: '🔍', title: 'Web Search', desc: 'Real-time info' },
                  { icon: '📷', title: 'Image Analysis', desc: 'OCR & captioning' },
                  { icon: '📷', title: 'Image Analysis', desc: 'OCR & understanding' },
                  { icon: '📐', title: 'Math Support', desc: 'LaTeX rendering' },
                  { icon: '🌐', title: 'Bilingual', desc: 'Bengali & English' }
                ].map((capability, index) => (
                  <motion.div
                    key={capability.title}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    className="p-3 md:p-4 bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200"
                  >
                    <div className="text-xl md:text-2xl mb-1 md:mb-2">{capability.icon}</div>
                    <div className="text-xs md:text-sm font-medium text-gray-200">{capability.title}</div>
                    <div className="text-xs text-gray-400 hidden md:block">{capability.desc}</div>
                  </motion.div>
                ))}
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                {quickActions.slice(0, 4).map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    className="flex items-center space-x-3 p-3 md:p-4 bg-gray-800/30 hover:bg-gray-700/50 rounded-xl border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200 text-left"
                  >
                    <span className="text-lg md:text-xl">{action.icon}</span>
                    <span className="text-sm font-medium text-gray-200">{action.text}</span>
                  </button>
                ))}
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700">
            <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 md:space-x-4 max-w-full md:max-w-4xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className="flex-shrink-0 mt-1">
                        {message.type === 'bot' ? (
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg overflow-hidden border border-gray-600/30">
                            <img src={neuraXAvatar} alt="NeuraX" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                            <FaUser className="text-gray-300 text-xs" />
                          </div>
                        )}
                      </div>

                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className={`group relative max-w-[85%] md:max-w-3xl ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl rounded-tr-md px-3 md:px-4 py-2 md:py-3 shadow-lg'
                            : 'bg-gray-900/50 backdrop-blur-sm border border-gray-700/30 text-gray-100 rounded-2xl rounded-tl-md px-3 md:px-4 py-2 md:py-3'
                        }`}
                      >
                        {message.image && (
                          <div className="mb-2 md:mb-3">
                            <img 
                              src={message.image} 
                              alt="Uploaded" 
                              className="max-w-full md:max-w-sm rounded-xl shadow-lg border border-gray-600/30"
                            />
                          </div>
                        )}
                        <div className="prose prose-sm max-w-none prose-invert prose-headings:text-gray-100 prose-headings:font-semibold prose-p:text-gray-200 prose-p:leading-relaxed prose-strong:text-white prose-strong:font-semibold prose-ul:text-gray-200 prose-ol:text-gray-200 prose-li:mb-1 prose-code:text-blue-300 prose-code:bg-gray-800/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-blockquote:border-l-blue-400 prose-blockquote:bg-gray-800/30 prose-blockquote:text-gray-300">
                          <MathText>{message.content}</MathText>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 md:mt-3 pt-2 border-t border-gray-700/20">
                          <span className="text-xs text-gray-400">
                            {formatTimestamp(message.timestamp)}
                          </span>
                          {message.type === 'bot' && (
                            <button
                              onClick={() => isSpeaking ? stopSpeaking() : speakText(message.content)}
                              className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-400 hover:text-blue-400 transition-colors rounded-md hover:bg-gray-800/30"
                            >
                              <FaVolumeUp className="text-xs" />
                              <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-4 max-w-4xl">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-600/30 mt-1">
                      <img src={neuraXAvatar} alt="NeuraX" className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/30 text-gray-100 rounded-2xl rounded-tl-md px-4 py-3 max-w-3xl">
                      <div className="prose prose-sm max-w-none prose-invert prose-headings:text-gray-100 prose-headings:font-semibold prose-p:text-gray-200 prose-p:leading-relaxed prose-strong:text-white prose-strong:font-semibold prose-ul:text-gray-200 prose-ol:text-gray-200 prose-li:mb-1 prose-code:text-blue-300 prose-code:bg-gray-800/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-blockquote:border-l-blue-400 prose-blockquote:bg-gray-800/30 prose-blockquote:text-gray-300">
                        <MathText>{streamingMessage}</MathText>
                        <span className="inline-block w-0.5 h-4 bg-blue-400 ml-1 animate-pulse"></span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {isTyping && !isStreaming && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start space-x-4 max-w-4xl">
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-600/30 mt-1">
                        <img src={neuraXAvatar} alt="NeuraX" className="w-full h-full object-cover" />
                      </div>
                      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/30 rounded-2xl rounded-tl-md px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            <motion.div 
                              className="w-2 h-2 bg-blue-400 rounded-full"
                              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                            />
                            <motion.div 
                              className="w-2 h-2 bg-purple-400 rounded-full"
                              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                            />
                            <motion.div 
                              className="w-2 h-2 bg-pink-400 rounded-full"
                              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                            />
                          </div>
                          <span className="text-sm text-gray-400 font-medium">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="border-t border-gray-800/30 backdrop-blur-xl bg-black/20 px-4 md:px-6 py-4 md:py-6 sticky bottom-0 z-40">
          <div className="max-w-4xl mx-auto">
            {selectedImage && (
              <div className="mb-3 md:mb-4 flex items-center space-x-3 bg-gray-900/50 backdrop-blur-sm rounded-xl p-3 border border-gray-700/30">
                <img 
                  src={URL.createObjectURL(selectedImage)} 
                  alt="Selected" 
                  className="w-10 h-10 md:w-12 md:h-12 object-cover rounded-lg border border-gray-600/30"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{selectedImage.name}</p>
                  {isProcessingOCR ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-24 md:w-32 bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${ocrProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-blue-400">{ocrProgress}%</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Ready for analysis</p>
                  )}
                </div>
                <button
                  onClick={handleRemoveImage}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>
            )}
            
            {searchStatus && (
              <div className="mb-3 md:mb-4 flex items-center justify-center space-x-3 bg-gray-900/30 backdrop-blur-sm rounded-xl p-3 border border-gray-700/20">
                <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-blue-300">{searchStatus}</span>
              </div>
            )}
            

            
            <div className="flex items-end space-x-2 md:space-x-3">
              <div className="flex-1 relative">
                <motion.textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  placeholder={isListening ? "🎤 Listening..." : enableWebSearch ? "Ask anything with web search 🌐" : selectedImage ? "What would you like to know about this image?" : "Message NeuraX..."}
                  className="w-full px-3 md:px-4 py-3 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 focus:border-blue-500/50 rounded-2xl focus:outline-none text-gray-100 placeholder-gray-400 transition-all duration-200 resize-none scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600 text-sm md:text-base"
                  disabled={isTyping || isStreaming || isProcessingOCR || isListening}
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                />
                {inputText && (
                  <div className="absolute right-3 bottom-2 text-xs text-gray-500">
                    {inputText.length}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-1 md:space-x-2">
                <button
                  onClick={() => setEnableWebSearch(!enableWebSearch)}
                  className={`p-2 md:p-2.5 rounded-xl transition-all duration-200 ${
                    enableWebSearch 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50'
                  }`}
                  disabled={isTyping || isStreaming || isProcessingOCR}
                  title={enableWebSearch ? 'Web search ON' : 'Enable web search'}
                >
                  <FaSearch className="text-xs md:text-sm" />
                </button>
                
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`p-2 md:p-2.5 rounded-xl transition-all duration-200 ${
                    isListening 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50'
                  }`}
                  disabled={isTyping || isStreaming || isProcessingOCR}
                  title={isListening ? 'Stop recording' : 'Voice input'}
                >
                  {isListening ? <FaMicrophoneSlash className="text-xs md:text-sm" /> : <FaMicrophone className="text-xs md:text-sm" />}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 md:p-2.5 bg-gray-800/50 text-gray-400 border border-gray-700/50 rounded-xl hover:bg-gray-700/50 transition-all duration-200"
                  disabled={isTyping || isStreaming || isProcessingOCR}
                  title="Upload image"
                >
                  <FaImage className="text-xs md:text-sm" />
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    className="p-2.5 bg-gray-800/50 text-gray-400 border border-gray-700/50 rounded-xl hover:bg-gray-700/50 transition-all duration-200"
                    title="AI Model"
                  >
                    <FaCog className="text-sm" />
                  </button>
                  
                  <AnimatePresence>
                    {showModelSelector && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-700/50 p-2 min-w-64 shadow-2xl"
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
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'hover:bg-gray-800/50 text-gray-300'
                            }`}
                          >
                            <div className="font-medium text-sm">{model.name}</div>
                            <div className="text-xs text-gray-400">{model.description}</div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {(isTyping || isStreaming) ? (
                <motion.button
                  onClick={() => {
                    setIsTyping(false);
                    setIsStreaming(false);
                    setStreamingMessage('');
                  }}
                  className="p-2.5 md:p-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all duration-200 flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Stop response"
                >
                  <div className="w-3 h-3 bg-red-400 rounded-sm"></div>
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleSendMessage}
                  disabled={(!inputText.trim() && !selectedImage) || isProcessingOCR}
                  className={`p-2.5 md:p-3 rounded-xl transition-all duration-200 flex-shrink-0 ${
                    (!inputText.trim() && !selectedImage) || isProcessingOCR
                      ? 'bg-gray-800/50 text-gray-500 border border-gray-700/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border border-blue-500/30 shadow-lg hover:shadow-xl'
                  }`}
                  whileHover={(!inputText.trim() && !selectedImage) || isProcessingOCR ? {} : { scale: 1.05 }}
                  whileTap={(!inputText.trim() && !selectedImage) || isProcessingOCR ? {} : { scale: 0.95 }}
                >
                  <FaPaperPlane className="text-xs md:text-sm" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeuraflowAIChat;