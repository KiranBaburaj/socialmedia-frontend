import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Box } from '@mui/material';
import Navbar from '../Navbar';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get user details from Redux store
  const { username, email, firstName, lastName } = useSelector((state) => ({
    username: state.auth.username,
    email: state.auth.email,
    firstName: state.auth.first_name,
    lastName: state.auth.last_name,
  }));



  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 5, textAlign: 'center' }}>
      <Navbar />
      <Typography variant="h4" component="h2" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" gutterBottom>
        Welcome, {username}! You are logged in.
      </Typography>
      <Typography variant="body2" gutterBottom>
        Email: {email}
      </Typography>
      <Typography variant="body2" gutterBottom>
        First Name: {firstName}
      </Typography>
      <Typography variant="body2" gutterBottom>
        Last Name: {lastName}
      </Typography>

    </Box>
  );
};

export default Dashboard;