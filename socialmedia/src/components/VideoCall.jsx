import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Grid, CircularProgress } from '@mui/material';

const VideoCall = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isCaller = location.state?.isCaller || false;
  const loggedInUserId = useSelector((state) => state.auth.userId);
  const loggedInUsername = useSelector((state) => state.auth.username);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated); // Check if the user is authenticated

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteUserDetails, setRemoteUserDetails] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true }); // Redirect to login if not authenticated
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const initializeCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        setPeerConnection(pc);

        socketRef.current = new WebSocket(`ws://localhost:8000/ws/video_call/${roomId}/`);

        socketRef.current.onopen = () => {
          console.log('WebSocket connection established');
          socketRef.current.send(JSON.stringify({
            type: 'ready',
            data: { userId: loggedInUserId, username: loggedInUsername }
          }));
        };

        socketRef.current.onmessage = async (event) => {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);

          switch (message.type) {
            case 'ready':
              setIsReady(true);
              if (message.data.userId !== loggedInUserId) {
                setRemoteUserDetails(message.data);
              }
              if (isCaller) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socketRef.current.send(JSON.stringify({
                  type: 'offer',
                  data: { offer: pc.localDescription }
                }));
              }
              break;
            case 'offer':
              if (!isCaller) {
                await pc.setRemoteDescription(new RTCSessionDescription(message.data.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socketRef.current.send(JSON.stringify({
                  type: 'answer',
                  data: { answer: pc.localDescription }
                }));
              }
              break;
            case 'answer':
              if (isCaller) {
                await pc.setRemoteDescription(new RTCSessionDescription(message.data.answer));
              }
              break;
            case 'ice-candidate':
              await pc.addIceCandidate(new RTCIceCandidate(message.data.candidate));
              break;
            default:
              console.log('Unknown message type:', message.type);
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.send(JSON.stringify({
              type: 'ice-candidate',
              data: { candidate: event.candidate }
            }));
          }
        };
      } catch (error) {
        console.error('Error setting up call:', error);
      }
    };

    initializeCall();

    return () => {
      handleEndCall(); // Clean up when component unmounts
    };
  }, [roomId, isCaller, loggedInUserId, loggedInUsername]);

  const handleEndCall = () => {
    // Stop local media tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null); // Clear local stream
    }
    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null); // Clear peer connection
    }
    // Close WebSocket connection
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null; // Clear socket reference
    }
    navigate('/connectroom'); // Redirect to connect room
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => track.enabled = !track.enabled);
      setIsMuted(prev => !prev);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => track.enabled = !track.enabled);
      setIsVideoOff(prev => !prev);
    }
  };

  return (
    <Box sx={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
      <Typography variant="h4" align="center" gutterBottom>
        Video Call - Room {roomId}
      </Typography>

      {isReady && remoteUserDetails && (
        <Typography variant="body1" align="center" gutterBottom>
          Talking to: {remoteUserDetails.username}
        </Typography>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              My Video
            </Typography>
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ padding: 2 }}>
            {isReady && remoteUserDetails ? (
              <Typography variant="h6" gutterBottom>
                {remoteUserDetails.username}
              </Typography>
            ) : (
              <Typography variant="h6" gutterBottom>
                Remote Video
              </Typography>
            )}
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
            />
          </Paper>
        </Grid>
      </Grid>
      <Box sx={{ textAlign: 'center', marginTop: 2 }}>
        <Button 
          variant="contained" 
          color={isMuted ? 'success' : 'error'} 
          onClick={toggleMute}
          sx={{ margin: '0 0.5rem' }}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </Button>
        <Button 
          variant="contained" 
          color={isVideoOff ? 'success' : 'error'} 
          onClick={toggleVideo}
          sx={{ margin: '0 0.5rem' }}
        >
          {isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
        </Button>
        <Button 
          variant="contained" 
          color="error" 
          onClick={handleEndCall}
          sx={{ margin: '0 0.5rem' }}
        >
          End Call
        </Button>
      </Box>
      {!isReady && (
        <Box sx={{ textAlign: 'center', marginTop: 2 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ marginTop: 1 }}>
            Waiting for both parties to be ready...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default VideoCall;