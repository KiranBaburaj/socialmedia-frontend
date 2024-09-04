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

  useEffect(() => {
    console.log(`VideoCall component mounted. isCaller: ${isCaller}, roomId: ${roomId}`);
    
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
        });
        setIsReady(true);
      })
      .catch(error => {
        console.error("Error accessing media devices:", error);
        setErrorMessage(`Error accessing media devices: ${error.message}`);
      });

    return () => {
      console.log("Closing WebSocket connection and stopping tracks.");
      socketRef.current.close();
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [roomId, isCaller]);

  const sendMessage = (type, data) => {
    const message = JSON.stringify({ type, data });
    console.log(`Sending ${type} message:`, message);
    socketRef.current.send(message);
  };

  const sendReadyMessage = () => {
    sendMessage('ready', { isCaller });
    setIsReady(true);
    console.log("Local peer is ready");
  };

  const handleMessage = async (message) => {
    const { type, data } = message;
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
    if (isReady && peerReady && isCaller && !offerCreated) {
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
    } catch (error) {
      console.error("Error handling answer:", error);
      setErrorMessage(`Error handling answer: ${error.message}`);
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      console.log("Adding ICE candidate:", candidate);
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
      setErrorMessage(`Error adding ICE candidate: ${error.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2>Video Call Room: {roomId}</h2>
      <p>Is Caller: {isCaller ? 'Yes' : 'No'}</p>
      <p>Local Ready: {isReady ? 'Yes' : 'No'}</p>
      <p>Peer Ready: {peerReady ? 'Yes' : 'No'}</p>
      <p>Offer Created: {offerCreated ? 'Yes' : 'No'}</p>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '40%', margin: '10px' }} />
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '40%', margin: '10px' }} />
      </div>
    </div>
  );
};

export default VideoCall;