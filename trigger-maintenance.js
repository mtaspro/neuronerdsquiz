// Trigger maintenance mode before deployment
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'https://neuronerdsquiz.onrender.com';
const DEPLOYMENT_SECRET = process.env.DEPLOYMENT_SECRET;

async function triggerMaintenance() {
  try {
    console.log('🔧 Triggering auto-maintenance mode...');
    
    const response = await axios.post(`${API_URL}/api/superadmin/maintenance/auto-trigger`, {
      secret: DEPLOYMENT_SECRET
    });
    
    console.log('✅ Maintenance mode triggered:', response.data.message);
    console.log('⏳ Users will see 60s countdown before maintenance screen');
  } catch (error) {
    console.error('❌ Failed to trigger maintenance:', error.response?.data || error.message);
    process.exit(1);
  }
}

triggerMaintenance();
