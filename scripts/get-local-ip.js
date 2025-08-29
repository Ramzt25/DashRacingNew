const os = require('os');

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return 'localhost';
};

const localIP = getLocalIP();
console.log('🌐 Local IP Address:', localIP);
console.log('📱 Update your mobile/.env file:');
console.log(`   API_BASE_URL=http://${localIP}:3000`);
console.log(`   WS_URL=ws://${localIP}:3000`);
console.log('🔧 Then restart your mobile app to apply changes');