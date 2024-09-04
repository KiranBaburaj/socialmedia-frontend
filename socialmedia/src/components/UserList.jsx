// src/components/UserList.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers, selectMemoizedUsers } from '../features/user/userSlice';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const UserList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Initialize useNavigate
  const { status, error, isLoading } = useSelector((state) => state.user);
  const users = useSelector(selectMemoizedUsers) || [];
  const loggedInUserId = useSelector((state) => state.auth.userId);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchUsers());
    }
  }, [status, dispatch]);

  const filteredUsers = users.filter(user => user.id !== loggedInUserId);

  const handleChat = (user) => {
    // Navigate to the chat room
    navigate(`/chat/${user.id}`); // Using roomId as user.id for the chat room
  };

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <li key={user.id}>
              {user.username} ({user.email})
              <button onClick={() => handleChat(user)}>Chat</button>
            </li>
          ))
        ) : (
          <li>No other users found</li>
        )}
      </ul>
    </div>
  );
};

export default UserList;