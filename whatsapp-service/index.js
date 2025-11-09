import express from 'express';
import cors from 'cors';
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';

const app = express();
app.use(cors());
app.use(express.json());

let sock = null;
let isConnected = false;
let currentQR = null;

// Initialize WhatsApp
async function initWhatsApp() {
  try {
    console.log('🔄 Initializing WhatsApp...');
    
    const { state, saveCreds } = await useMultiFileAuthState('./auth_session');
    
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log('📱 QR Code Generated:');
        qrcode.generate(qr, { small: true });
        currentQR = qr;
      }
      
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('Connection closed:', lastDisconnect?.error?.message);
        
        if (shouldReconnect) {
          console.log('🔄 Reconnecting...');
          setTimeout(initWhatsApp, 3000);
        }
        isConnected = false;
      } else if (connection === 'open') {
        console.log('✅ WhatsApp Connected!');
        isConnected = true;
      }
    });
    
  } catch (error) {
    console.error('❌ WhatsApp init error:', error);
  }
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'running',
    connected: isConnected,
    hasQR: !!currentQR
  });
});

// Get QR code
app.get('/qr', (req, res) => {
  if (currentQR) {
    res.json({ success: true, qr: currentQR });
  } else {
    res.json({ success: false, message: isConnected ? 'Already connected' : 'QR not generated yet' });
  }
});

// Send message
app.post('/send-message', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!isConnected || !sock) {
      return res.status(503).json({ success: false, error: 'WhatsApp not connected' });
    }
    
    const jid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber.replace('+', '')}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send group message
app.post('/send-group-message', async (req, res) => {
  try {
    const { groupId, message } = req.body;
    
    if (!isConnected || !sock) {
      return res.status(503).json({ success: false, error: 'WhatsApp not connected' });
    }
    
    await sock.sendMessage(groupId, { text: message });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get groups
app.get('/groups', async (req, res) => {
  try {
    if (!isConnected || !sock) {
      return res.status(503).json({ success: false, error: 'WhatsApp not connected' });
    }
    
    const chats = await sock.groupFetchAllParticipating();
    const groups = Object.values(chats).map(group => ({
      id: group.id,
      name: group.subject,
      participants: group.participants?.length || 0
    }));
    
    res.json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Battle notification
app.post('/battle-notification', async (req, res) => {
  try {
    const { groupId, roomId, chapter, type } = req.body;
    
    if (!isConnected || !sock) {
      return res.status(503).json({ success: false, error: 'WhatsApp not connected' });
    }
    
    let message = '';
    if (type === 'start') {
      message = `🔥 *QUIZ BATTLE STARTED!* 🔥\n\n⚔️ Chapter: *${chapter}*\n🎯 Room: ${roomId}\n\nThe epic battle has begun! ⚡`;
    } else if (type === 'end') {
      message = `🏁 *BATTLE ENDED!* 🏁\n\nRoom: ${roomId}\nChapter: ${chapter}\n\nCheck results in the app! 🏆`;
    }
    
    await sock.sendMessage(groupId, { text: message });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Service running on port ${PORT}`);
  initWhatsApp();
});
