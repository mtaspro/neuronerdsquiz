import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function checkWhatsAppStatus() {
  console.log('🔍 Checking WhatsApp Bot Status...\n');
  
  try {
    const response = await axios.get(`${API_URL}/api/whatsapp/status`);
    console.log('✅ Status Response:', response.data);
    
    if (response.data.connected) {
      console.log('\n🎉 WhatsApp bot is CONNECTED and ready!');
      console.log('📱 You can now send messages through the bot.');
    } else {
      console.log('\n⚠️  WhatsApp bot is NOT connected.');
      console.log('📱 Visit http://localhost:5000/api/whatsapp/qr to scan QR code');
    }
  } catch (error) {
    console.error('❌ Error checking status:', error.message);
    console.log('\n💡 Make sure your server is running on port 5000');
  }
}

checkWhatsAppStatus();
