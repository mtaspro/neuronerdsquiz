const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

let sock = null;
let isConnected = false;
const conversationHistory = new Map(); // Store last 10 messages per chat
const MAX_HISTORY = 10;

const sessionPath = path.join(__dirname, 'session');
console.log('📁 Using session folder:', sessionPath);

async function startWhatsAppBot() {
    try {
        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true });
        }

        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        const socket = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            browser: ['WhatsApp Bot', 'Chrome', '22.04.4'],
        });

        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('\n📱 Scan this QR code with WhatsApp:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                isConnected = false;
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    setTimeout(() => startWhatsAppBot(), 3000);
                }
            } else if (connection === 'open') {
                console.log('✅ WhatsApp bot connected!');
                isConnected = true;
            }
        });

        socket.ev.on('creds.update', saveCreds);

        // Listen for incoming messages
        socket.ev.on('messages.upsert', async (m) => {
            console.log(`\n📨 [MESSAGE EVENT] Type: ${m.type}, Messages count: ${m.messages.length}`);
            
            const message = m.messages[0];
            console.log(`📨 [MESSAGE DETAILS] fromMe: ${message.key.fromMe}, messageType: ${m.type}`);
            console.log(`📨 [MESSAGE DETAILS] remoteJid: ${message.key.remoteJid}`);
            console.log(`📨 [MESSAGE DETAILS] hasConversation: ${!!message.message?.conversation}`);
            console.log(`📨 [MESSAGE DETAILS] hasExtendedText: ${!!message.message?.extendedTextMessage}`);
            
            if (!message.key.fromMe && m.type === 'notify') {
                const messageText = message.message?.conversation || 
                                   message.message?.extendedTextMessage?.text || '';
                const sender = message.pushName || 'Unknown';
                const chatId = message.key.remoteJid;
                const isGroup = chatId.endsWith('@g.us');
                
                console.log(`💬 Message from ${sender}: ${messageText}`);
                
                // Smart reaction to user-user messages (10% chance to avoid spam)
                if (isGroup && !messageText.includes('@n') && messageText.trim() && Math.random() < 0.1) {
                    try {
                        const axios = require('axios');
                        const recentMsgs = conversationHistory.get(chatId) || [];
                        const context = recentMsgs.slice(-3).map(m => m.content).join(' | ');
                        
                        const reactionResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                            model: 'meta-llama/llama-3.2-3b-instruct:free',
                            messages: [{
                                role: 'user',
                                content: `Context: ${context}\nMessage: ${messageText}\n\nReply with ONE emoji that best reacts to this message. Only the emoji, nothing else.`
                            }],
                            max_tokens: 10
                        }, {
                            headers: {
                                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                                'Content-Type': 'application/json',
                                'HTTP-Referer': 'https://github.com/mtaspro/neuronerds-quiz',
                                'X-Title': 'NeuraX WhatsApp Bot'
                            }
                        });
                        
                        const emoji = reactionResponse.data.choices?.[0]?.message?.content?.trim() || '👍';
                        await socket.sendMessage(chatId, { react: { text: emoji, key: message.key } });
                        console.log(`😊 Reacted with ${emoji} to user message`);
                    } catch (error) {
                        console.error('Reaction error:', error.message);
                    }
                }
                
                // Store ALL group messages to notepad
                if (isGroup && messageText.trim()) {
                    try {
                        const axios = require('axios');
                        const apiUrl = process.env.API_URL || 'http://localhost:5000';
                        await axios.post(`${apiUrl}/api/notepad/receive`, {
                            message: messageText,
                            sender: sender,
                            groupId: chatId
                        });
                    } catch (error) {
                        console.error('Failed to store group message:', error.message);
                    }
                }
                
                // Check for @prvt command
                if (messageText.startsWith('@prvt ')) {
                    const privateMessage = messageText.substring(6).trim();
                    try {
                        const axios = require('axios');
                        const apiUrl = process.env.API_URL || 'http://localhost:5000';
                        await axios.post(`${apiUrl}/api/notepad/receive`, {
                            message: privateMessage,
                            sender: sender,
                            groupId: chatId
                        });
                        console.log(`📨 Private message forwarded from ${sender} in group ${chatId}`);
                    } catch (error) {
                        console.error('Failed to forward private message:', error.message);
                    }
                    return;
                }
                
                // Handle group messages with @n mention
                if (isGroup && messageText.includes('@n')) {
                    const query = messageText.replace('@n', '').trim();
                    if (query) {
                        try {
                            const axios = require('axios');
                            const apiUrl = process.env.API_URL || 'http://localhost:5000';
                            
                            // Get conversation history for this chat
                            const history = conversationHistory.get(chatId) || [];
                            
                            // Show typing and react
                            await socket.sendPresenceUpdate('composing', chatId);
                            await socket.sendMessage(chatId, { react: { text: '🤔', key: message.key } });
                            
                            const response = await axios.post(`${apiUrl}/api/ai-chat`, {
                                message: query,
                                model: 'mistralai/mistral-7b-instruct:free',
                                systemPrompt: `You are NeuraX Omega (নিউরএক্স ওমেগা), an advanced AI assistant for the Neuronerds whatsapp Study Group. You provide comprehensive, well-formatted responses similar to ChatGPT.

📝 Use bold for important keywords

-Use italics for light emphasis

- Use inline code for short commands or variable names

- Use triple backticks for longer code blocks

- Avoid tables or complex markdown (WhatsApp does not support them)

- Keep lists simple using hyphens (-) or numbers (1, 2, 3)

- Keep messages short and split long explanations into multiple replies

- Avoid block quotes (>) as WhatsApp does not render them properly

- Use clear and simple structure that looks clean in chat

👥 *Community Context:*
*The NeuroNERDS* - Student community from *Chattogram College, Bangladesh*
- **Akhyar Fardin** – CEO & Admin
- **Ahmed Azmain Mahtab** – Developer & Management Lead  
- **Md. Tanvir Mahtab** – Co-founder &  Former Managing Director
- **Zahin Ushrut Parsa** – Managing Director
- Students from Intermediate (11-12) classes

🚀Response Style:
- Be clear and organized and consize responses ... don't make them too long
- Use simple formatting for readability
- Provide short examples when needed
- Give step-by-step guidance if applicable
- End with helpful tips or next steps
- Keep tone friendly and professional

Deliver ChatGPT-quality responses with excellent formatting! ✨`,
                                conversationHistory: history
                            });
                            await socket.sendPresenceUpdate('paused', chatId);
                            await socket.sendMessage(chatId, { text: response.data.response });
                            await socket.sendMessage(chatId, { react: { text: '✅', key: message.key } });
                            
                            // Update conversation history
                            if (!conversationHistory.has(chatId)) conversationHistory.set(chatId, []);
                            const chatHistory = conversationHistory.get(chatId);
                            chatHistory.push({ role: 'user', content: query });
                            chatHistory.push({ role: 'assistant', content: response.data.response });
                            if (chatHistory.length > MAX_HISTORY * 2) chatHistory.splice(0, 2);
                            
                            console.log(`🤖 AI responded in group`);
                        } catch (error) {
                            console.error('AI chat error:', error.message);
                            await socket.sendMessage(chatId, { text: 'Sorry, I encountered an error.' });
                        }
                    }
                    return;
                }
                
                // Handle personal messages
                if (!isGroup && messageText.trim()) {
                    const axios = require('axios');
                    const apiUrl = process.env.API_URL || 'http://localhost:5000';
                    
                    const rot13 = (str) => str.replace(/[a-zA-Z]/g, c => 
                        String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)
                    );
                    
                    // Extract clean phone number from sender
                    let senderNumber = chatId.split('@')[0];
                    
                    console.log(`🔍 RAW CHAT ID: ${chatId}`);
                    console.log(`🔍 EXTRACTED SENDER: ${senderNumber}`);
                    
                    // Normalize sender number (add 88 if not present)
                    if (!senderNumber.startsWith('88')) {
                        senderNumber = '88' + senderNumber;
                        console.log(`➕ ADDED 88 PREFIX: ${senderNumber}`);
                    } else {
                        console.log(`✅ ALREADY HAS 88: ${senderNumber}`);
                    }
                    
                    console.log(`📞 FINAL SENDER NUMBER: ${senderNumber}`);
                    console.log(`👤 SENDER NAME: ${sender}`);
                    console.log(`💬 MESSAGE: ${messageText}`);
                    
                    try {
                        console.log(`🔍 CALLING FIND-LID API FOR: ${senderNumber}`);
                        
                        // Find which LID this sender number belongs to by checking existing conversations
                        const findLidResponse = await axios.get(`${apiUrl}/api/secret-chat/find-lid/${senderNumber}`);
                        
                        console.log(`📊 FIND-LID RESPONSE:`, findLidResponse.data);
                        
                        let targetLid = null;
                        if (findLidResponse.data.success && findLidResponse.data.lid) {
                            targetLid = findLidResponse.data.lid;
                            console.log(`🎯 FOUND EXISTING LID: ${targetLid} for sender: ${senderNumber}`);
                        } else {
                            // If no existing conversation, use sender's number as LID (fallback)
                            targetLid = senderNumber;
                            console.log(`⚠️ NO EXISTING LID FOUND, USING SENDER NUMBER AS LID: ${targetLid}`);
                        }
                        
                        const encryptedMessage = rot13(messageText);
                        console.log(`🔐 ENCRYPTED MESSAGE: ${encryptedMessage}`);
                        
                        const savePayload = {
                            phoneNumber: targetLid,
                            friendName: sender,
                            message: messageText,
                            encrypted: encryptedMessage,
                            sender: 'friend'
                        };
                        
                        console.log(`💾 SAVING TO DB WITH PAYLOAD:`, savePayload);
                        
                        const saveResponse = await axios.post(`${apiUrl}/api/secret-chat/auto-save`, savePayload);
                        
                        console.log(`✅ AUTO-SAVE RESPONSE:`, saveResponse.data);
                        console.log(`📨 SUCCESSFULLY SAVED MESSAGE FROM ${sender} (${senderNumber}) UNDER LID: ${targetLid}`);
                    } catch (saveError) {
                        console.error('❌ AUTO-SAVE FAILED:', saveError.message);
                        console.error('❌ FULL ERROR:', saveError.response?.data || saveError);
                    }
                    
                    // No AI reply - just save the message
                    return;
                }
            }
        });

        sock = socket;
        return socket;
    } catch (error) {
        console.error('❌ WhatsApp bot error:', error.message);
        setTimeout(() => startWhatsAppBot(), 5000);
    }
}

