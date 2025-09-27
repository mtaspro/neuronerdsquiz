import express from 'express';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

// GET /webhook - Messenger verification
router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN;
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Messenger webhook verified');
      res.status(200).send(challenge);
    } else {
      console.log('❌ Messenger webhook verification failed');
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// POST /webhook - Receive Messenger messages
router.post('/webhook', (req, res) => {
  const body = req.body;
  
  // Verify webhook signature
  if (!verifySignature(req, body)) {
    console.log('❌ Invalid webhook signature');
    return res.sendStatus(403);
  }
  
  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const webhookEvent = entry.messaging[0];
      console.log('📨 Received webhook event:', webhookEvent);
      
      const senderId = webhookEvent.sender.id;
      
      if (webhookEvent.message) {
        handleMessage(senderId, webhookEvent.message);
      }
    });
    
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Verify webhook signature
function verifySignature(req, body) {
  const signature = req.get('x-hub-signature-256');
  const APP_SECRET = process.env.MESSENGER_APP_SECRET;
  
  if (!signature || !APP_SECRET) {
    return false;
  }
  
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', APP_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Handle incoming messages
async function handleMessage(senderId, message) {
  try {
    let responseText = '';
    
    if (message.text) {
      // Echo the message back
      responseText = `You said: "${message.text}"`;
    } else {
      responseText = 'Hello! I received your message.';
    }
    
    await sendMessage(senderId, responseText);
  } catch (error) {
    console.error('❌ Error handling message:', error);
  }
}

// Send message to user
async function sendMessage(recipientId, messageText) {
  const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
  
  const requestBody = {
    recipient: { id: recipientId },
    message: { text: messageText }
  };
  
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      requestBody,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log('✅ Message sent successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error sending message:', error.response?.data || error.message);
    throw error;
  }
}

export default router;