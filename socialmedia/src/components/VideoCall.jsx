import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

const VideoCall = ({ isCaller }) => {
  const { roomId  } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(new RTCPeerConnection());
  const socketRef = useRef(null);

  useEffect(() => {
    // Set up WebSocket connection
    socketRef.current = new WebSocket(`ws://localhost:8000/ws/video_call/${roomId}/`);

    socketRef.current.onopen = () => {
      console.log("WebSocket connection established for video call.");
    };

    socketRef.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log("Message received at VideoCall:", message);
      const { type, data } = message;

      if (type === 'offer') {
        console.log("Offer received:", data);
        await handleOffer(data);
      } else if (type === 'answer') {
        console.log("Answer received:", data);
        await handleAnswer(data);
      } else if (type === 'ice-candidate') {
        console.log("ICE candidate received:", data);
        await handleIceCandidate(data);
      } else {
        console.log("Unknown message type received:", type);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        console.log("Media stream obtained:", stream);
        localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, stream));
      })
      .catch(error => {
        console.error("Error accessing media devices:", error);
      });

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("ICE candidate generated:", event.candidate);
        socketRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          data: event.candidate,
        }));
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      console.log("Remote track received:", event.streams[0]);
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    if (isCaller) {
      console.log("Creating offer as caller.");
      createOffer();
    }

    return () => {
      console.log("Closing WebSocket connection.");
      socketRef.current.close();
    };
  }, [roomId, isCaller]);

  const createOffer = async () => {
    console.log("Creating offer...");
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);

    console.log("Sending offer:", offer);
    socketRef.current.send(JSON.stringify({
      type: 'offer',
      data: offer,
    }));
  };

  const handleOffer = async (offer) => {
    console.log("Setting remote description with offer:", offer);
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));

    console.log("Creating answer...");
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);

    console.log("Sending answer:", answer);
    socketRef.current.send(JSON.stringify({
      type: 'answer',
      data: answer,
    }));
  };

  const handleAnswer = async (answer) => {
    console.log("Setting remote description with answer:", answer);
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleIceCandidate = async (candidate) => {
    console.log("Adding ICE candidate:", candidate);
    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
  };

  return (
    <div>
      <h2>Video Call Room: {roomId}</h2>
      <video ref={localVideoRef} autoPlay playsInline muted />
      <video ref={remoteVideoRef} autoPlay playsInline />
    </div>
  );
};

export default VideoCall;