async function sendMessage(phoneNumber, message) {
    if (!isConnected || !sock) throw new Error('WhatsApp not connected');
    const jid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber.replace('+', '')}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
}

async function sendGroupMessage(groupId, message, options = {}) {
    if (!isConnected || !sock) throw new Error('WhatsApp not connected');
    const messageOptions = { text: message };
    if (options.mentions && options.mentions.length > 0) {
        messageOptions.mentions = options.mentions;
    }
    await sock.sendMessage(groupId, messageOptions);
}

async function getGroupMembers(groupId) {
    if (!isConnected || !sock) throw new Error('WhatsApp not connected');
    const metadata = await sock.groupMetadata(groupId);
    return metadata.participants.map(p => ({
        id: p.id,
        isAdmin: p.admin === 'admin' || p.admin === 'superadmin'
    }));
}

async function getGroups() {
    if (!isConnected || !sock) throw new Error('WhatsApp not connected');
    const chats = await sock.groupFetchAllParticipating();
    return Object.values(chats).map(group => ({
        id: group.id,
        name: group.subject,
        participants: group.participants?.length || 0
    }));
}

function getConnectionStatus() {
    return isConnected;
}

module.exports = {
    startWhatsAppBot,
    sendMessage,
    sendGroupMessage,
    getGroups,
    getGroupMembers,
    getConnectionStatus,
    getSock: () => sock
};
