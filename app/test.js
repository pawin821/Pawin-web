// testApi.js
const axios = require('axios');

const sendTestNotification = async () => {
  try {
    const response = await axios.post('https://www.pawin.co.in/api/broadcast', {
      title: '🔥 hi siddhartha',
      body: 'This is a test message sent to all subscribed users!',
    });

    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error sending notification:', error.response ? error.response.data : error.message);
  }
};

sendTestNotification();
