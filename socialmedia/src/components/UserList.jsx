import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers, selectUsers } from '../features/user/userSlice';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { Typography, Button, TextField, Box, Paper } from '@mui/material';

const UserList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status } = useSelector((state) => state.user);
  const users = useSelector(selectUsers) || [];
  const loggedInUserId = useSelector((state) => state.auth.userId);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated); // Check if the user is authenticated
  const socketRef = useRef(null);
  
  const [incomingCall, setIncomingCall] = useState(null);
  const [roomId, setRoomId] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true }); // Redirect to login if not authenticated
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchUsers());
    }
  }, [status, dispatch]);

  useEffect(() => {
    socketRef.current = new WebSocket(`ws://localhost:8000/ws/notifications/${loggedInUserId}/`);

    socketRef.current.onopen = () => {
      console.log("WebSocket connection established.");
    };

    socketRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("Message received at UserList:", message);
      const { type, data } = message;
    
      if (type === 'incoming-call') {
        console.log("Incoming call notification received:", data);
        if (data.to === loggedInUserId) {
          setIncomingCall(data);
        }
      } else {
        console.log("Unknown message type received:", type);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    return () => {
      socketRef.current.close();
    };
  }, [loggedInUserId]);

  const filteredUsers = users.filter(user => user.id !== loggedInUserId);

  // Generate a 6-digit unique room ID
  const generateRoomId = () => {
    const randomRoomId = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
    return randomRoomId.toString();
  };

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);  // Set the room ID state with the newly generated room ID
    navigate(`/video-call/${newRoomId}`, { state: { isCaller: true } });
  };

  const handleJoinRoom = () => {
    if (!roomId) {
      alert("Please enter a room ID.");
      return;
    }
    navigate(`/video-call/${roomId}`, { state: { isCaller: false } });
  };

  const handleReceiveCall = () => {
    if (incomingCall) {
      setTimeout(() => {
        navigate(`/video-call/${incomingCall.roomId}`, { state: { isCaller: false } });
        setIncomingCall(null);
      }, 100);
    }
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Navbar />
      <Typography variant="h4" gutterBottom>
        Video call
      </Typography>

      <Paper  sx={{ padding: 2, marginTop: 2 }}>
        <Typography variant="h6" gutterBottom>
          Create or Join Room
        </Typography>
  <div sx={{ padding: 2, margin: 3  }}>
        <Button variant="contained" color="primary" onClick={handleCreateRoom} sx={{ marginRight: 1 ,marginBottom:4 ,Width: 500}} >
          Create Room
        </Button></div>
        <Button variant="contained" color="secondary" onClick={handleJoinRoom}  sx={{ marginRight: 1 ,marginBottom:4, Width: 500}} >
          Join Room
        </Button>
        <TextField 
          label="Enter Room ID" 
          variant="outlined" 
          fullWidth 
          value={roomId} 
          onChange={(e) => setRoomId(e.target.value)} 
          sx={{ marginBottom: 2, maxWidth: 300 }} // Adjust size here
        />
      </Paper>

      {incomingCall && (
        <Paper elevation={3} sx={{ padding: 2, marginTop: 2 }}>
          <Typography variant="h6">
            Incoming Call from User ID: {incomingCall.from}
          </Typography>
          <Button variant="contained" color="success" onClick={handleReceiveCall}>
            Enter Room
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default UserList;
