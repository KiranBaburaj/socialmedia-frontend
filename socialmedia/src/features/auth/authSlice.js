import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Define the base API URL
const API_URL = 'http://localhost:8000/api';

// Thunk for user login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/login/`, userData);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      // Save user ID and username in local storage
      localStorage.setItem('user_id', response.data.id);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('isAuthenticated', true);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk for user registration
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/register/`, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    userId: localStorage.getItem('user_id'), // Initialize userId from local storage
    username: localStorage.getItem('username'), // Initialize username from local storage
    isAuthenticated: localStorage.getItem('isAuthenticated'),
    isLoading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id'); // Remove user ID from local storage
      localStorage.removeItem('username'); // Remove username from local storage
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.userId = null; // Clear user ID
      state.username = null; // Clear username
      state.isAuthenticated = false  ;
      state.error = null; // Clear error on logout
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null; // Clear error on new login attempt
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.userId = action.payload.id; // Save user ID in state
        state.username = action.payload.username; // Save username in state
        state.isAuthenticated = true;
        state.error = null; // Clear error on successful login
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload; // Retain error on failure
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null; // Clear error on new registration attempt
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload; // Set user data upon successful registration
        state.error = null; // Clear error on successful registration
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload; // Retain error on failure
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;