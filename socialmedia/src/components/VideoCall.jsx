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
<<<<<<< HEAD

  useEffect(() => {
    const initializeCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
=======
  const [errorMessage, setErrorMessage] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [peerReady, setPeerReady] = useState(false);
  const [offerCreated, setOfferCreated] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [pendingICECandidates, setPendingICECandidates] = useState([]);

  useEffect(() => {
    console.log(`VideoCall component mounted. isCaller: ${isCaller}, roomId: ${roomId}`);
    
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Add TURN servers here if available
      ]
    };

    const setupPeerConnection = () => {
      peerConnectionRef.current = new RTCPeerConnection(configuration);

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate:", event.candidate);
          sendMessage('ice-candidate', event.candidate);
>>>>>>> f7032505e7ca2dd5e7d022f7c6325ae7a437fbb1
        }

<<<<<<< HEAD
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
=======
      peerConnectionRef.current.ontrack = (event) => {
        console.log("Remote track received:", event.streams[0]);
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          console.log("Remote video source set");
        } else {
          console.error("Unable to set remote video source");
        }
      };

      peerConnectionRef.current.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", peerConnectionRef.current.iceConnectionState);
        if (peerConnectionRef.current.iceConnectionState === 'disconnected' ||
            peerConnectionRef.current.iceConnectionState === 'failed') {
          console.log("Attempting to reconnect...");
          createOffer(); // For the caller
          // For the callee, you might need to implement a way to request a new offer
        }
      };

      peerConnectionRef.current.onnegotiationneeded = async () => {
        console.log("Negotiation needed");
        if (isCaller) {
          try {
            await createOffer();
          } catch (error) {
            console.error("Error during renegotiation:", error);
          }
        }
      };

      peerConnectionRef.current.onsignalingstatechange = () => {
        console.log("Signaling state changed:", peerConnectionRef.current.signalingState);
      };
    };

    setupPeerConnection();

    socketRef.current = new WebSocket(`ws://localhost:8000/ws/video_call/${roomId}/`);

    socketRef.current.onopen = () => {
      console.log("WebSocket connection established for video call.");
      sendReadyMessage();
    };

    socketRef.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log("Message received at VideoCall:", message);
      handleMessage(message);
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setErrorMessage(`WebSocket error: ${error.message}`);
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        console.log("Local media stream obtained:", stream);
        localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach(track => {
          console.log("Adding track to peer connection:", track);
          peerConnectionRef.current.addTrack(track, stream);
>>>>>>> f7032505e7ca2dd5e7d022f7c6325ae7a437fbb1
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

<<<<<<< HEAD
  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    if (socketRef.current) {
      socketRef.current.close();
=======
  const sendMessage = (type, data) => {
    const message = JSON.stringify({ type, data });
    console.log(`Sending message of type: ${type}`);
    socketRef.current.send(message);
  };

  const sendReadyMessage = () => {
    sendMessage('ready', { isCaller });
    setIsReady(true);
    console.log("Local peer is ready");
  };

  const handleMessage = async (message) => {
    const { type, data } = message;
    console.log(`Received message of type: ${type}`);
    try {
      switch (type) {
        case 'ready':
          console.log("Peer is ready:", data);
          setPeerReady(true);
          break;
        case 'offer':
          console.log("Offer received:", data);
          await handleOffer(data);
          break;
        case 'answer':
          console.log("Answer received:", data);
          await handleAnswer(data);
          break;
        case 'ice-candidate':
          console.log("ICE candidate received:", data);
          await handleIceCandidate(data);
          break;
        default:
          console.log("Unknown message type received:", type);
      }
    } catch (error) {
      console.error(`Error handling ${type}:`, error);
      setErrorMessage(`Error handling ${type}: ${error.message}`);
    }
  };

  useEffect(() => {
    console.log(`isReady: ${isReady}, peerReady: ${peerReady}, isCaller: ${isCaller}, offerCreated: ${offerCreated}`);
    if (isReady && peerReady && isCaller && !offerCreated && peerConnectionRef.current) {
      console.log("Both peers are ready. Caller is creating offer.");
      createOffer();
    }
  }, [isReady, peerReady, isCaller, offerCreated]);

  const createOffer = async () => {
    if (offerCreated) {
      console.log("Offer already created, skipping");
      return;
    }
    try {
      console.log("Creating offer...");
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      sendMessage('offer', offer);
      setOfferCreated(true);
    } catch (error) {
      console.error("Error creating offer:", error);
      setErrorMessage(`Error creating offer: ${error.message}`);
    }
  };

  const handleOffer = async (offer) => {
    try {
      if (peerConnectionRef.current.signalingState !== 'stable') {
        console.log('Ignoring offer in non-stable state');
        return;
      }
      console.log("Setting remote description with offer:", offer);
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      await processPendingCandidates();
      console.log("Creating answer...");
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      sendMessage('answer', answer);
    } catch (error) {
      console.error("Error handling offer:", error);
      setErrorMessage(`Error handling offer: ${error.message}`);
    }
  };

  const handleAnswer = async (answer) => {
    try {
      if (peerConnectionRef.current.signalingState === "stable") {
        console.log("Ignoring answer in stable state");
        return;
      }
      console.log("Setting remote description with answer:", answer);
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      await processPendingCandidates();
    } catch (error) {
      console.error("Error handling answer:", error);
      setErrorMessage(`Error handling answer: ${error.message}`);
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      console.log("Received ICE candidate:", candidate);
      if (peerConnectionRef.current.remoteDescription && peerConnectionRef.current.remoteDescription.type) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("ICE candidate added successfully");
      } else {
        console.log("Queuing ICE candidate");
        setPendingICECandidates(prev => [...prev, candidate]);
      }
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
      setErrorMessage(`Error handling ICE candidate: ${error.message}`);
>>>>>>> f7032505e7ca2dd5e7d022f7c6325ae7a437fbb1
    }
    navigate('/');
  };

  const processPendingCandidates = async () => {
    console.log(`Processing ${pendingICECandidates.length} pending candidates`);
    for (const candidate of pendingICECandidates) {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("Pending ICE candidate added successfully");
      } catch (error) {
        console.error("Error adding pending ICE candidate:", error);
      }
    }
    setPendingICECandidates([]);
  };

  const toggleMute = () => {
    const stream = localVideoRef.current.srcObject;
    stream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
    setIsMuted(!isMuted);
    console.log(`Microphone is now ${!isMuted ? 'muted' : 'unmuted'}.`);
  };

  const toggleVideo = () => {
    const stream = localVideoRef.current.srcObject;
    stream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
    setIsVideoEnabled(!isVideoEnabled);
    console.log(`Video is now ${!isVideoEnabled ? 'off' : 'on'}.`);
  };

  return (
<<<<<<< HEAD
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
=======
    <div style={styles.container}>
      <h2 style={styles.header}>Video Call Room: {roomId}</h2>
      <div style={styles.videoContainer}>
        <video ref={localVideoRef} autoPlay playsInline muted style={styles.localVideo} />
        <video ref={remoteVideoRef} autoPlay playsInline style={styles.remoteVideo} />
      </div>
      <div style={styles.info}>
        <p>Is Caller: {isCaller ? 'Yes' : 'No'}</p>
        <p>Local Ready: {isReady ? 'Yes' : 'No'}</p>
        <p>Peer Ready: {peerReady ? 'Yes' : 'No'}</p>
        {errorMessage && <p style={styles.error}>{errorMessage}</p>}
      </div>
      <div style={styles.buttonContainer}>
        <button style={styles.button} onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
        <button style={styles.button} onClick={toggleVideo}>{isVideoEnabled ? 'Turn Off Video' : 'Turn On Video'}</button>
        <button style={styles.hangUpButton} onClick={() => { /* Handle hang up */ }}>Hang Up</button>
>>>>>>> f7032505e7ca2dd5e7d022f7c6325ae7a437fbb1
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

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  videoContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  },
  localVideo: {
    width: '30%',
    margin: '10px',
    borderRadius: '8px',
    border: '2px solid #ccc',
  },
  remoteVideo: {
    width: '60%',
    margin: '10px',
    borderRadius: '8px',
    border: '2px solid #4CAF50',
  },
  info: {
    textAlign: 'center',
    margin: '10px 0',
  },
  error: {
    color: 'red',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: '10px',
  },
  button: {
    padding: '10px 20px',
    margin: '5px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  hangUpButton: {
    padding: '10px 20px',
    margin: '5px',
    backgroundColor: '#F44336',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
};

export default VideoCall;