import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers, selectUsers } from '../features/user/userSlice';
import { useNavigate } from 'react-router-dom';

const UserList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status } = useSelector((state) => state.user);
  const users = useSelector(selectUsers) || [];
  const loggedInUserId = useSelector((state) => state.auth.userId);
  const socketRef = useRef(null);
  
  const [incomingCall, setIncomingCall] = useState(null);
  const [roomId, setRoomId] = useState('');

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
        if (data.to == loggedInUserId) {
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

  const handleChat = (userId) => {
    navigate(`/chat/${userId}`);
  };

  const handleCreateRoom = () => {
    if (!roomId) {
      alert("Please enter a room ID.");
      return;
    }

    // Navigate to video call with the created room ID
    navigate(`/video-call/${roomId}`, { state: { isCaller: true } });
  };

  const handleJoinRoom = () => {
    if (!roomId) {
      alert("Please enter a room ID.");
      return;
    }

    // Navigate to video call with the joined room ID
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
    <div>
      <h2>Users</h2>
      <ul>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <li key={user.id}>
              {user.username} ({user.email})
              <button onClick={() => handleChat(user.id)}>Chat</button>
            </li>
          ))
        ) : (
          <li>No other users found</li>
        )}
      </ul>

      <h3>Create or Join Room</h3>
      <input 
        type="text" 
        placeholder="Enter Room ID" 
        value={roomId} 
        onChange={(e) => setRoomId(e.target.value)} 
      />
      <button onClick={handleCreateRoom}>Create Room</button>
      <button onClick={handleJoinRoom}>Join Room</button>

      {incomingCall && (
        <div>
          <h3>Incoming Call from User ID: {incomingCall.from}</h3>
          <button onClick={handleReceiveCall}>Enter Room</button>
        </div>
      )}
    </div>
  );
};

export default UserList;