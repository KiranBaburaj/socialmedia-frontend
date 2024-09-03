import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Box } from '@mui/material';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, error } = useSelector((state) => state.auth);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Replace the current entry in history stack to avoid going back
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]); // Run effect when isAuthenticated changes

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(loginUser(formData)).unwrap(); // Unwrap the promise
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 5 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Login
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          variant="outlined"
          name="username"
          value={formData.username}
          onChange={handleChange}
          label="Username"
          required
        />
        
        <TextField
          fullWidth
          margin="normal"
          variant="outlined"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          label="Password"
          required
        />
        
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          fullWidth 
          disabled={isLoading}
          sx={{ mt: 2 }}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
        
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {typeof error === 'string' ? error : error.detail || "An unexpected error occurred."}
          </Typography>
        )}
      </form>
    </Box>
  );
};

export default Login;