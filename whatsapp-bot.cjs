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

async function sendGroupMessage(groupId, message) {
    if (!isConnected || !sock) throw new Error('WhatsApp not connected');
    await sock.sendMessage(groupId, { text: message });
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
    getConnectionStatus
};
