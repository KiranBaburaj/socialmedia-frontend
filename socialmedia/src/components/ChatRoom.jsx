import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchChatMessages, selectMessages, selectIsLoading, selectError } from '../features/chat/chatSlice';
import { Box, Button, Paper, TextField, Typography, Divider } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { connectWebSocket, sendWebSocketMessage, closeWebSocket } from '../utils/websocket';

const theme = createTheme({
  palette: {
    primary: {
      main: '#00796b', // Deep teal
    },
    secondary: {
      main: '#b2dfdb', // Light teal
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

const ChatRoom = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const messages = useSelector(selectMessages);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const userId = useSelector(state => state.auth.userId);
  const fullName = useSelector(state => state.auth.full_name);
  const token = useSelector(state => state.auth.accessToken);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated); // Check if the user is authenticated

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true }); // Redirect to login if not authenticated
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (roomId) {
      dispatch(fetchChatMessages(roomId));
    }

    // Connect to WebSocket
    const websocket = connectWebSocket(roomId, (message) => {
      console.log("Incoming WebSocket message:", message);
      // Dispatch an action to update the Redux state with the new message here if needed
    }, token);

    return () => {
      closeWebSocket();
    };
  }, [dispatch, roomId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendWebSocketMessage(newMessage, userId);
      setNewMessage('');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '80vh',
          maxWidth: '800px',
          width: '100%',
          margin: '0 auto',
          padding: 2,
          backgroundColor: '#f5f5f5',
          borderRadius: 2,
          boxShadow: 2,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Chat Room {roomId}
        </Typography>

        {isLoading && <Typography>Loading messages...</Typography>}
        {error && <Typography color="error">Error: {error}</Typography>}
        
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            mb: 2,
            border: '1px solid #ddd',
            borderRadius: 1,
            p: 2,
            backgroundColor: '#fafafa',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {messages.map(msg => (
            <Paper
              key={msg.id}
              sx={{
                mb: 1,
                p: 1,
                borderRadius: 1,
                backgroundColor: msg.sender.id === userId ? '#e3f2fd' : '#f1f8e9',
                alignSelf: msg.sender.id === userId ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                wordBreak: 'break-word',
              }}
            >
              <Typography variant="body2" gutterBottom>
                <strong>{msg.sender.full_name}:</strong> {msg.content || 'No content'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {new Date(msg.timestamp).toLocaleString()}
              </Typography>
            </Paper>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex' }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            sx={{ mr: 1 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="small"
          >
            Send
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ChatRoom;