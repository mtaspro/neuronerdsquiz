import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs';
import qrcode from 'qrcode-terminal';

class WhatsAppService {
  constructor() {
    if (WhatsAppService.instance) {
      return WhatsAppService.instance;
    }
    
    this.sock = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.isInitializing = false;
    this.currentQR = null;
    this.groupMemories = new Map(); // Store last 10 messages per group/chat
    
    WhatsAppService.instance = this;
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('⚠️ WhatsApp initialization already in progress...');
      return;
    }
    
    if (this.isConnected) {
      console.log('✅ WhatsApp already connected');
      return;
    }
    
    this.isInitializing = true;
    
    try {
      // Check if session folder exists
      if (!fs.existsSync('./session')) {
        console.log('📱 Session folder not found. QR code scanning required.');
        console.log('🔄 Please scan the QR code below with your WhatsApp:');
      }
      
      const { state, saveCreds } = await useMultiFileAuthState('./session');
      
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: !fs.existsSync('./session')
      });

      this.sock.ev.on('creds.update', saveCreds);
      this.sock.ev.on('connection.update', (update) => {
        const { qr } = update;
        
        if (qr) {
          console.log('📱 Scan this QR code with WhatsApp:');
          qrcode.generate(qr, { small: true });
          this.currentQR = qr; // Store QR for web display
        }
        
        this.handleConnection(update);
      });

      // Listen for incoming messages
      this.sock.ev.on('messages.upsert', this.handleIncomingMessage.bind(this));
      
      console.log('WhatsApp service initialized');
    } catch (error) {
      console.error('WhatsApp initialization error:', error);
    } finally {
      this.isInitializing = false;
    }
  }

  handleConnection(update) {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error instanceof Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      console.log('Connection closed due to ', lastDisconnect?.error?.message || 'Unknown error');
      
      // Handle specific error cases
      if (lastDisconnect?.error?.message?.includes('conflict')) {
        console.log('⚠️ WhatsApp Web conflict detected. Another session is active.');
        console.log('💡 Close other WhatsApp Web sessions and restart server.');
        return; // Don't reconnect on conflict
      }
      
      if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(() => this.initialize(), 5000); // Wait 5 seconds before reconnecting
      } else {
        console.log('❌ Max reconnection attempts reached or logged out');
      }
      
      this.isConnected = false;
    } else if (connection === 'open') {
      console.log('✅ WhatsApp connected');
      this.isConnected = true;
      this.reconnectAttempts = 0; // Reset counter on successful connection
    }
  }

  async sendMessage(phoneNumber, message) {
    if (!this.isConnected || !this.sock) {
      console.log('❌ WhatsApp not connected');
      return { success: false, error: 'WhatsApp not connected' };
    }
    
    try {
      // Always remove + sign if present
      const cleanPhone = phoneNumber.replace('+', '');
      const jid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
      console.log(`📤 Sending to ${jid}: ${message}`);
      
      // Simple send without complex retry logic
      const result = await this.sock.sendMessage(jid, { 
        text: message 
      });
      
      console.log('✅ Message sent:', result?.key?.id || 'success');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Send failed:', error.message);
      
      // Try once more with different format
      try {
        const cleanRetryPhone = phoneNumber.replace('+', '');
        const jid = `${cleanRetryPhone}@s.whatsapp.net`;
        console.log(`🔄 Retry with format: ${jid}`);
        
        await this.sock.sendMessage(jid, { text: message });
        console.log('✅ Retry successful');
        return { success: true };
      } catch (retryError) {
        console.error('❌ Retry also failed:', retryError.message);
        return { success: false, error: `Both attempts failed: ${error.message}` };
      }
    }
  }



  async broadcastMessage(phoneNumbers, message) {
    if (!this.isConnected || !phoneNumbers.length) return false;
    
    const results = [];
    for (const phone of phoneNumbers) {
      const result = await this.sendMessage(phone, message);
      results.push({ phone, success: result });
    }
    return results;
  }

  getQRCode() {
    return this.currentQR;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasQR: !!this.currentQR,
      isInitializing: this.isInitializing
    };
  }

  async getGroups() {
    if (!this.isConnected || !this.sock) {
      return { success: false, error: 'WhatsApp not connected' };
    }

    try {
      const chats = await this.sock.groupFetchAllParticipating();
      const groups = Object.values(chats).map(group => ({
        id: group.id,
        name: group.subject,
        participants: group.participants?.length || 0
      }));
      
      return { success: true, groups };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendGroupMessage(groupId, message) {
    if (!this.isConnected || !this.sock) {
      return { success: false, error: 'WhatsApp not connected' };
    }

    try {
      console.log(`📤 Sending group message to ${groupId}: ${message}`);
      
      await this.sock.sendMessage(groupId, { text: message });
      console.log('✅ Group message sent successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Group message failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async handleIncomingMessage(m) {
    try {
      const message = m.messages[0];
      if (!message || message.key.fromMe) return; // Ignore our own messages

      const messageText = message.message?.conversation || 
                         message.message?.extendedTextMessage?.text || '';
      
      const chatId = message.key.remoteJid;
      const senderPhone = message.key.participant || chatId.replace('@s.whatsapp.net', '');
      const senderName = message.pushName || senderPhone;
      const isGroup = chatId.includes('@g.us');
      
      // Check for different message types
      const hasImage = message.message?.imageMessage;
      const hasVideo = message.message?.videoMessage;
      const hasAudio = message.message?.audioMessage;
      const hasDocument = message.message?.documentMessage;
      const hasSticker = message.message?.stickerMessage;
      const imageCaption = message.message?.imageMessage?.caption || '';
      
      // Store message in memory (last 10 messages) - only text and images with captions
      let memoryMessage = null;
      
      if (messageText && messageText.trim()) {
        // Regular text message
        memoryMessage = messageText;
      } else if (hasImage && imageCaption) {
        // Image with caption
        memoryMessage = `[Image: ${imageCaption}]`;
      } else if (hasImage) {
        // Image without caption - skip from memory
        console.log(`📷 Skipping image without caption from ${senderName}`);
      } else if (hasVideo || hasAudio || hasDocument || hasSticker) {
        // Other media types - skip from memory
        console.log(`📎 Skipping ${hasVideo ? 'video' : hasAudio ? 'audio' : hasDocument ? 'document' : 'sticker'} from ${senderName}`);
      }
      
      // Only add to memory if we have a valid message
      if (memoryMessage) {
        this.addToMemory(chatId, {
          sender: senderName,
          message: memoryMessage,
          timestamp: new Date(),
          isBot: false
        });
      }
      
      // React to certain messages automatically
      await this.autoReactToMessage(message, messageText);
      
      // Check for NeuraX mentions - both @n and native WhatsApp mentions
      const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const botJid = this.sock?.user?.id?.replace(':0', '@s.whatsapp.net');
      const isMentioned = mentionedJids.includes(botJid);
      
      if (messageText.startsWith('@n ') || imageCaption.startsWith('@n ') || isMentioned) {
        let actualMessage;
        if (messageText.startsWith('@n ')) {
          actualMessage = messageText.substring(3);
        } else if (imageCaption.startsWith('@n ')) {
          actualMessage = imageCaption.substring(3);
        } else if (isMentioned) {
          // Remove the mention from the message
          actualMessage = messageText.replace(/@\d+/g, '').trim();
        }
        
        if (actualMessage.startsWith('/help')) {
          // Handle help command
          await this.handleHelpRequest(chatId, senderName, isGroup);
        } else if (actualMessage.toLowerCase().includes('help') || actualMessage.toLowerCase().includes('manual') || actualMessage.toLowerCase().includes('how to use') || actualMessage === '') {
          // Tell user about help command
          await this.handleHelpInfo(chatId, senderName, isGroup);
        } else if (hasImage && (actualMessage.startsWith('/vision') || actualMessage.includes('analyze') || actualMessage.includes('describe'))) {
          // Handle vision request
          await this.handleVisionRequest(message, chatId, senderName, actualMessage, isGroup);
        } else if (actualMessage.startsWith('/search ')) {
          // Handle web search
          const query = actualMessage.substring(8); // Remove '/search '
          await this.handleWebSearch(chatId, senderName, query, isGroup);
        } else {
          // Handle regular NeuraX mention
          if (isGroup) {
            await this.handleNeuraXMention(chatId, senderName, actualMessage, true);
          } else {
            await this.handleNeuraXMention(chatId, senderName, actualMessage, false);
            await this.saveToUserInbox(senderPhone, senderName, actualMessage);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error handling incoming message:', error);
    }
  }

  addToMemory(chatId, messageData) {
    if (!this.groupMemories.has(chatId)) {
      this.groupMemories.set(chatId, []);
    }
    
    const messages = this.groupMemories.get(chatId);
    messages.push(messageData);
    
    // Keep only last 10 messages
    if (messages.length > 10) {
      messages.shift();
    }
    
    this.groupMemories.set(chatId, messages);
  }

  async handleNeuraXMention(chatId, senderName, message, isGroup) {
    try {
      console.log(`🤖 NeuraX mentioned by ${senderName}: ${message}`);
      
      // Show typing indicator
      await this.sendTypingIndicator(chatId);
      
      // Get conversation history
      const history = this.groupMemories.get(chatId) || [];
      
      // Create context for AI
      const conversationHistory = history.slice(-9).map(msg => ({
        role: msg.isBot ? 'assistant' : 'user',
        content: `${msg.sender}: ${msg.message}`
      }));
      
      // Add current message
      conversationHistory.push({
        role: 'user',
        content: `${senderName}: ${message}`
      });
      
      // Get AI response
      const aiResponse = await this.getNeuraXResponse(message, conversationHistory, senderName, isGroup);
      
      // Send response
      const responseText = isGroup ? `@${senderName} ${aiResponse}` : aiResponse;
      
      if (isGroup) {
        await this.sendGroupMessage(chatId, responseText);
      } else {
        await this.sendMessage(chatId, responseText);
      }
      
      // Stop typing indicator
      await this.stopTypingIndicator(chatId);
      
      // Add bot response to memory
      this.addToMemory(chatId, {
        sender: 'NeuraX',
        message: responseText,
        timestamp: new Date(),
        isBot: true
      });
      
    } catch (error) {
      console.error('❌ Error handling NeuraX mention:', error);
      const errorMsg = isGroup ? `@${senderName} Sorry, I'm having technical difficulties right now! 🤖💔` : 'Sorry, I\'m having technical difficulties right now! 🤖💔';
      
      if (isGroup) {
        await this.sendGroupMessage(chatId, errorMsg);
      } else {
        await this.sendMessage(chatId, errorMsg);
      }
    }
  }

  async handleHelpInfo(chatId, senderName, isGroup) {
    try {
      const helpInfo = `🤖 Hi! I'm NeuraX, your AI assistant. For detailed instructions, use: *@n /help*

Quick commands:
• @n /help - Full manual
• @n /search [query] - Web search
• @n /vision + image - Analyze images
• @n [message] - Chat with me`;
      
      const responseText = isGroup ? `@${senderName} ${helpInfo}` : helpInfo;
      
      if (isGroup) {
        await this.sendGroupMessage(chatId, responseText);
      } else {
        await this.sendMessage(chatId, responseText);
      }
      
    } catch (error) {
      console.error('❌ Help info error:', error);
    }
  }

  async handleHelpRequest(chatId, senderName, isGroup) {
    try {
      console.log(`❓ Help request from ${senderName}`);
      
      const helpText = `🤖 *NeuraX AI Assistant - User Manual*

👋 Hi! I'm NeuraX, your AI assistant from Neuronerds Quiz platform. Here's how to use me:

*💬 Basic Chat:*
• @n [your message] - Chat with me normally
• Example: @n hello, how are you?

*🔍 Web Search:*
• @n /search [query] - Search the web
• Example: @n /search latest AI news

*👁️ Vision Analysis:*
• Send image + @n /vision - Analyze images
• @n analyze this image - Describe photos
• Works with: OCR, charts, objects, scenes

*🎮 About Neuronerds Quiz:*
• Interactive quiz platform with battles
• Badge system & leaderboards
• Real-time competitions with friends
• Advanced AI-powered learning

*📱 Features:*
• I remember our last 10 messages
• I react to your messages automatically
• Available 24/7 in groups & personal chats

*Need more help?* Just ask: @n help with [topic]`;
      
      const responseText = isGroup ? `@${senderName}\n${helpText}` : helpText;
      
      if (isGroup) {
        await this.sendGroupMessage(chatId, responseText);
      } else {
        await this.sendMessage(chatId, responseText);
      }
      
      // Add to memory
      this.addToMemory(chatId, {
        sender: 'NeuraX',
        message: '[Help Manual Sent]',
        timestamp: new Date(),
        isBot: true
      });
      
    } catch (error) {
      console.error('❌ Help error:', error);
      const errorMsg = isGroup ? `@${senderName} Sorry, I can't show the manual right now! Try: @n /help` : 'Sorry, I can\'t show the manual right now! Try: @n /help';
      
      if (isGroup) {
        await this.sendGroupMessage(chatId, errorMsg);
      } else {
        await this.sendMessage(chatId, errorMsg);
      }
    }
  }

  async getNeuraXResponse(message, conversationHistory, senderName, isGroup) {
    try {
      const axios = (await import('axios')).default;
      const apiUrl = process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:5000';
      
      const systemPrompt = isGroup 
        ? `You are NeuraX, an advanced AI assistant and active member of this WhatsApp group. You're part of the Neuronerds Quiz platform - an interactive learning platform with quiz battles, badges, leaderboards, and AI-powered education.

About Neuronerds Quiz:
- Interactive quiz platform where students compete with friends
- Real-time battle system with live competitions
- Comprehensive badge system (15+ unique achievements)
- Global leaderboards and progress tracking
- Advanced AI integration for personalized learning
- WhatsApp integration for seamless communication
- Vision analysis, web search, and conversational AI

Your capabilities:
- Answer questions and have conversations
- Web search: /search [query]
- Image analysis: /vision or "analyze this image"
- Remember last 10 messages for context
- React to messages automatically
- Help users with platform features

Be helpful, friendly, engaging, and knowledgeable about education and technology. Keep responses concise (max 2-3 sentences) and use emojis appropriately. Respond naturally as a group member would.`
        : `You are NeuraX, an advanced AI assistant chatting personally with ${senderName} on WhatsApp. You're part of the Neuronerds Quiz platform - an innovative learning platform that revolutionizes education through interactive quizzes, real-time battles, and AI-powered features.

About Neuronerds Quiz:
- Students compete in quiz battles with friends
- Comprehensive achievement system with unique badges
- Global leaderboards and progress tracking
- AI-powered personalized learning experiences
- Advanced features: vision analysis, web search, conversational AI

Your capabilities:
- Engaging conversations and educational support
- Web search with /search command
- Image analysis with /vision command
- Context awareness (remember last 10 messages)
- Automatic reactions to messages

Be helpful, friendly, conversational, and educational. Keep responses concise and engaging while being knowledgeable about learning and technology.`;
      
      const response = await axios.post(`${apiUrl}/api/ai-chat`, {
        message: message,
        model: 'qwen/qwen3-32b',
        systemPrompt: systemPrompt,
        conversationHistory: conversationHistory
      });
      
      return response.data.response;
    } catch (error) {
      console.error('❌ Error getting AI response:', error);
      return 'I\'m having trouble thinking right now! 🤔 Try again in a moment.';
    }
  }

  async handleVisionRequest(message, chatId, senderName, prompt, isGroup) {
    try {
      console.log(`👁️ Vision request from ${senderName}`);
      
      // Show typing indicator
      await this.sendTypingIndicator(chatId);
      
      // Download image
      const imageBuffer = await this.sock.downloadMediaMessage(message);
      const base64Image = imageBuffer.toString('base64');
      
      // Get vision analysis
      const analysis = await this.getVisionAnalysis(base64Image, prompt);
      
      const responseText = isGroup ? `@${senderName} ${analysis}` : analysis;
      
      if (isGroup) {
        await this.sendGroupMessage(chatId, responseText);
      } else {
        await this.sendMessage(chatId, responseText);
      }
      
      // Stop typing indicator
      await this.stopTypingIndicator(chatId);
      
      // Add to memory
      this.addToMemory(chatId, {
        sender: 'NeuraX',
        message: responseText,
        timestamp: new Date(),
        isBot: true
      });
      
    } catch (error) {
      console.error('❌ Vision error:', error);
      const errorMsg = isGroup ? `@${senderName} Sorry, I couldn't analyze the image! 👁️💔` : 'Sorry, I couldn\'t analyze the image! 👁️💔';
      
      if (isGroup) {
        await this.sendGroupMessage(chatId, errorMsg);
      } else {
        await this.sendMessage(chatId, errorMsg);
      }
    }
  }

  async handleWebSearch(chatId, senderName, query, isGroup) {
    try {
      console.log(`🔍 Web search from ${senderName}: ${query}`);
      
      // Show typing indicator
      await this.sendTypingIndicator(chatId);
      
      const searchResults = await this.performWebSearch(query);
      
      const responseText = isGroup ? `@${senderName} ${searchResults}` : searchResults;
      
      if (isGroup) {
        await this.sendGroupMessage(chatId, responseText);
      } else {
        await this.sendMessage(chatId, responseText);
      }
      
      // Stop typing indicator
      await this.stopTypingIndicator(chatId);
      
      
      // Add to memory
      this.addToMemory(chatId, {
        sender: 'NeuraX',
        message: responseText,
        timestamp: new Date(),
        isBot: true
      });
      
    } catch (error) {
      console.error('❌ Search error:', error);
      const errorMsg = isGroup ? `@${senderName} Sorry, I couldn't search right now! 🔍💔` : 'Sorry, I couldn\'t search right now! 🔍💔';
      
      if (isGroup) {
        await this.sendGroupMessage(chatId, errorMsg);
      } else {
        await this.sendMessage(chatId, errorMsg);
      }
    }
  }

  async getVisionAnalysis(base64Image, prompt) {
    try {
      const axios = (await import('axios')).default;
      const apiUrl = process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await axios.post(`${apiUrl}/api/vision-analyze`, {
        image: base64Image,
        prompt: prompt || 'Analyze this image and describe what you see in detail.'
      });
      
      return response.data.analysis || 'I can see the image but couldn\'t analyze it properly.';
    } catch (error) {
      console.error('❌ Vision API error:', error);
      return 'I\'m having trouble with my vision right now! 👁️🤖';
    }
  }

  async performWebSearch(query) {
    try {
      const axios = (await import('axios')).default;
      const apiUrl = process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await axios.post(`${apiUrl}/api/web-search`, {
        query: query
      });
      
      const results = response.data.results;
      if (!results || results.length === 0) {
        return `No results found for "${query}" 🔍`;
      }
      
      // Format top 3 results
      const topResults = results.slice(0, 3).map((result, index) => 
        `${index + 1}. ${result.title}\n${result.snippet}\n🔗 ${result.url}`
      ).join('\n\n');
      
      return `🔍 Search results for "${query}":\n\n${topResults}`;
    } catch (error) {
      console.error('❌ Web search error:', error);
      return 'I\'m having trouble searching the web right now! 🔍🤖';
    }
  }

  async autoReactToMessage(message, messageText) {
    try {
      const lowerText = messageText.toLowerCase();
      let reaction = null;
      
      // Define reaction patterns
      if (lowerText.includes('good') || lowerText.includes('great') || lowerText.includes('awesome') || lowerText.includes('excellent')) {
        reaction = '👍';
      } else if (lowerText.includes('love') || lowerText.includes('❤️') || lowerText.includes('💕')) {
        reaction = '❤️';
      } else if (lowerText.includes('funny') || lowerText.includes('haha') || lowerText.includes('😂') || lowerText.includes('lol')) {
        reaction = '😂';
      } else if (lowerText.includes('sad') || lowerText.includes('😢') || lowerText.includes('cry')) {
        reaction = '😢';
      } else if (lowerText.includes('wow') || lowerText.includes('amazing') || lowerText.includes('incredible')) {
        reaction = '😮';
      } else if (lowerText.includes('thanks') || lowerText.includes('thank you') || lowerText.includes('grateful')) {
        reaction = '🙏';
      } else if (lowerText.includes('fire') || lowerText.includes('🔥') || lowerText.includes('lit')) {
        reaction = '🔥';
      } else if (lowerText.includes('party') || lowerText.includes('celebrate') || lowerText.includes('🎉')) {
        reaction = '🎉';
      }
      
      // React with 30% probability to avoid spam
      if (reaction && Math.random() < 0.3) {
        await this.reactToMessage(message.key, reaction);
        console.log(`🤖 NeuraX reacted with ${reaction}`);
      }
    } catch (error) {
      console.error('❌ Auto reaction error:', error);
    }
  }

  async reactToMessage(messageKey, emoji) {
    try {
      if (!this.isConnected || !this.sock) {
        return { success: false, error: 'WhatsApp not connected' };
      }
      
      await this.sock.sendMessage(messageKey.remoteJid, {
        react: {
          text: emoji,
          key: messageKey
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Reaction failed:', error);
      return { success: false, error: error.message };
    }
  }

  async sendTypingIndicator(chatId) {
    try {
      if (!this.isConnected || !this.sock) {
        return;
      }
      
      // Show native WhatsApp typing indicator
      await this.sock.sendPresenceUpdate('composing', chatId);
      console.log(`⌨️ NeuraX typing indicator shown`);
      
    } catch (error) {
      console.error('❌ Typing indicator error:', error);
    }
  }

  async stopTypingIndicator(chatId) {
    try {
      if (!this.isConnected || !this.sock) {
        return;
      }
      
      await this.sock.sendPresenceUpdate('paused', chatId);
    } catch (error) {
      console.error('❌ Stop typing error:', error);
    }
  }

  async saveToUserInbox(senderPhone, senderName, message) {
    try {
      const User = (await import('../models/User.js')).default;
      const UserMessage = (await import('../models/UserMessage.js')).default;
      
      // Try to find user by phone number (handle both +880 and 880 formats)
      let recipient = await User.findOne({ phoneNumber: senderPhone });
      
      // If not found, try with +880 prefix
      if (!recipient && !senderPhone.startsWith('+')) {
        recipient = await User.findOne({ phoneNumber: `+${senderPhone}` });
      }
      
      // If still not found, try without +880 prefix
      if (!recipient && senderPhone.startsWith('+')) {
        recipient = await User.findOne({ phoneNumber: senderPhone.substring(1) });
      }
      
      if (!recipient) {
        console.log(`⚠️ No user found with phone ${senderPhone}`);
        return;
      }

      // Save message to inbox
      const inboxMessage = new UserMessage({
        recipientId: recipient._id,
        senderPhone: senderPhone,
        senderName: senderName,
        message: message
      });
      
      await inboxMessage.save();
      console.log(`✅ Message saved to ${recipient.username}'s inbox`);
    } catch (error) {
      console.error('❌ Error saving to inbox:', error);
    }
  }
}

// Ensure only one instance per process
if (!global.whatsappServiceInstance) {
  global.whatsappServiceInstance = new WhatsAppService();
}

export default global.whatsappServiceInstance;