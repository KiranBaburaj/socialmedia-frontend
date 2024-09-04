let socket = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5; // Limit the number of reconnection attempts

/**
 * Connect to WebSocket.
 * @param {string} roomId - The room ID to connect to.
 * @param {function} onMessageReceived - Callback function to handle incoming messages.
 * @param {string} token - JWT token for authentication.
 * @returns {WebSocket} - The WebSocket connection.
 */
export const connectWebSocket = (roomId, onMessageReceived, token) => {
  if (socket) {
    console.warn('WebSocket already connected.');
    return socket;
  }

  socket = new WebSocket(`ws://localhost:8000/ws/chat/${roomId}/?token=${token}`);

  socket.onopen = () => {
    console.log('WebSocket connection established.');
    reconnectAttempts = 0; // Reset reconnect attempts on successful connection
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Received data:", data);
      if (data.error) {
        console.error('WebSocket error:', data.error);
      } else if (data.message) {
        const messageWithDetails = {
          content: data.message,
          timestamp: data.timestamp || new Date().toISOString(),
          sender: data.user
        };
        console.log("Processed message:", messageWithDetails);
        onMessageReceived(messageWithDetails);
      }
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = (event) => {
    console.log('WebSocket connection closed:', event);
    if (reconnectAttempts < maxReconnectAttempts) {
      setTimeout(() => {
        reconnectAttempts++;
        connectWebSocket(roomId, onMessageReceived, token);
      }, 5000); // Increase delay to 5 seconds
    } else {
      console.error('Max reconnect attempts reached. Could not reconnect.');
    }
  };

  return socket;
};

/**
 * Sends a message through the WebSocket.
 * @param {string} content - The message content to be sent.
 * @param {number} userId - The ID of the user sending the message.
 */
export const sendWebSocketMessage = (content, userId) => {
  const payload = {
    message: content,   // The actual message content
    user_id: userId     // The ID of the user
  };

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
    console.log("Message sent:", payload);
  } else {
    console.warn('WebSocket is not open. Message not sent.');
  }
};

/**
 * Closes the WebSocket connection.
 */
export const closeWebSocket = () => {
  if (socket) {
    socket.close();
    socket = null; // Clear the socket reference
    console.log('WebSocket connection closed.');
  }
};