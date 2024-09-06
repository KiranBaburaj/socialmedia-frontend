import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

const VideoCall = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isCaller = location.state?.isCaller || false;
  const loggedInUserId = useSelector((state) => state.auth.userId);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);

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
            data: { userId: loggedInUserId }
          }));
        };

        socketRef.current.onmessage = async (event) => {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);

          switch (message.type) {
            case 'ready':
              setIsReady(true);
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
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection) {
        peerConnection.close();
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [roomId, isCaller, loggedInUserId]);

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Video Call - Room {roomId}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <h3 style={{ marginBottom: '0.5rem' }}>Local Video</h3>
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline 
            style={{ width: '100%', height: 'auto', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div>
          <h3 style={{ marginBottom: '0.5rem' }}>Remote Video</h3>
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            style={{ width: '100%', height: 'auto', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button 
          onClick={handleEndCall}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          End Call
        </button>
      </div>
      {!isReady && <p style={{ textAlign: 'center', marginTop: '1rem' }}>Waiting for both parties to be ready...</p>}
    </div>
  );
};

export default VideoCall;