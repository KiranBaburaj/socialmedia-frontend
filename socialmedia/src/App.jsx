import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Register from './components/auth/Register';
import Login from './components/auth/Login';
import Dashboard from './components/auth/Dashboard';
import UserList from './components/UserList';
import ChatRoom from './components/ChatRoom'; // Import ChatRoom component
import VideoCall from './components/VideoCall';

function App() {
  return (

      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<UserList />} />
          <Route path="/video-call/:roomId" element={<VideoCall />} />
          <Route path="/chat/:roomId" element={<ChatRoom />} /> {/* Dynamic chat room */}
        </Routes>
      </Router>

  );
}

export default App;