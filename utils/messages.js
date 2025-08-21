const moment = require('moment-timezone');

function formatMessage(username, text, timestamp = null) {
   const messageTime = timestamp 
      ? moment(timestamp).tz('Asia/Dhaka').format('h:mm a')
      : moment().tz('Asia/Dhaka').format('h:mm a');
      
   return {
      username,
      text,
      time: messageTime,
      timestamp: timestamp || new Date()
   };
}

// Format message for database display
function formatDbMessage(messageData) {
   return {
      id: messageData.id,
      username: messageData.username,
      text: messageData.message,
      time: moment(messageData.local_time).format('h:mm a'),
      timestamp: messageData.local_time,
      avatar: messageData.avatar_url
   };
}

module.exports = {
   formatMessage,
   formatDbMessage
};