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
    
    // Rate limiting
    this.messageRequests = new Map(); // userId -> [timestamps]
    this.imageRequests = new Map(); // userId -> [timestamps]
    
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
      
      // Listen for poll responses
      this.sock.ev.on('messages.update', this.handlePollUpdate.bind(this));
      
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

  async broadcastBattleNotification(phoneNumbers, roomId, chapter) {
    if (!this.isConnected || !phoneNumbers.length) return false;
    
    const spectatorUrl = `https://neuronerdsquiz.vercel.app/spectator/${roomId}`;
    const message = `🔥 *QUIZ BATTLE STARTED!* 🔥

⚔️ Chapter: *${chapter}*
🎯 The epic battle has begun!

👁️ *Watch Live:* ${spectatorstUrl}

💡 Or go to Dashboard → Watch Battle

Don't miss the action! ⚡`;
    
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
        participants: group.participants?.length || 0,
        participantList: group.participants || []
      }));
      
      return { success: true, groups };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getGroupInfo(groupId) {
    if (!this.isConnected || !this.sock) {
      return { success: false, error: 'WhatsApp not connected' };
    }

    try {
      const groupMetadata = await this.sock.groupMetadata(groupId);
      return {
        success: true,
        info: {
          id: groupMetadata.id,
          name: groupMetadata.subject,
          description: groupMetadata.desc,
          participants: groupMetadata.participants,
          admins: groupMetadata.participants.filter(p => p.admin),
          createdAt: new Date(groupMetadata.creation * 1000)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async findGroupByName(groupName) {
    try {
      if (!this.sock) return null;
      
      const chats = await this.sock.groupFetchAllParticipating();
      const groups = Object.values(chats);
      
      console.log(`🔍 Searching for group: "${groupName}"`);
      console.log(`📋 Available groups: ${groups.map(g => `"${g.subject}"`).join(', ')}`);
      
      // Try exact match first
      let group = groups.find(g => g.subject === groupName);
      
      // Try case-insensitive exact match
      if (!group) {
        group = groups.find(g => g.subject?.toLowerCase() === groupName.toLowerCase());
      }
      
      // Try partial match as fallback
      if (!group) {
        group = groups.find(g => g.subject?.toLowerCase().includes(groupName.toLowerCase()));
      }
      
      if (group) {
        console.log(`✅ Found group: "${group.subject}" (${group.id})`);
      } else {
        console.log(`❌ Group not found: "${groupName}"`);
      }
      
      return group;
    } catch (error) {
      console.error('❌ Error finding group:', error);
      return null;
    }
  }

  async sendGroupMessage(groupId, message, options = {}) {
    if (!this.isConnected || !this.sock) {
      return { success: false, error: 'WhatsApp not connected' };
    }

    try {
      console.log(`📤 Sending group message to ${groupId}: ${message}`);
      
      const messageContent = { text: message };
      
      // Add mentions if provided
      if (options.mentions && options.mentions.length > 0) {
        messageContent.mentions = options.mentions;
      }
      
      await this.sock.sendMessage(groupId, messageContent);
      console.log('✅ Group message sent successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Group message failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendFormattedMessage(chatId, text, formatting = {}) {
    if (!this.isConnected || !this.sock) {
      return { success: false, error: 'WhatsApp not connected' };
    }

    try {
      let formattedText = text;
      
      // Apply formatting
      if (formatting.bold) formattedText = `*${formattedText}*`;
      if (formatting.italic) formattedText = `_${formattedText}_`;
      if (formatting.monospace) formattedText = `\`\`\`${formattedText}\`\`\``;
      if (formatting.strikethrough) formattedText = `~${formattedText}~`;
      
      await this.sock.sendMessage(chatId, { text: formattedText });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendPoll(chatId, question, options) {
    if (!this.isConnected || !this.sock) {
      return { success: false, error: 'WhatsApp not connected' };
    }

    try {
      const poll = {
        name: question,
        values: options,
        selectableCount: 1
      };
      
      await this.sock.sendMessage(chatId, { poll });
      console.log(`📊 Poll sent: ${question}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Poll failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendMessageToGroup(groupNameOrId, message, options = {}) {
    try {
      let targetGroupId;
      
      // Check if it's already a group ID
      if (groupNameOrId.includes('@g.us')) {
        targetGroupId = groupNameOrId;
      } else {
        // Find group by name
        const group = await this.findGroupByName(groupNameOrId);
        if (!group) {
          return { success: false, error: `Group '${groupNameOrId}' not found` };
        }
        targetGroupId = group.id;
      }
      
      return await this.sendGroupMessage(targetGroupId, message, options);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendPollToGroup(groupNameOrId, question, options) {
    try {
      let targetGroupId;
      
      if (groupNameOrId.includes('@g.us')) {
        targetGroupId = groupNameOrId;
      } else {
        const group = await this.findGroupByName(groupNameOrId);
        if (!group) {
          return { success: false, error: `Group '${groupNameOrId}' not found` };
        }
        targetGroupId = group.id;
      }
      
      return await this.sendPoll(targetGroupId, question, options);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleIncomingMessage(m) {
    try {
      const message = m.messages[0];
      if (!message || message.key.fromMe) return; // Ignore our own messages

      const messageText = message.message?.conversation || 
                         message.message?.extendedTextMessage?.text || '';
      
      // Check for quoted/replied message
      const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      let quotedText = '';
      if (quotedMessage) {
        quotedText = quotedMessage.conversation || 
                    quotedMessage.extendedTextMessage?.text || 
                    quotedMessage.imageMessage?.caption || 
                    '[Media message]';
      }
      
      // Extract mentioned users (native WhatsApp mentions)
      const userMentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      let mentionContext = '';
      if (userMentionedJids.length > 0 && isGroup) {
        try {
          const groupMetadata = await this.sock.groupMetadata(chatId);
          const mentionedNames = userMentionedJids.map(jid => {
            const participant = groupMetadata.participants.find(p => p.id === jid);
            return participant?.notify || participant?.name || jid.split('@')[0];
          }).join(', ');
          mentionContext = ` (mentioning: ${mentionedNames})`;
        } catch (error) {
          console.log('Could not fetch group metadata for mentions');
        }
      }
      
      const chatId = message.key.remoteJid;
      const isGroup = chatId.includes('@g.us');
      
      // Extract phone number properly
      let senderPhone;
      let isWebUser = false;
      
      if (isGroup) {
        const participant = message.key.participant || '';
        
        if (participant.includes('@lid')) {
          // WhatsApp Web/Desktop user - allow without registration check
          senderPhone = participant;
          isWebUser = true;
          console.log(`🌐 WhatsApp Web user detected: ${participant}`);
        } else {
          senderPhone = this.extractPhoneNumber(participant);
        }
      } else {
        if (chatId.includes('@lid')) {
          senderPhone = chatId;
          isWebUser = true;
          console.log(`🌐 WhatsApp Web user detected: ${chatId}`);
        } else {
          senderPhone = this.extractPhoneNumber(chatId);
        }
      }
      
      console.log(`📱 Raw participant: ${message.key.participant}`);
      console.log(`📱 Extracted phone: ${senderPhone}`);
      console.log(`🌐 Is Web User: ${isWebUser}`);
      
      const senderName = message.pushName || senderPhone;
      
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
      
      // Check for NeuraX mentions - both @n and native WhatsApp mentions
      const botMentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const botJid = this.sock?.user?.id?.replace(':0', '@s.whatsapp.net');
      const isMentioned = botMentionedJids.includes(botJid);
      
      const shouldRespond = messageText.startsWith('@n ') || imageCaption.startsWith('@n ') || isMentioned || !isGroup;
      
      if (shouldRespond) {
        // Check rate limits first
        const userId = senderPhone || chatId;
        const rateLimitResult = this.checkRateLimit(userId, 'message');
        
        if (!rateLimitResult.allowed) {
          const errorMsg = isGroup ? `@${senderName} Please wait ${rateLimitResult.waitTime} seconds before sending another message! ⏰` : `Please wait ${rateLimitResult.waitTime} seconds before sending another message! ⏰`;
          
          if (isGroup) {
            await this.sendGroupMessage(chatId, errorMsg);
          } else {
            await this.sendMessage(chatId, errorMsg);
          }
          return;
        }
        
        // React to messages only when bot is mentioned or in personal chat
        await this.autoReactToMessage(message, messageText);
        // Check if user is registered (skip check for WhatsApp Web users)
        if (!isWebUser) {
          const isRegistered = await this.checkUserRegistration(senderPhone);
          
          if (!isRegistered) {
            await this.handleUnregisteredUser(chatId, senderName, isGroup);
            return;
          }
        } else {
          console.log(`🌐 Allowing WhatsApp Web user ${senderName} without registration check`);
        }
        
        let actualMessage;
        if (messageText.startsWith('@n ')) {
          actualMessage = messageText.substring(3);
        } else if (imageCaption.startsWith('@n ')) {
          actualMessage = imageCaption.substring(3);
        } else if (isMentioned) {
          // For native mentions, use the full message text
          actualMessage = messageText.trim();
        } else if (!isGroup) {
          // In personal chat, respond to any message
          actualMessage = messageText || imageCaption;
        }
        
        if (actualMessage) {
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
          } else if (actualMessage.startsWith('/groups')) {
            // List all available groups with numbers
            const groups = await this.getGroups();
            if (groups.success && groups.groups.length > 0) {
              let groupList = '*📋 Available Groups:*\n\n';
              groups.groups.forEach((group, index) => {
                groupList += `${index + 1}. ${group.name} (${group.participants} members)\n`;
              });
              groupList += '\n💡 Use: @n /send [number] [message]\nExample: @n /send 1 Hello everyone!';
              
              const responseMsg = isGroup ? `@${senderName}\n${groupList}` : groupList;
              
              if (isGroup) {
                await this.sendGroupMessage(chatId, responseMsg);
              } else {
                await this.sendMessage(chatId, responseMsg);
              }
            } else {
              const errorMsg = isGroup ? `@${senderName} ❌ No groups found or error: ${groups.error}` : `❌ No groups found or error: ${groups.error}`;
              
              if (isGroup) {
                await this.sendGroupMessage(chatId, errorMsg);
              } else {
                await this.sendMessage(chatId, errorMsg);
              }
            }
          } else if (actualMessage.startsWith('/send ')) {
            // Handle cross-group messaging: /send [group_name_or_number] [message]
            const sendContent = actualMessage.substring(6).trim();
            const spaceIndex = sendContent.indexOf(' ');
            
            if (spaceIndex === -1) {
              const errorMsg = isGroup ? `@${senderName} Format: /send [group_name_or_number] [message]\nExample: /send 1 Hello everyone!\nOr: /send Study Group Hello!\n\nUse @n /groups to see all groups` : 'Format: /send [group_name_or_number] [message]\nExample: /send 1 Hello everyone!\nOr: /send Study Group Hello!\n\nUse @n /groups to see all groups';
              
              if (isGroup) {
                await this.sendGroupMessage(chatId, errorMsg);
              } else {
                await this.sendMessage(chatId, errorMsg);
              }
              return;
            }
            
            const targetGroup = sendContent.substring(0, spaceIndex).trim();
            const messageToSend = sendContent.substring(spaceIndex + 1).trim();
            
            if (!messageToSend) {
              const errorMsg = isGroup ? `@${senderName} Please provide a message to send!` : 'Please provide a message to send!';
              
              if (isGroup) {
                await this.sendGroupMessage(chatId, errorMsg);
              } else {
                await this.sendMessage(chatId, errorMsg);
              }
              return;
            }
            
            let targetGroupName = targetGroup;
            
            // Check if it's a number (group index)
            if (/^\d+$/.test(targetGroup)) {
              const groupIndex = parseInt(targetGroup) - 1;
              const groups = await this.getGroups();
              
              if (groups.success && groups.groups[groupIndex]) {
                targetGroupName = groups.groups[groupIndex].name;
              } else {
                const errorMsg = isGroup ? `@${senderName} ❌ Invalid group number. Use @n /groups to see available groups` : '❌ Invalid group number. Use @n /groups to see available groups';
                
                if (isGroup) {
                  await this.sendGroupMessage(chatId, errorMsg);
                } else {
                  await this.sendMessage(chatId, errorMsg);
                }
                return;
              }
            }
            
            const result = await this.sendMessageToGroup(targetGroupName, messageToSend);
            
            if (result.success) {
              const confirmMsg = isGroup ? `@${senderName} ✅ Message sent to "${targetGroupName}"` : `✅ Message sent to "${targetGroupName}"`;
              
              if (isGroup) {
                await this.sendGroupMessage(chatId, confirmMsg);
              } else {
                await this.sendMessage(chatId, confirmMsg);
              }
            } else {
              const errorMsg = isGroup ? `@${senderName} ❌ Failed to send: ${result.error}` : `❌ Failed to send: ${result.error}`;
              
              if (isGroup) {
                await this.sendGroupMessage(chatId, errorMsg);
              } else {
                await this.sendMessage(chatId, errorMsg);
              }
            }
          } else if (actualMessage.startsWith('/poll ')) {
            // Handle poll creation
            const pollContent = actualMessage.substring(6).trim();
            const lines = pollContent.split('\n');
            const question = lines[0];
            const options = lines.slice(1)
              .filter(line => line.trim().startsWith('-'))
              .map(line => line.trim().substring(1).trim())
              .slice(0, 12); // WhatsApp limit

            if (options.length < 2) {
              const errorMsg = isGroup ? `@${senderName} Poll needs at least 2 options. Format:\n/poll Question?\n- Option 1\n- Option 2` : 'Poll needs at least 2 options. Format:\n/poll Question?\n- Option 1\n- Option 2';
              
              if (isGroup) {
                await this.sendGroupMessage(chatId, errorMsg);
              } else {
                await this.sendMessage(chatId, errorMsg);
              }
              return;
            }

            const result = await this.sendPoll(chatId, question, options);
            if (!result.success) {
              const errorMsg = isGroup ? `@${senderName} Failed to create poll: ${result.error}` : `Failed to create poll: ${result.error}`;
              if (isGroup) {
                await this.sendGroupMessage(chatId, errorMsg);
              } else {
                await this.sendMessage(chatId, errorMsg);
              }
            }
          } else if (actualMessage.startsWith('/generate ') || actualMessage.startsWith('/image ')) {
            // Handle image generation
            const prompt = actualMessage.startsWith('/generate ') ? 
              actualMessage.substring(10).trim() : actualMessage.substring(7).trim();
            
            if (!prompt) {
              const errorMsg = isGroup ? `@${senderName} Please provide a description after /generate. Example: @n /generate sunset over mountains` : 'Please provide a description after /generate. Example: /generate sunset over mountains';
              
              if (isGroup) {
                await this.sendGroupMessage(chatId, errorMsg);
              } else {
                await this.sendMessage(chatId, errorMsg);
              }
              return;
            }
            
            // Check image generation rate limit
            const userId = senderPhone || chatId;
            const imageRateLimit = this.checkRateLimit(userId, 'image');
            
            if (!imageRateLimit.allowed) {
              const minutes = Math.floor(imageRateLimit.waitTime / 60);
              const seconds = imageRateLimit.waitTime % 60;
              const timeStr = minutes > 0 ? `${minutes} minutes ${seconds} seconds` : `${seconds} seconds`;
              const errorMsg = isGroup ? `@${senderName} Image generation limit reached! Please wait ${timeStr} before generating another image! 🎨⏰` : `Image generation limit reached! Please wait ${timeStr} before generating another image! 🎨⏰`;
              
              if (isGroup) {
                await this.sendGroupMessage(chatId, errorMsg);
              } else {
                await this.sendMessage(chatId, errorMsg);
              }
              return;
            }
            
            await this.handleImageGeneration(chatId, senderName, prompt, isGroup);
            return; // Important: Return here to prevent falling through to regular chat
          } else {
            // Handle regular NeuraX mention
            if (isGroup) {
              await this.handleNeuraXMention(chatId, senderName, actualMessage, true, quotedText, mentionContext);
            } else {
              await this.handleNeuraXMention(chatId, senderName, actualMessage, false, quotedText, mentionContext);
              // Only save to inbox for registered users (not web users)
              if (!isWebUser) {
                await this.saveToUserInbox(senderPhone, senderName, actualMessage);
              }
            }
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

  async handleNeuraXMention(chatId, senderName, message, isGroup, quotedText = '', mentionContext = '') {
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
      
      // Add current message with quoted and mention context
      let userMessage = `${senderName}${mentionContext}`;
      if (quotedText) {
        userMessage += ` (replying to: "${quotedText}")`;
      }
      userMessage += `: ${message}`;
      
      conversationHistory.push({
        role: 'user',
        content: userMessage
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
      const helpInfo = `🤖 Hi! I'm NeuraX Omega, your AI assistant. For detailed instructions, use: *@n /help*

Quick commands:
• @n /help - Full manual
• @n /search [query] - Web search
• @n /generate [prompt] - Create images
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
      
      const helpText = `🤖 *NeuraX Omega AI Assistant - User Manual*

👋 Hi! I'm NeuraX Omega, your AI assistant from Neuronerds Quiz platform. Here's how to use me:

*💬 Basic Chat:*
• @n [your message] - Chat with me normally
• Example: @n hello, how are you?

*🔍 Web Search:*
• @n /search [query] - Search the web
• Example: @n /search latest AI news

*📊 Create Polls:*
• @n /poll [question]
• Format options with dashes:
• Example: @n /poll Favorite subject?
- Math
- Physics
- Chemistry

*📨 Send to Group:*
• @n /groups - List all groups with numbers
• @n /send [number] [message] - Send by group number
• @n /send [group_name] [message] - Send by group name
• Example: @n /send 1 Hello everyone!

*🎨 Image Generation:*
• @n /generate [description] - Create images
• @n /image [description] - Alternative command
• Example: @n /generate sunset over mountains

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
        sender: 'NeuraX Omega',
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
        ? `You are NeuraX Omega, an AI assistant for WhatsApp group *The NeuroNERDS* - a student community from Chattogram College, Bangladesh.

🎯 **WhatsApp Group Guidelines:**
• Keep responses SHORT (1-2 lines max)
• Use WhatsApp formatting: *bold*, _italic_, ~strikethrough~
• Add relevant emojis for engagement
• Be casual and friendly like a group member
• Respond quickly to maintain conversation flow

📱 **WhatsApp Formatting:**
• *Bold text* for emphasis
• _Italic text_ for subtle points
• Use bullet points (•) for lists
• Add emojis naturally 😊
• Keep paragraphs short
• Use line breaks for readability

🤖 **Your Role:**
• Help with studies and homework
• Answer questions quickly
• Share study tips
• Be encouraging and motivational
• Remember you're chatting in a group

Be helpful, concise, and engaging! 🚀`
        : `You are NeuraX Omega, an AI assistant for personal WhatsApp chat with ${senderName}. You're part of Neuronerds Quiz platform.

👥 **Community Info:**
*The NeuroNERDS* - Student community from Chattogram College
• *Akhyar Fardin* – CEO & Admin
• *Ahmed Azmain Mahtab* – Developer & Management Lead  
• *Md. Tanvir Mahtab* – Co-founder & Managing Director
• Students from Intermediate classes

📱 **WhatsApp Personal Chat Style:**
• Use WhatsApp formatting: *bold*, _italic_, ~strikethrough~
• Keep responses conversational and friendly
• Add emojis naturally for warmth
• Be more detailed than group responses
• Use proper spacing and line breaks
• Reply in Bengali if user prefers

🎯 **Your Approach:**
• Be helpful and educational
• Share study strategies
• Provide gentle motivation
• Answer questions thoroughly
• Use smooth call-to-actions like "Want to know more? 😊"

Be friendly, knowledgeable, and supportive! ✨`;
      
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
      
      // Download image using correct Baileys method
      const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
      const imageBuffer = await downloadMediaMessage(message, 'buffer', {});
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
      let errorMsg;
      
      if (error.message?.includes('downloadMediaMessage')) {
        errorMsg = isGroup ? `@${senderName} Please send the image again - I had trouble downloading it! 📷` : 'Please send the image again - I had trouble downloading it! 📷';
      } else {
        errorMsg = isGroup ? `@${senderName} Sorry, I couldn't analyze the image! 👁️💔` : 'Sorry, I couldn\'t analyze the image! 👁️💔';
      }
      
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
      
      // Convert base64 to buffer for FormData
      const imageBuffer = Buffer.from(base64Image, 'base64');
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      
      formData.append('image', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
      formData.append('prompt', prompt || 'Analyze this image and describe what you see in detail.');
      
      const response = await axios.post(`${apiUrl}/api/vision/analyze`, formData, {
        headers: {
          ...formData.getHeaders()
        }
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

  async handleImageGeneration(chatId, senderName, prompt, isGroup) {
    try {
      console.log(`🎨 Image generation from ${senderName}: ${prompt}`);
      
      // Show typing indicator
      await this.sendTypingIndicator(chatId);
      
      const imageUrl = await this.generateImage(prompt);
      const responseText = isGroup ? `@${senderName} 🎨 Generated image: "${prompt}"` : `🎨 Generated image: "${prompt}"`;
      
      // Send image with caption
      const result = await this.sendImageMessage(chatId, imageUrl, responseText);
      
      if (!result.success) {
        throw new Error('Failed to send image message');
      }
      
      console.log('✅ Image generated and sent successfully');
      
    } catch (error) {
      console.error('❌ Image generation error:', error);
      
      let errorMsg;
      if (error.message === 'Prompt too short') {
        errorMsg = isGroup ? `@${senderName} Please provide a more detailed description (at least 3 characters)` : 'Please provide a more detailed description (at least 3 characters)';
      } else if (error.response?.status === 429) {
        errorMsg = isGroup ? `@${senderName} Image generation limit reached. Please try again later! ⏰` : 'Image generation limit reached. Please try again later! ⏰';
      } else if (error.response?.status === 401) {
        errorMsg = isGroup ? `@${senderName} Image generation service unavailable. Please try again later! 🔧` : 'Image generation service unavailable. Please try again later! 🔧';
      } else {
        errorMsg = isGroup ? `@${senderName} Sorry, I couldn't generate that image! The service might be unavailable. 🎨💔` : 'Sorry, I couldn\'t generate that image! The service might be unavailable. 🎨💔';
      }
      
      if (isGroup) {
        await this.sendGroupMessage(chatId, errorMsg);
      } else {
        await this.sendMessage(chatId, errorMsg);
      }
    } finally {
      // Stop typing indicator
      await this.stopTypingIndicator(chatId);
    }
  }

  async generateImage(prompt) {
    try {
      if (!prompt || prompt.trim().length < 3) {
        throw new Error('Prompt too short');
      }
      
      console.log(`📞 Calling image generation API with prompt: ${prompt}`);
      
      const axios = (await import('axios')).default;
      const apiUrl = process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await axios.post(`${apiUrl}/api/generate-image`, {
        prompt: prompt.trim()
      });
      
      console.log(`📞 API Response:`, response.data);
      
      if (!response.data.imageUrl) {
        throw new Error('No image URL returned from API');
      }
      
      console.log(`✅ Image URL received: ${response.data.imageUrl}`);
      return response.data.imageUrl;
    } catch (error) {
      console.error('❌ Image generation API error:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendImageMessage(chatId, imageUrl, caption) {
    try {
      if (!this.isConnected || !this.sock) {
        return { success: false, error: 'WhatsApp not connected' };
      }
      
      console.log(`📷 Downloading image from: ${imageUrl}`);
      
      // Download image from URL
      const axios = (await import('axios')).default;
      const imageResponse = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const imageBuffer = Buffer.from(imageResponse.data);
      console.log(`📷 Image downloaded, size: ${imageBuffer.length} bytes`);
      
      if (imageBuffer.length < 1000) {
        throw new Error('Downloaded image is too small or corrupted');
      }
      
      // Validate image format with sharp
      const sharp = (await import('sharp')).default;
      const metadata = await sharp(imageBuffer).metadata();
      console.log(`📷 Image metadata:`, { format: metadata.format, width: metadata.width, height: metadata.height });
      
      // Send as proper image
      await this.sock.sendMessage(chatId, {
        image: imageBuffer,
        caption: caption
      });
      
      console.log('✅ Image sent successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Image message failed:', error.message);
      
      return { success: false, error: error.message };
    }
  }

  async autoReactToMessage(message, messageText) {
    try {
      if (!messageText || messageText.trim().length < 3) return;
      
      // React with 25% probability to avoid spam
      if (Math.random() > 0.25) return;
      
      const reaction = await this.getSmartReaction(messageText);
      
      if (reaction) {
        await this.reactToMessage(message.key, reaction);
        console.log(`🤖 NeuraX Omega smartly reacted with ${reaction}`);
      }
    } catch (error) {
      console.error('❌ Auto reaction error:', error);
    }
  }

  async getSmartReaction(messageText) {
    try {
      const axios = (await import('axios')).default;
      const apiUrl = process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await axios.post(`${apiUrl}/api/ai-chat`, {
        message: `Analyze this message and suggest ONE appropriate emoji reaction. Only respond with the emoji, nothing else: "${messageText}"`,
        model: 'qwen/qwen3-32b',
        systemPrompt: `You are an emoji reaction expert. Analyze the message sentiment and context to suggest the most appropriate single emoji reaction. Choose from these categories:

Positive: 👍 ❤️ 🔥 ✨ 💯 🎉 😍 🥰 💪 🙌 👏 🎊 🌟 💖 😊 😄 🤩 🥳
Funny: 😂 🤣 😆 😹 🤪 😜 🙃 😋 🤭 😏
Surprise: 😮 🤯 😱 🙀 😲 🤔 🧐 👀 😯
Support: 🙏 🤝 💙 🫂 👊 💚 🤗 💜 🧡 💛
Sad: 😢 😭 💔 😔 😞 🥺 😿 😪 😓
Angry: 😠 😡 🤬 😤 👿 💢
Neutral: 🤷 😐 🙂 😌 😇 🤨

Respond with ONLY the emoji, no text.`,
        conversationHistory: []
      });
      
      const aiReaction = response.data.response?.trim();
      
      // Validate it's actually an emoji
      if (aiReaction && /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u.test(aiReaction)) {
        return aiReaction;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Smart reaction error:', error);
      return null;
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
      console.log(`⌨️ NeuraX Omega typing indicator shown`);
      
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

  extractPhoneNumber(jid) {
    if (!jid) return '';
    
    // Remove all WhatsApp suffixes
    let phone = jid.replace('@s.whatsapp.net', '').replace('@lid', '').replace('@c.us', '').replace('@g.us', '');
    
    // Handle @lid format which might have extra characters
    if (jid.includes('@lid')) {
      // For @lid, take only the first part before any colon or additional characters
      phone = phone.split(':')[0];
    }
    
    // Remove any non-digit characters except +
    phone = phone.replace(/[^+\d]/g, '');
    
    // Validate phone number length (should be 10-15 digits)
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      console.log(`⚠️ Invalid phone length: ${digitsOnly.length} digits - ${phone}`);
      return '';
    }
    
    return phone;
  }

  async checkUserRegistration(senderPhone) {
    try {
      const User = (await import('../models/User.js')).default;
      
      console.log(`🔍 Checking registration for phone: ${senderPhone}`);
      
      // Skip if phone is invalid or empty
      if (!senderPhone || senderPhone.length < 10) {
        console.log(`❌ Invalid phone number: ${senderPhone}`);
        return false;
      }
      
      // Try multiple phone number formats
      const phoneVariants = [
        senderPhone,                    // Original
        `+${senderPhone}`,             // With +
        senderPhone.startsWith('+') ? senderPhone.substring(1) : senderPhone, // Without +
        senderPhone.startsWith('880') ? senderPhone.substring(3) : senderPhone, // Without country code
        senderPhone.startsWith('880') ? `+${senderPhone}` : `+880${senderPhone}` // Ensure +880 prefix
      ];
      
      console.log(`🔍 Trying phone variants:`, phoneVariants);
      
      for (const phoneVariant of phoneVariants) {
        const user = await User.findOne({ phoneNumber: phoneVariant });
        if (user) {
          console.log(`✅ User found with phone: ${phoneVariant} - Username: ${user.username}`);
          return true;
        }
      }
      
      console.log(`❌ No user found for any phone variant`);
      return false;
    } catch (error) {
      console.error('❌ Error checking user registration:', error);
      return false;
    }
  }

  async handleUnregisteredUser(chatId, senderName, isGroup) {
    try {
      const registrationMessage = `🤖 Hi ${senderName}! I'm NeuraX Omega, your AI assistant from Neuronerds Quiz.

🚫 You need to register on our platform to chat with me.

🎆 **Neuronerds Quiz** - Interactive learning platform with:
• Quiz battles with friends 🏆
• Achievement badges 🏅
• Global leaderboards 🌍
• AI-powered learning 🤖

🔗 **Register here:** https://neuronerdsquiz.vercel.app

Once registered, come back and chat with me! 🚀`;
      
      const responseText = isGroup ? `@${senderName}\n${registrationMessage}` : registrationMessage;
      
      if (isGroup) {
        await this.sendGroupMessage(chatId, responseText);
      } else {
        await this.sendMessage(chatId, responseText);
      }
      
      console.log(`🚫 Unregistered user ${senderName} prompted to register`);
    } catch (error) {
      console.error('❌ Error handling unregistered user:', error);
    }
  }

  async handlePollUpdate(updates) {
    try {
      for (const update of updates) {
        if (update.update.pollUpdate) {
          const pollUpdate = update.update.pollUpdate;
          const messageKey = update.key;
          
          console.log(`📊 Poll response received:`, {
            messageId: messageKey.id,
            voter: pollUpdate.vote?.selectedOptions || 'Unknown',
            pollName: pollUpdate.pollCreationMessage?.name
          });
          
          // You can process poll responses here
          // For example, store in database or send notifications
        }
      }
    } catch (error) {
      console.error('❌ Poll update error:', error);
    }
  }

  checkRateLimit(userId, type) {
    const now = Date.now();
    
    if (type === 'message') {
      // 15 messages per minute
      if (!this.messageRequests.has(userId)) {
        this.messageRequests.set(userId, []);
      }
      
      const userRequests = this.messageRequests.get(userId);
      // Remove requests older than 1 minute
      const oneMinuteAgo = now - 60000;
      const recentRequests = userRequests.filter(timestamp => timestamp > oneMinuteAgo);
      
      if (recentRequests.length >= 7) {
        const oldestRequest = Math.min(...recentRequests);
        const waitTime = Math.ceil((oldestRequest + 60000 - now) / 1000);
        return { allowed: false, waitTime };
      }
      
      // Add current request
      recentRequests.push(now);
      this.messageRequests.set(userId, recentRequests);
      return { allowed: true };
    } else if (type === 'image') {
      // 2 images per 5 minutes
      if (!this.imageRequests.has(userId)) {
        this.imageRequests.set(userId, []);
      }
      
      const userRequests = this.imageRequests.get(userId);
      // Remove requests older than 5 minutes
      const fiveMinutesAgo = now - 300000;
      const recentRequests = userRequests.filter(timestamp => timestamp > fiveMinutesAgo);
      
      if (recentRequests.length >= 2) {
        const oldestRequest = Math.min(...recentRequests);
        const waitTime = Math.ceil((oldestRequest + 300000 - now) / 1000);
        return { allowed: false, waitTime };
      }
      
      // Add current request
      recentRequests.push(now);
      this.imageRequests.set(userId, recentRequests);
      return { allowed: true };
    }
    
    return { allowed: true };
  }

  async getGroupMessages(groupId, limit = 20) {
    if (!this.isConnected || !this.sock) {
      return { success: false, error: 'WhatsApp not connected' };
    }

    try {
      console.log(`📱 Getting messages from memory for group: ${groupId}`);
      
      // Get messages from memory (last 10 stored messages)
      const storedMessages = this.groupMemories.get(groupId) || [];
      
      if (storedMessages.length === 0) {
        return {
          success: true,
          messages: [],
          count: 0,
          note: 'No recent messages in memory. Messages are only stored when bot is active.'
        };
      }
      
      const formattedMessages = storedMessages.map((msg, index) => ({
        id: `memory-${index}`,
        sender: msg.sender,
        senderPhone: msg.sender,
        message: msg.message,
        timestamp: msg.timestamp,
        isFromMe: msg.isBot,
        hasImage: false,
        hasVideo: false,
        hasAudio: false
      }));
      
      return {
        success: true,
        messages: formattedMessages.slice(-limit),
        count: formattedMessages.length
      };
    } catch (error) {
      console.error('❌ Error fetching group messages:', error);
      return { success: false, error: error.message };
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