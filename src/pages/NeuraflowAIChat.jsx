import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaCog, FaUser, FaRobot, FaStar, FaImage, FaTimes, FaMicrophone, FaMicrophoneSlash, FaVolumeUp, FaSearch, FaPalette } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import MathText from '../components/MathText';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import botAvatar from '../assets/botavatar.png';

const NeuraflowAIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState('qwen/qwq-32b:free');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);

  const [ocrProgress, setOcrProgress] = useState(0);
  const [searchStatus, setSearchStatus] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  const models = [
    { id: 'qwen/qwq-32b:free', name: 'Math Expert', description: 'Best for math & scientific problems' },
    { id: 'qwen/qwen3-235b-a22b:free', name: 'Bengali Expert', description: 'Perfect for Bengali language support' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Code Expert', description: 'Best for coding & complex reasoning' }
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

  // Load conversation history on component mount
  useEffect(() => {
    const loadConversationHistory = async () => {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userId = userData.id || 'guest';
      
      // Try to load from server first (for logged-in users)
      if (userId !== 'guest') {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const token = localStorage.getItem('authToken');
          const response = await axios.get(`${apiUrl}/api/ai-chat/history`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.messages && response.data.messages.length > 0) {
            const parsedMessages = response.data.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            setMessages(parsedMessages);
            return;
          }
        } catch (error) {
          console.log('No server history found, checking local storage');
        }
      }
      
      // Fallback to local storage
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
      
      // Save to local storage
      localStorage.setItem(`ai_chat_${userId}`, JSON.stringify(messages));
      
      // Save to server for logged-in users
      if (userId !== 'guest') {
        saveChatToServer(messages);
      }
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

🔍 Web Search Intelligence:
- If you need current information, recent news, latest updates, or real-time data to answer properly, respond with: "[SEARCH_NEEDED: search_query_here]"
- Use web search for: current events, latest news, recent developments, live data, today's information, breaking news, recent discoveries
- Don't search for: basic academic concepts, historical facts, general knowledge, math problems, established scientific principles
- After receiving search results, provide a natural response incorporating the information without mentioning the search

🎨 Image Generation Intelligence:
- If user asks to create, generate, draw, make an image, respond with: "[IMAGE_CONFIRM: improved_prompt_here] - Should I generate this image for you?"
- Improve the prompt by adding artistic details, style, and quality descriptors
- Wait for user confirmation before generating
- After confirmation, respond only with: "[GENERATE_IMAGE: final_prompt]"

🗣️ Tone & Communication Style:
- Friendly, clear, concise, and student-focused.
- Never show what you are reasoning or thinking in <think></think> tags.
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
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      
      const response = await fetch('https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // Free tier, no key needed for basic usage
        },
        body: formData
      });
      
      if (!response.ok) {
        // Fallback to local processing if API fails
        return await generateLocalCaption(imageFile);
      }
      
      const result = await response.json();
      return result[0]?.generated_text || 'Unable to generate caption';
    } catch (error) {
      console.error('Caption Error:', error);
      return await generateLocalCaption(imageFile);
    }
  };

  const generateLocalCaption = async (imageFile) => {
    // Simple local caption based on file properties
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
      // Fallback to blob URL if upload fails
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
      // Stop any ongoing speech
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
      const response = await axios.post(`${apiUrl}/api/web-search`, {
        query: query.trim()
      });
      
      const results = response.data.results;
      if (results && results.length > 0) {
        setSearchStatus('Found results!');
        const searchSummary = results.slice(0, 3).map((result, index) => 
          `${index + 1}. **${result.title}**\n   ${result.snippet}\n   Source: ${result.link}`
        ).join('\n\n');
        
        return `🔍 **Web Search Results:**\n\n${searchSummary}`;
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
        content: '', // No text, only image
        image: generatedImageUrl,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, imageMessage]);
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
    
    // Clear local storage
    localStorage.removeItem(`ai_chat_${userId}`);
    
    // Clear server history for logged-in users
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
    { icon: '🎨', text: 'Generate image', prompt: 'Create an image of ' },
    { icon: '📖', text: 'Explain concept', prompt: 'Explain this concept to me' },
    { icon: '🌐', text: 'Translate text', prompt: 'Translate this text' }
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
    // Invalid prompts: empty, just dots, single chars, unclear
    const invalidPatterns = /^(\.{1,}|\?{1,}|!{1,}|[a-z]{1,2}|hi|hey|hello)$/;
    return cleanText.length >= 3 && !invalidPatterns.test(cleanText);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;
    
    // Validate prompt if image is selected
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

    let messageContent = inputText;
    let imageText = '';
    
    // Process image if selected and prompt is valid
    if (selectedImage && isValidPrompt(inputText)) {
      setIsProcessingOCR(true);
      
      // Upload image to cloud storage first
      const imageUrl = await uploadImageToCloud(selectedImage);
      
      // Run OCR and captioning in parallel
      const [ocrText, caption] = await Promise.all([
        extractTextFromImage(selectedImage),
        generateImageCaption(selectedImage)
      ]);
      
      // Smart decision: use OCR if significant text found, otherwise use caption
      let imageAnalysis = '';
      if (ocrText && ocrText.length > 10) {
        // Significant text found, prioritize OCR
        imageAnalysis = `[Text in Image]: ${ocrText}`;
        if (caption) imageAnalysis += `\n[Image Context]: ${caption}`;
      } else if (caption) {
        // No significant text, use caption only
        imageAnalysis = `[Image Description]: ${caption}`;
      }
      
      if (imageAnalysis) {
        messageContent = inputText ? `${inputText}\n\n${imageAnalysis}` : imageAnalysis;
      }
      
      // Update user message with cloud URL instead of blob URL
      userMessage.image = imageUrl;
      
      setIsProcessingOCR(false);
    }
    
    // Don't modify messageContent here - let AI decide if search is needed

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageContent,
      image: selectedImage ? (isValidPrompt(inputText) ? null : URL.createObjectURL(selectedImage)) : null, // Will be updated after cloud upload
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
      
      // Check if AI wants to generate an image directly
      if (aiResult.generateImage) {
        await handleImageGeneration(aiResult.generateImage);
        return;
      }
      
      const response = aiResult.response || aiResult;
      
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
      
      // Auto-speak normal responses (skip confirmations)
      if (synthRef.current && response && !response.includes('Should I generate this image')) {
        setTimeout(() => speakText(response), 500);
      }
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
      conversationHistory: recentMessages,
      enableWebSearch: enableWebSearch
    });
    return response.data;
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-purple-900/20"></div>
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      </div>
      
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 border-b border-gray-800/50 backdrop-blur-xl bg-black/20 px-6 py-4"
      >
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <motion.div
                animate={isTyping ? {
                  boxShadow: [
                    "0 0 0 0 rgba(59, 130, 246, 0.8)",
                    "0 0 0 20px rgba(59, 130, 246, 0)"
                  ]
                } : {}}
                transition={{ duration: 2, repeat: isTyping ? Infinity : 0 }}
                className="relative"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5">
                  <div className="w-full h-full rounded-xl bg-black flex items-center justify-center">
                    <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">N</span>
                  </div>
                </div>
              </motion.div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">Neuraflow</h1>
              <p className="text-xs text-gray-400 font-medium">Advanced AI Assistant</p>
            </div>
          </div>
          
          {/* Header Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-gray-800/50 rounded-full border border-gray-700/50">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-300">Online</span>
            </div>
            
            <button
              onClick={() => setShowChatMenu(!showChatMenu)}
              className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors border border-gray-700/50"
            >
              <FaCog className="text-gray-400 text-sm" />
            </button>
            
            {showChatMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-full right-0 mt-2 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-700/50 p-2 min-w-48 z-50 shadow-2xl"
              >
                <button
                  onClick={clearChatHistory}
                  className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>🗑️</span>
                  <span>Clear History</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="relative z-10 border-b border-gray-800/30 px-6 py-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300">Quick Start</h3>
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {showQuickActions ? 'Show Less' : 'Show More'}
              </button>
            </div>
            <div className={`grid grid-cols-2 lg:grid-cols-3 gap-3 ${!showQuickActions ? 'max-h-24 overflow-hidden' : ''}`}>
              {quickActions.slice(0, showQuickActions ? quickActions.length : 4).map((action, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center space-x-3 p-4 bg-gray-900/50 hover:bg-gray-800/50 rounded-xl border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200 backdrop-blur-sm"
                >
                  <div className="text-xl group-hover:scale-110 transition-transform">{action.icon}</div>
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{action.text}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700">
        <div className="max-w-6xl mx-auto space-y-6">
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
                <div className={`flex items-start space-x-4 max-w-4xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className="flex-shrink-0 mt-1">
                    {message.type === 'bot' ? (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5">
                        <div className="w-full h-full rounded-lg bg-black flex items-center justify-center">
                          <span className="text-xs font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">N</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                        <FaUser className="text-gray-300 text-xs" />
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className={`group relative max-w-3xl ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-lg'
                        : 'bg-gray-900/50 backdrop-blur-sm border border-gray-700/30 text-gray-100 rounded-2xl rounded-tl-md px-4 py-3'
                    }`}
                  >
                    {message.image && (
                      <div className="mb-3">
                        <img 
                          src={message.image} 
                          alt="Uploaded" 
                          className="max-w-sm rounded-xl shadow-lg border border-gray-600/30"
                        />
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none prose-invert">
                      <MathText>{message.content}</MathText>
                    </div>
                    
                    {/* Message Actions */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-700/20">
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      {message.type === 'bot' && (
                        <button
                          onClick={() => speakText(message.content)}
                          className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-400 hover:text-blue-400 transition-colors rounded-md hover:bg-gray-800/30"
                          disabled={isSpeaking}
                        >
                          <FaVolumeUp className="text-xs" />
                          <span>{isSpeaking ? 'Playing' : 'Listen'}</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming Message */}
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start space-x-4 max-w-4xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5 mt-1">
                  <div className="w-full h-full rounded-lg bg-black flex items-center justify-center">
                    <span className="text-xs font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">N</span>
                  </div>
                </div>
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/30 text-gray-100 rounded-2xl rounded-tl-md px-4 py-3 max-w-3xl">
                  <div className="prose prose-sm max-w-none prose-invert">
                    <MathText>{streamingMessage}</MathText>
                    <span className="inline-block w-0.5 h-4 bg-blue-400 ml-1 animate-pulse"></span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Typing Indicator */}
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
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5 mt-1">
                    <div className="w-full h-full rounded-lg bg-black flex items-center justify-center">
                      <motion.span 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="text-xs font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
                      >
                        N
                      </motion.span>
                    </div>
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

      {/* Input Bar */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 border-t border-gray-800/30 backdrop-blur-xl bg-black/20 px-6 py-6"
      >
        <div className="max-w-6xl mx-auto">
          {/* Image Preview */}
          {selectedImage && (
            <div className="mb-4 flex items-center space-x-3 bg-gray-900/50 backdrop-blur-sm rounded-xl p-3 border border-gray-700/30">
              <img 
                src={URL.createObjectURL(selectedImage)} 
                alt="Selected" 
                className="w-12 h-12 object-cover rounded-lg border border-gray-600/30"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-200">{selectedImage.name}</p>
                {isProcessingOCR ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-32 bg-gray-700 rounded-full h-1.5">
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
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
          )}
          
          {/* Status Indicators */}
          {(isGeneratingImage || searchStatus) && (
            <div className="mb-4 flex items-center justify-center space-x-3 bg-gray-900/30 backdrop-blur-sm rounded-xl p-3 border border-gray-700/20">
              {isGeneratingImage && (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
                  <span className="text-sm text-purple-300">Creating image...</span>
                </>
              )}
              {searchStatus && (
                <>
                  <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-blue-300">{searchStatus}</span>
                </>
              )}
            </div>
          )}
          
          {/* Voice Hint */}
          {!isListening && !isTyping && !isStreaming && messages.length <= 1 && (
            <div className="mb-4 text-center">
              <p className="text-xs text-gray-500">
                Press <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs font-mono">Space</kbd> for voice • Multiple AI models • Real-time web search
              </p>
            </div>
          )}
          
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <motion.textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                placeholder={isListening ? "🎤 Listening..." : isGeneratingImage ? "🎨 Creating..." : enableWebSearch ? "Ask anything with web search 🌐" : selectedImage ? "What would you like to know about this image?" : "Message Neuraflow..."}
                className="w-full px-4 py-3 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 focus:border-blue-500/50 rounded-2xl focus:outline-none text-gray-100 placeholder-gray-400 transition-all duration-200 resize-none scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600"
                disabled={isTyping || isStreaming || isProcessingOCR || isListening || isGeneratingImage}
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
            {/* Control Panel */}
            <div className="flex items-center space-x-2">
              {/* Web Search Toggle */}
              <button
                onClick={() => setEnableWebSearch(!enableWebSearch)}
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  enableWebSearch 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50'
                }`}
                disabled={isTyping || isStreaming || isProcessingOCR}
                title={enableWebSearch ? 'Web search ON' : 'Enable web search'}
              >
                <FaSearch className="text-sm" />
              </button>
              
              {/* Voice Input */}
              <button
                onClick={isListening ? stopListening : startListening}
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  isListening 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50'
                }`}
                disabled={isTyping || isStreaming || isProcessingOCR}
                title={isListening ? 'Stop recording' : 'Voice input'}
              >
                {isListening ? <FaMicrophoneSlash className="text-sm" /> : <FaMicrophone className="text-sm" />}
              </button>
              
              {/* Image Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 bg-gray-800/50 text-gray-400 border border-gray-700/50 rounded-xl hover:bg-gray-700/50 transition-all duration-200"
                disabled={isTyping || isStreaming || isProcessingOCR}
                title="Upload image"
              >
                <FaImage className="text-sm" />
              </button>
              
              {/* Model Selector */}
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
            
            {/* Send Button */}
            <motion.button
              onClick={handleSendMessage}
              disabled={(!inputText.trim() && !selectedImage) || isTyping || isStreaming || isProcessingOCR}
              className={`p-3 rounded-xl transition-all duration-200 ${
                (!inputText.trim() && !selectedImage) || isTyping || isStreaming || isProcessingOCR
                  ? 'bg-gray-800/50 text-gray-500 border border-gray-700/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border border-blue-500/30 shadow-lg hover:shadow-xl'
              }`}
              whileHover={(!inputText.trim() && !selectedImage) || isTyping || isStreaming || isProcessingOCR ? {} : { scale: 1.05 }}
              whileTap={(!inputText.trim() && !selectedImage) || isTyping || isStreaming || isProcessingOCR ? {} : { scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: isTyping || isStreaming || isProcessingOCR ? 360 : 0 }}
                transition={{ duration: 1, repeat: (isTyping || isStreaming || isProcessingOCR) ? Infinity : 0, ease: "linear" }}
              >
                <FaPaperPlane className="text-sm" />
              </motion.div>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NeuraflowAIChat;