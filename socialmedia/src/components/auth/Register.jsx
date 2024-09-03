import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Box } from '@mui/material';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
  });

  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const validate = () => {
    const errors = {};
    if (!formData.username) errors.username = 'Username is required';
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!formData.password) errors.password = 'Password is required';
    if (formData.password !== formData.password2) {
      errors.password2 = 'Passwords do not match';
    }
    if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    return errors;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      setErrors({});
      dispatch(registerUser(formData))
        .unwrap()
        .then(() => navigate('/login'))
        .catch((err) => setErrors(err));
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 5 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Register
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
          error={!!errors.username}
          helperText={errors.username}
        />
        
        <TextField
          fullWidth
          margin="normal"
          variant="outlined"
          name="email"
          value={formData.email}
          onChange={handleChange}
          label="Email"
          error={!!errors.email}
          helperText={errors.email}
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
          error={!!errors.password}
          helperText={errors.password}
        />
        
        <TextField
          fullWidth
          margin="normal"
          variant="outlined"
          name="password2"
          type="password"
          value={formData.password2}
          onChange={handleChange}
          label="Confirm Password"
          error={!!errors.password2}
          helperText={errors.password2}
        />
        
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          fullWidth 
          disabled={isLoading}
          sx={{ mt: 2 }}
        >
          Register
        </Button>
        
        <Button 
          variant="outlined" 
          color="primary" 
          fullWidth 
          onClick={() => navigate('/login')} 
          sx={{ mt: 2 }}
        >
          Already have an account? Login
        </Button>

        {error && <Typography color="error" variant="body2">{error}</Typography>}
      </form>
    </Box>
  );
};

export default Register;