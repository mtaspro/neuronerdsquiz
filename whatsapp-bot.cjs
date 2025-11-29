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
            const message = m.messages[0];
            if (!message.key.fromMe && m.type === 'notify') {
                const messageText = message.message?.conversation || 
                                   message.message?.extendedTextMessage?.text || '';
                const sender = message.pushName || 'Unknown';
                const chatId = message.key.remoteJid;
                const isGroup = chatId.endsWith('@g.us');
                
                console.log(`💬 Message from ${sender}: ${messageText}`);
                
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
                            const response = await axios.post(`${apiUrl}/api/ai-chat`, {
                                message: query,
                                model: 'x-ai/grok-4.1-fast:free',
                                conversationHistory: []
                            });
                            await socket.sendMessage(chatId, { text: response.data.response });
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
                    try {
                        const axios = require('axios');
                        const apiUrl = process.env.API_URL || 'http://localhost:5000';
                        const response = await axios.post(`${apiUrl}/api/ai-chat`, {
                            message: messageText,
                            model: 'x-ai/grok-4.1-fast:free',
                            conversationHistory: []
                        });
                        await socket.sendMessage(chatId, { text: response.data.response });
                        console.log(`🤖 AI responded to ${sender}`);
                    } catch (error) {
                        console.error('AI chat error:', error.message);
                        await socket.sendMessage(chatId, { text: 'Sorry, I encountered an error.' });
                    }
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
