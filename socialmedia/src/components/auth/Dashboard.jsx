import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Box, Paper, CircularProgress } from '@mui/material';
import Navbar from '../Navbar';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get user details from Redux store
  const { username, email, firstName, lastName, loading, isAuthenticated } = useSelector((state) => ({
    username: state.auth.username,
    email: state.auth.email,
    firstName: state.auth.first_name,
    lastName: state.auth.last_name,
    loading: state.auth.loading,
    isAuthenticated: state.auth.isAuthenticated, // Ensure there's an isAuthenticated check
  }));

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true }); // Redirect to login if not authenticated
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <Box sx={{ padding: 2  }}>
      <Navbar />

      <Paper elevation={3} sx={{ padding: 3 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Home
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {username && (
              <Typography variant="body1" gutterBottom>
                Welcome, {username}! You are logged in.
              </Typography>
            )}
            {email && (
              <Typography variant="body2" gutterBottom>
                <strong>Email:</strong> {email}
              </Typography>
            )}
            {firstName && (
              <Typography variant="body2" gutterBottom>
                <strong>First Name:</strong> {firstName}
              </Typography>
            )}
            {lastName && (
              <Typography variant="body2" gutterBottom>
                <strong>Last Name:</strong> {lastName}
              </Typography>
            )}

          </>
        )}
      </Paper>
    </Box>
  );
};

export default Dashboard;