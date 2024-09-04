import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { createSelector } from '@reduxjs/toolkit'; // Import createSelector

// Define the base API URL
const API_URL = 'http://localhost:8000/api';

const initialState = {
  users: [],
  status: 'idle',
  error: null,
  isLoading: false,
};

export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async (_, { rejectWithValue, getState }) => {
    const state = getState();
    const accessToken = state.auth.accessToken; // Get the access token from auth slice

    try {
      const response = await axios.get(`${API_URL}/users/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Include the access token in the headers
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Memoized selector to get users
export const selectUsers = createSelector(
  (state) => state.user.users, // Input selector
  (users) => users // Output selector
);

export default userSlice.reducer;