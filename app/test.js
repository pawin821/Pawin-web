// testApi.js
const axios = require('axios');

const sendTestNotification = async () => {
  try {
    const response = await axios.post('http://localhost:3000/api/broadcast', {
      title: '🔥 Test Broadcast to lol',
      body: 'This is a test message sent to all subscribed users!',
    });

    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error sending notification:', error.response ? error.response.data : error.message);
  }
};

sendTestNotification();
