// Test script to check server connectivity and Socket.IO availability

const testServerConnection = async () => {
  const serverUrl = 'https://neuronerdsquiz.onrender.com';
  
  console.log('🧪 Testing server connectivity...');
  
  try {
    // Test basic API connectivity
    console.log('1️⃣ Testing API endpoint...');
    const apiResponse = await fetch(`${serverUrl}/api/test`);
    const apiData = await apiResponse.json();
    console.log('✅ API Response:', apiData);
    
    // Test Socket.IO health endpoint
    console.log('2️⃣ Testing Socket.IO health endpoint...');
    const socketHealthResponse = await fetch(`${serverUrl}/socket.io/health`);
    const socketHealthData = await socketHealthResponse.json();
    console.log('✅ Socket.IO Health:', socketHealthData);
    
    // Test Socket.IO endpoint availability
    console.log('3️⃣ Testing Socket.IO endpoint...');
    const socketResponse = await fetch(`${serverUrl}/socket.io/?EIO=4&transport=polling`);
    console.log('✅ Socket.IO Endpoint Status:', socketResponse.status);
    console.log('✅ Socket.IO Response Headers:', Object.fromEntries(socketResponse.headers.entries()));
    
    if (socketResponse.status === 200) {
      const socketData = await socketResponse.text();
      console.log('✅ Socket.IO Response (first 200 chars):', socketData.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('❌ Error details:', error);
  }
};

// Test Socket.IO client connection
const testSocketIOClient = () => {
  console.log('4️⃣ Testing Socket.IO client connection...');
  
  // This would require socket.io-client in Node.js environment
  // For now, just log the test URL
  console.log('🔗 Socket.IO Client Test URL: https://neuronerdsquiz.onrender.com/socket.io/?EIO=4&transport=polling');
  console.log('📝 You can test this URL directly in browser or with curl');
};

// Run tests
testServerConnection().then(() => {
  testSocketIOClient();
}).catch(console.error);