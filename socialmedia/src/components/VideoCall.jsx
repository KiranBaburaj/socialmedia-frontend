import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';

const VideoCall = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const isCaller = location.state?.isCaller || false;
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [peerReady, setPeerReady] = useState(false);
  const [offerCreated, setOfferCreated] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [, forceUpdate] = useState();

  useEffect(() => {
    console.log(`VideoCall component mounted. isCaller: ${isCaller}, roomId: ${roomId}`);
    let isMounted = true;

    const setup = async () => {
      await setupPeerConnection();
      await setupWebSocket();
      await setupMediaStream();
      if (isMounted) setIsSetupComplete(true);
    };

    setup();

    return () => {
      isMounted = false;
      console.log("Closing WebSocket connection and stopping tracks.");
      if (socketRef.current) socketRef.current.close();
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [roomId, isCaller]);

  const setupPeerConnection = () => {
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("ICE candidate generated:", event.candidate);
        sendMessage('ice-candidate', event.candidate);
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      console.log("Remote track received:", event.streams[0]);
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnectionRef.current.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", peerConnectionRef.current.iceConnectionState);
    };
  };

  const setupWebSocket = () => {
    return new Promise((resolve, reject) => {
      socketRef.current = new WebSocket(`ws://localhost:8000/ws/video_call/${roomId}/`);

      socketRef.current.onopen = () => {
        console.log("WebSocket connection established for video call.");
        sendReadyMessage();
        resolve();
      };

      socketRef.current.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log("Message received at VideoCall:", message);
        handleMessage(message);
      };

      socketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setErrorMessage(`WebSocket error: ${error.message}`);
        reject(error);
      };
    });
  };

  const setupMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log("Local media stream obtained:", stream);
      localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach(track => {
        console.log("Adding track to peer connection:", track);
        peerConnectionRef.current.addTrack(track, stream);
      });
      setIsReady(true);
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setErrorMessage(`Error accessing media devices: ${error.message}`);
      throw error;
    }
  };

  const sendMessage = (type, data) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, data });
      console.log(`Sending ${type} message:`, message);
      socketRef.current.send(message);
    } else {
      console.warn(`WebSocket not open. Unable to send ${type} message.`);
    }
  };

  const sendReadyMessage = () => {
    sendMessage('ready', { isCaller });
    setIsReady(true);
    forceUpdate({});
    console.log("Local peer is ready");
  };

  const handleMessage = async (message) => {
    const { type, data } = message;
    try {
      console.log(`Handling message of type: ${type}`);
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
    } finally {
      console.log(`Finished handling message of type: ${type}`);
    }
  };

  useEffect(() => {
    console.log(`isSetupComplete: ${isSetupComplete}, isReady: ${isReady}, peerReady: ${peerReady}, isCaller: ${isCaller}, offerCreated: ${offerCreated}`);
    if (isSetupComplete && isReady && peerReady && isCaller && !offerCreated) {
      console.log("Both peers are ready. Caller is creating offer.");
      createOffer();
    }
  }, [isSetupComplete, isReady, peerReady, isCaller, offerCreated]);

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
      await retryOperation(async () => {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      });
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
      await retryOperation(async () => {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      });
    } catch (error) {
      console.error("Error handling answer:", error);
      setErrorMessage(`Error handling answer: ${error.message}`);
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      console.log("Adding ICE candidate:", candidate);
      await retryOperation(async () => {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      });
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
      setErrorMessage(`Error adding ICE candidate: ${error.message}`);
    }
  };

  const retryOperation = async (operation, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await operation();
        return;
      } catch (error) {
        console.error(`Operation failed, attempt ${i + 1} of ${maxRetries}:`, error);
        if (i === maxRetries - 1) throw error;
      }
    }
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
        <p>Setup Complete: {isSetupComplete ? 'Yes' : 'No'}</p>
        {errorMessage && <p style={styles.error}>{errorMessage}</p>}
      </div>
      <div style={styles.buttonContainer}>
        <button style={styles.button} onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
        <button style={styles.button} onClick={toggleVideo}>{isVideoEnabled ? 'Turn Off Video' : 'Turn On Video'}</button>
        <button style={styles.hangUpButton} onClick={() => { /* Handle hang up */ }}>Hang Up</button>
      </div>
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