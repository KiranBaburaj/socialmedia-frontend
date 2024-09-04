// src/features/chat/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Define the base API URL for chat messages
const API_URL = 'http://localhost:8000/api/chat';

// Thunk for fetching chat messages for a specific room
export const fetchChatMessages = createAsyncThunk(
  'chat/fetchChatMessages',
  async (roomId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${roomId}/messages/`);
      return response.data; // Assuming the API returns an array of messages
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk for sending a chat message
export const sendChatMessage = createAsyncThunk(
  'chat/sendChatMessage',
  async ({ roomId, messageData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${roomId}/messages/`, messageData);
      return response.data; // Return the newly created message
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [], // Array to hold chat messages
    currentRoomId: null, // Currently selected chat room ID
    isLoading: false,
    error: null,
  },
  reducers: {
    setCurrentRoom(state, action) {
      state.currentRoomId = action.payload; // Set the current chat room
    },
    clearMessages(state) {
      state.messages = []; // Clear all messages
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null; // Clear error on new fetch attempt
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload; // Store fetched messages
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload; // Retain error on failure
      })
      .addCase(sendChatMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null; // Clear error on new send attempt
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages.push(action.payload); // Add the new message to the messages array
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload; // Retain error on failure
      });
  },
});

// Export actions
export const { setCurrentRoom, clearMessages } = chatSlice.actions;

// Selectors
export const selectMessages = (state) => state.chat.messages; // Selector to get messages
export const selectCurrentRoomId = (state) => state.chat.currentRoomId; // Selector to get current room ID
export const selectIsLoading = (state) => state.chat.isLoading; // Selector to get loading state
export const selectError = (state) => state.chat.error; // Selector to get error state

// Export reducer
export default chatSlice.reducer;