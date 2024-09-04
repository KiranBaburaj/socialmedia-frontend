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
  
  // State to manage incoming call
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchUsers());
    }
  }, [status, dispatch]);

  useEffect(() => {
    // Set up WebSocket connection for notifications
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
          console.log("Incoming call for this user:", data);
          setIncomingCall(data);
        } else {
          console.log("Incoming call not for this user:", data.to);
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

  const handleVideoCall = (userId) => {
    console.log("Initiating video call to:", userId);
    
    // Generate a unique room ID based on user IDs
    const roomId = `${Math.min(loggedInUserId, userId)}-${Math.max(loggedInUserId, userId)}`;
  
    // Log the IDs being used
    console.log("Logged-in User ID:", loggedInUserId);
    console.log("Calling User ID:", userId);
    console.log("Generated Room ID:", roomId);
  
    // Send the incoming call notification with the room ID
    try {
      socketRef.current.send(JSON.stringify({
        type: 'incoming-call',
        data: {
          from: loggedInUserId,
          to: userId,
          roomId: roomId,
        },
      }));
      console.log("Video call notification sent.");

      // Navigate to the video call with the room ID only if initiating the call
      navigate(`/video-call/${roomId}`);
    } catch (error) {
      console.error("Error sending WebSocket message:", error);
    }
  };

  const handleReceiveCall = () => {
    if (incomingCall) {
      // Navigate to the video call room with the incoming call details
      navigate(`/video-call/${incomingCall.roomId}`);
      // Reset incoming call state
      setIncomingCall(null);
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
              <button onClick={() => handleVideoCall(user.id)}>Video Call</button>
            </li>
          ))
        ) : (
          <li>No other users found</li>
        )}
      </ul>

      {/* Incoming Call Notification */}
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