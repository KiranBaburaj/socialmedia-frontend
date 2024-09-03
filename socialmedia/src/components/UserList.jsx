import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers, selectMemoizedUsers } from '../features/user/userSlice';

const UserList = () => {
  const dispatch = useDispatch();
  const { status, error, isLoading } = useSelector((state) => state.user);
  const users = useSelector(selectMemoizedUsers) || []; // Fallback to an empty array

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchUsers());
    }
  }, [status, dispatch]);

  if (status === 'loading' || isLoading) {
    return <div>Loading...</div>;
  }

  if (status === 'failed') {
    // Check if error is an object and extract message
    const errorMessage = typeof error === 'object' && error.detail ? error.detail : error;
    return <div>Error: {errorMessage}</div>; // Render the error message safely
  }

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {Array.isArray(users) && users.length > 0 ? (
          users.map((user) => (
            <li key={user.id}>{user.username} ({user.email})</li>
          ))
        ) : (
          <li>No users found</li>
        )}
      </ul>
    </div>
  );
};

export default UserList;