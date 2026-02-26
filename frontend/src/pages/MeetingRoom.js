// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useSocket } from '../context/SocketContext';
// import { useAuth } from '../context/AuthContext';
// import Peer from 'simple-peer';
// import { Button } from '../components/ui/button';
// import { Card } from '../components/ui/card';
// import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
// import { toast } from 'sonner';
// import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, FiPhoneOff, FiCopy, FiUsers } from 'react-icons/fi';

// const MeetingRoom = () => {
//   const { meetingId } = useParams();
//   const navigate = useNavigate();
//   const socket = useSocket();
//   const { user } = useAuth();
  
//   const [stream, setStream] = useState(null);
//   const [peers, setPeers] = useState([]);
//   const [audioEnabled, setAudioEnabled] = useState(true);
//   const [videoEnabled, setVideoEnabled] = useState(true);
//   const [screenSharing, setScreenSharing] = useState(false);
//   const [participants, setParticipants] = useState([]);
  
//   const myVideo = useRef();
//   const peersRef = useRef([]);
//   const screenStreamRef = useRef(null);

//   useEffect(() => {
//     // Get user media
//     navigator.mediaDevices.getUserMedia({ video: true, audio: true })
//       .then(currentStream => {
//         setStream(currentStream);
//         if (myVideo.current) {
//           myVideo.current.srcObject = currentStream;
//         }
//       })
//       .catch(err => {
//         console.error('Failed to get media:', err);
//         toast.error('Failed to access camera/microphone');
//       });

//     return () => {
//       // Cleanup
//       if (stream) {
//         stream.getTracks().forEach(track => track.stop());
//       }
//       if (screenStreamRef.current) {
//         screenStreamRef.current.getTracks().forEach(track => track.stop());
//       }
//     };
//   }, []);

//   useEffect(() => {
//     if (!socket || !stream) return;

//     console.log('Joining meeting:', meetingId);
//     socket.emit('join-meeting', { meetingId, userId: user.id, userName: user.name });

//     // Handle existing participants when we join
//     socket.on('existing-participants', (existingParticipants) => {
//       console.log('Existing participants:', existingParticipants);
      
//       // Create peer connections to all existing participants (we are the initiator)
//       existingParticipants.forEach(participant => {
//         createPeer(participant.socketId, participant.userId, participant.userName, true);
//       });
      
//       setParticipants(existingParticipants.map(p => ({ id: p.userId, name: p.userName, socketId: p.socketId })));
//     });

//     // Handle new user joining (we are already in the room, they initiate)
//     socket.on('user-joined', (data) => {
//       console.log('New user joined:', data);
//       setParticipants(prev => [...prev, { id: data.userId, name: data.userName, socketId: data.socketId }]);
//     });

//     // Receive signal from a peer who is initiating connection to us
//     socket.on('receive-signal', (data) => {
//       console.log('Received signal from:', data.from);
//       const peer = createPeer(data.from, data.userId, data.userName, false, data.signal);
      
//       // Send our signal back
//       peer.on('signal', signal => {
//         socket.emit('return-signal', { to: data.from, signal });
//       });
//     });

//     // Receive return signal from peer we initiated connection to
//     socket.on('signal-returned', (data) => {
//       console.log('Signal returned from:', data.from);
//       const item = peersRef.current.find(p => p.socketId === data.from);
//       if (item) {
//         item.peer.signal(data.signal);
//       }
//     });

//     socket.on('user-left', (data) => {
//       console.log('User left:', data);
//       const item = peersRef.current.find(p => p.socketId === data.socketId);
//       if (item) {
//         item.peer.destroy();
//       }
//       peersRef.current = peersRef.current.filter(p => p.socketId !== data.socketId);
//       setPeers([...peersRef.current]);
//       setParticipants(prev => prev.filter(p => p.socketId !== data.socketId));
//     });

//     return () => {
//       socket.emit('leave-meeting', { meetingId, userId: user.id });
//       socket.off('existing-participants');
//       socket.off('user-joined');
//       socket.off('receive-signal');
//       socket.off('signal-returned');
//       socket.off('user-left');
      
//       // Clean up all peer connections
//       peersRef.current.forEach(({ peer }) => peer.destroy());
//       peersRef.current = [];
//     };
//   }, [socket, stream]);

//   const createPeer = (socketId, userId, userName, isInitiator, incomingSignal = null) => {
//     console.log('Creating peer connection:', { socketId, userId, userName, isInitiator });
    
//     const peer = new Peer({
//       initiator: isInitiator,
//       trickle: false,
//       stream: stream,
//     });

//     peer.on('signal', signal => {
//       console.log('Sending signal to:', socketId);
//       socket.emit('send-signal', { to: socketId, signal });
//     });

//     peer.on('stream', remoteStream => {
//       console.log('Received stream from:', socketId);
//       // Stream will be handled in the video element ref
//     });

//     peer.on('error', err => {
//       console.error('Peer connection error:', err);
//     });

//     // If we received a signal, process it
//     if (incomingSignal) {
//       peer.signal(incomingSignal);
//     }

//     peersRef.current.push({ 
//       socketId, 
//       peerID: userId, 
//       userName,
//       peer 
//     });
//     setPeers([...peersRef.current]);
    
//     return peer;
//   };

//   const toggleAudio = () => {
//     if (stream) {
//       const audioTrack = stream.getAudioTracks()[0];
//       if (audioTrack) {
//         audioTrack.enabled = !audioTrack.enabled;
//         setAudioEnabled(audioTrack.enabled);
//       }
//     }
//   };

//   const toggleVideo = () => {
//     if (stream) {
//       const videoTrack = stream.getVideoTracks()[0];
//       if (videoTrack) {
//         videoTrack.enabled = !videoTrack.enabled;
//         setVideoEnabled(videoTrack.enabled);
//       }
//     }
//   };

//   const shareScreen = async () => {
//     if (screenSharing) {
//       // Stop screen sharing
//       if (screenStreamRef.current) {
//         screenStreamRef.current.getTracks().forEach(track => track.stop());
//         screenStreamRef.current = null;
//       }
      
//       // Switch back to camera
//       const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//       setStream(cameraStream);
//       if (myVideo.current) {
//         myVideo.current.srcObject = cameraStream;
//       }
      
//       setScreenSharing(false);
//       toast.success('Screen sharing stopped');
//     } else {
//       // Start screen sharing
//       try {
//         const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
//         screenStreamRef.current = screenStream;
        
//         if (myVideo.current) {
//           myVideo.current.srcObject = screenStream;
//         }
        
//         setScreenSharing(true);
//         toast.success('Screen sharing started');
        
//         // Stop sharing when user stops via browser UI
//         screenStream.getVideoTracks()[0].onended = () => {
//           shareScreen(); // This will stop sharing
//         };
//       } catch (err) {
//         console.error('Screen share error:', err);
//         toast.error('Failed to share screen');
//       }
//     }
//   };

//   const leaveMeeting = () => {
//     if (stream) {
//       stream.getTracks().forEach(track => track.stop());
//     }
//     if (screenStreamRef.current) {
//       screenStreamRef.current.getTracks().forEach(track => track.stop());
//     }
//     socket.emit('leave-meeting', { meetingId, userId: user.id });
//     navigate('/meetings');
//   };

//   const copyMeetingLink = () => {
//     const link = window.location.href;
//     navigator.clipboard.writeText(link);
//     toast.success('Meeting link copied!');
//   };

//   return (
//     <div className="min-h-screen bg-gray-900 text-white">
//       {/* Header */}
//       <div className="bg-gray-800 p-4 flex items-center justify-between">
//         <div>
//           <h1 className="text-xl font-bold">Meeting: {meetingId}</h1>
//           <p className="text-sm text-gray-400">{participants.length + 1} participants</p>
//         </div>
//         <Button onClick={copyMeetingLink} variant="outline" size="sm">
//           <FiCopy className="mr-2" /> Copy Link
//         </Button>
//       </div>

//       {/* Main Content */}
//       <div className="flex h-[calc(100vh-80px)]">
//         {/* Video Grid */}
//         <div className="flex-1 p-4 grid grid-cols-2 gap-4 auto-rows-fr">
//           {/* My Video */}
//           <Card className="relative bg-gray-800 border-gray-700 overflow-hidden">
//             <video
//               ref={myVideo}
//               autoPlay
//               playsInline
//               muted
//               className="w-full h-full object-cover"
//             />
//             <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded text-sm">
//               {user?.name} (You)
//             </div>
//             {!videoEnabled && (
//               <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
//                 <Avatar className="w-24 h-24">
//                   <AvatarImage src={user?.profilePic} />
//                   <AvatarFallback className="bg-yellow-500 text-2xl">
//                     {user?.name?.charAt(0)}
//                   </AvatarFallback>
//                 </Avatar>
//               </div>
//             )}
//           </Card>

//           {/* Peer Videos */}
//           {peers.map((peerObj, index) => (
//             <Card key={peerObj.socketId} className="relative bg-gray-800 border-gray-700 overflow-hidden">
//               <video
//                 autoPlay
//                 playsInline
//                 ref={ref => {
//                   if (ref && peerObj.peer) {
//                     peerObj.peer.on('stream', stream => {
//                       ref.srcObject = stream;
//                     });
//                   }
//                 }}
//                 className="w-full h-full object-cover"
//               />
//               <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded text-sm">
//                 {peerObj.userName || `Participant ${index + 1}`}
//               </div>
//             </Card>
//           ))}

//           {/* Empty slots */}
//           {peers.length === 0 && (
//             <Card className="bg-gray-800 border-gray-700 flex items-center justify-center">
//               <div className="text-center text-gray-500">
//                 <FiUsers className="w-12 h-12 mx-auto mb-2" />
//                 <p>Waiting for others to join...</p>
//               </div>
//             </Card>
//           )}
//         </div>

//         {/* Sidebar - Participants */}
//         <div className="w-64 bg-gray-800 p-4 overflow-y-auto">
//           <h3 className="font-semibold mb-4 flex items-center">
//             <FiUsers className="mr-2" /> Participants ({participants.length + 1})
//           </h3>
//           <div className="space-y-2">
//             <div className="flex items-center space-x-2 p-2 bg-gray-700 rounded">
//               <Avatar className="w-8 h-8">
//                 <AvatarImage src={user?.profilePic} />
//                 <AvatarFallback className="bg-yellow-500 text-xs">
//                   {user?.name?.charAt(0)}
//                 </AvatarFallback>
//               </Avatar>
//               <span className="text-sm">{user?.name} (You)</span>
//             </div>
//             {participants.map((participant, index) => (
//               <div key={index} className="flex items-center space-x-2 p-2 bg-gray-700 rounded">
//                 <Avatar className="w-8 h-8">
//                   <AvatarFallback className="bg-blue-500 text-xs">
//                     {participant.name?.charAt(0)}
//                   </AvatarFallback>
//                 </Avatar>
//                 <span className="text-sm">{participant.name}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Controls */}
//       <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-full px-6 py-3 flex items-center space-x-4 shadow-2xl">
//         <Button
//           onClick={toggleAudio}
//           variant={audioEnabled ? "outline" : "destructive"}
//           size="lg"
//           className="rounded-full w-14 h-14"
//           data-testid="toggle-audio-button"
//         >
//           {audioEnabled ? <FiMic /> : <FiMicOff />}
//         </Button>

//         <Button
//           onClick={toggleVideo}
//           variant={videoEnabled ? "outline" : "destructive"}
//           size="lg"
//           className="rounded-full w-14 h-14"
//           data-testid="toggle-video-button"
//         >
//           {videoEnabled ? <FiVideo /> : <FiVideoOff />}
//         </Button>

//         <Button
//           onClick={shareScreen}
//           variant={screenSharing ? "default" : "outline"}
//           size="lg"
//           className="rounded-full w-14 h-14"
//           data-testid="share-screen-button"
//         >
//           <FiMonitor />
//         </Button>

//         <Button
//           onClick={leaveMeeting}
//           variant="destructive"
//           size="lg"
//           className="rounded-full w-14 h-14"
//           data-testid="leave-meeting-button"
//         >
//           <FiPhoneOff />
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default MeetingRoom;



import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Peer from 'simple-peer';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { toast } from 'sonner';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, FiPhoneOff, FiCopy, FiUsers, FiMaximize, FiMinimize } from 'react-icons/fi';

const webrtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' }
  ]
};

// Remote Video Component
const ParticipantVideo = ({ stream, userName, isPinned, onPin, isScreenSharing }) => {
  const ref = useRef();

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
      // Force playback to prevent browser autoplay blocking on black screens
      const playPromise = ref.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => console.log("Autoplay prevented:", error));
      }
    }
  }, [stream, isScreenSharing]);

  return (
    <Card className={`relative bg-gray-900 border-gray-700 overflow-hidden group ${isPinned ? 'w-full h-full' : 'w-full h-full aspect-video md:aspect-auto'}`}>
      <video
        playsInline
        autoPlay
        ref={ref}
        className={`w-full h-full ${isScreenSharing || isPinned ? 'object-contain' : 'object-cover'}`}
      />
      <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded text-sm text-white flex items-center gap-2">
        {userName} {isScreenSharing && "(Presenting)"}
      </div>
      <button 
        onClick={onPin}
        className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 z-10"
      >
        {isPinned ? <FiMinimize /> : <FiMaximize />}
      </button>
    </Card>
  );
};

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const { user } = useAuth();
  
  const [peers, setPeers] = useState([]);
  const [participants, setParticipants] = useState([]);
  
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  
  const [pinnedParticipant, setPinnedParticipant] = useState(null); 
  const [remoteScreenSharers, setRemoteScreenSharers] = useState(new Set());
  
  const myVideo = useRef();
  const peersRef = useRef([]);
  
  // Track streams safely
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null); 
  const screenStreamRef = useRef(null);
  const currentVideoTrackRef = useRef(null); 
  
  const joinedRoom = useRef(false); // Prevents duplicate joining

  // 1. INITIALIZE CAMERA ON MOUNT
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        localStreamRef.current = stream;
        currentVideoTrackRef.current = stream.getVideoTracks()[0]; 
      })
      .catch(err => {
        console.error("Camera access denied:", err);
        toast.error('Failed to access camera/microphone');
      });

    return () => {
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []); 

  // 2. ATTACH LOCAL VIDEO (Protects against black screens when layout changes)
  useEffect(() => {
    if (myVideo.current) {
      myVideo.current.srcObject = screenSharing && screenStreamRef.current 
        ? screenStreamRef.current 
        : localStream;
    }
  }, [localStream, screenSharing, pinnedParticipant]); 

  // 3. SOCKET & WEBRTC LOGIC
  useEffect(() => {
    // Only proceed if socket, user, and camera are fully ready, and we haven't joined yet
    if (!socket || !localStream || joinedRoom.current) return;
    
    joinedRoom.current = true;
    const currentUserId = user?.id || user?._id;

    // Helper to attach stream to a peer perfectly
    const attachStreamToPeer = (socketId, stream) => {
      const peerObj = peersRef.current.find(p => p.socketId === socketId);
      if (peerObj) {
        peerObj.stream = stream; // Mutate ref directly so it doesn't get lost
        setPeers([...peersRef.current]); // Force UI update
      }
    };

    socket.on('existing-participants', (existingParticipants) => {
      const peersArray = [];
      existingParticipants.forEach(participant => {
        const peer = new Peer({ initiator: true, trickle: true, stream: localStreamRef.current, config: webrtcConfig });
        
        peer.on('signal', signal => socket.emit('send-signal', { to: participant.socketId, signal }));
        peer.on('stream', stream => attachStreamToPeer(participant.socketId, stream));
        peer.on('error', err => console.error("Peer Error:", err));

        const peerObj = { socketId: participant.socketId, peerID: participant.userId, userName: participant.userName, peer, stream: null };
        peersRef.current.push(peerObj);
        peersArray.push(peerObj);
      });
      
      setPeers(peersArray);
      setParticipants(existingParticipants.map(p => ({ id: p.userId, name: p.userName, socketId: p.socketId })));
    });

    socket.on('user-joined', (data) => {
      setParticipants(prev => {
        if (prev.some(p => p.socketId === data.socketId)) return prev;
        return [...prev, { id: data.userId, name: data.userName, socketId: data.socketId }];
      });
    });

    socket.on('receive-signal', (data) => {
      let existingPeerObj = peersRef.current.find(p => p.socketId === data.from);
      
      // FIX RACE CONDITION: Create the object and store it FIRST, then process the signal
      if (!existingPeerObj) {
        const peer = new Peer({ initiator: false, trickle: true, stream: localStreamRef.current, config: webrtcConfig });
        
        peer.on('signal', signal => socket.emit('return-signal', { signal, to: data.from }));
        peer.on('stream', stream => attachStreamToPeer(data.from, stream));
        peer.on('error', err => console.error("Peer Error:", err));

        existingPeerObj = { socketId: data.from, peerID: data.userId, userName: data.userName, peer, stream: null };
        peersRef.current.push(existingPeerObj);
        setPeers([...peersRef.current]); // Update UI instantly
      }

      // Now process the signal safely
      existingPeerObj.peer.signal(data.signal);
    });

    socket.on('signal-returned', (data) => {
      const item = peersRef.current.find(p => p.socketId === data.from);
      if (item) item.peer.signal(data.signal);
    });

    socket.on('user-left', (data) => {
      const item = peersRef.current.find(p => p.socketId === data.socketId);
      if (item) item.peer.destroy();
      peersRef.current = peersRef.current.filter(p => p.socketId !== data.socketId);
      setPeers([...peersRef.current]);
      setParticipants(prev => prev.filter(p => p.socketId !== data.socketId));
      setPinnedParticipant(prev => prev === data.socketId ? null : prev);
    });

    socket.on('peer-screen-share-status', (data) => {
      setRemoteScreenSharers(prev => {
        const newSet = new Set(prev);
        if (data.isSharing) {
          newSet.add(data.socketId);
          setPinnedParticipant(data.socketId); 
        } else {
          newSet.delete(data.socketId);
          setPinnedParticipant(prevPinned => prevPinned === data.socketId ? null : prevPinned);
        }
        return newSet;
      });
    });

    // Finally, emit join!
    socket.emit('join-meeting', { meetingId, userId: currentUserId, userName: user?.name });

    return () => {
      socket.emit('leave-meeting', { meetingId, userId: currentUserId });
      socket.off('existing-participants');
      socket.off('user-joined');
      socket.off('receive-signal');
      socket.off('signal-returned');
      socket.off('user-left');
      socket.off('peer-screen-share-status');
      
      peersRef.current.forEach(({ peer }) => { if (peer) peer.destroy(); });
      peersRef.current = [];
      setPeers([]);
      joinedRoom.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, localStream]); 

  // Mute Controls
  const toggleAudio = () => {
    const newAudioState = !audioEnabled;
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => track.enabled = newAudioState);
    }
    // Also mute screen sharing system audio if applicable
    if (screenStreamRef.current) {
      screenStreamRef.current.getAudioTracks().forEach(track => track.enabled = newAudioState); 
    }
    setAudioEnabled(newAudioState);
  };

  const toggleVideo = () => {
    const newVideoState = !videoEnabled;
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => track.enabled = newVideoState);
    }
    setVideoEnabled(newVideoState);
  };

  const shareScreen = async () => {
    if (screenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      
      const originalVideoTrack = localStreamRef.current.getVideoTracks()[0];
      peersRef.current.forEach(({ peer }) => {
        if (currentVideoTrackRef.current && originalVideoTrack) {
          peer.replaceTrack(currentVideoTrackRef.current, originalVideoTrack, localStreamRef.current);
        }
      });
      
      currentVideoTrackRef.current = originalVideoTrack; 
      setScreenSharing(false);
      socket.emit('screen-share-status', { isSharing: false });
      setPinnedParticipant(prev => prev === 'local' ? null : prev);
      toast.success('Camera restored');

    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = screenStream;
        
        const screenVideoTrack = screenStream.getVideoTracks()[0];
        peersRef.current.forEach(({ peer }) => {
          if (currentVideoTrackRef.current && screenVideoTrack) {
            peer.replaceTrack(currentVideoTrackRef.current, screenVideoTrack, localStreamRef.current);
          }
        });
        
        currentVideoTrackRef.current = screenVideoTrack; 
        setScreenSharing(true);
        setPinnedParticipant('local'); 
        socket.emit('screen-share-status', { isSharing: true });
        toast.success('Screen sharing started');
        
        screenVideoTrack.onended = () => shareScreen();
      } catch (err) {
        toast.error('Failed to share screen');
      }
    }
  };

  const leaveMeeting = () => {
    navigate('/meetings'); 
  };

  const renderLocalVideo = (isPinned) => (
    <Card className={`relative bg-gray-900 border-gray-700 overflow-hidden group ${isPinned ? 'w-full h-full' : 'w-full h-full aspect-video md:aspect-auto'}`}>
      <video
        ref={myVideo}
        autoPlay playsInline muted // Muted so you don't hear your own echo!
        className={`w-full h-full ${screenSharing || isPinned ? 'object-contain' : 'object-cover'}`}
      />
      <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded text-sm text-white">
        {user?.name} (You) {screenSharing && "(Presenting)"}
      </div>
      {!videoEnabled && !screenSharing && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-0">
          <Avatar className="w-24 h-24">
            <AvatarImage src={user?.profilePic} />
            <AvatarFallback className="bg-yellow-500 text-3xl text-black">{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      )}
      <button 
        onClick={() => setPinnedParticipant(isPinned ? null : 'local')}
        className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 z-10"
      >
        {isPinned ? <FiMinimize /> : <FiMaximize />}
      </button>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="bg-gray-800 p-4 flex items-center justify-between shadow-md z-10">
        <div>
          <h1 className="text-xl font-bold text-white">Meeting: {meetingId}</h1>
        </div>
        <Button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }} variant="outline" size="sm" className="bg-transparent text-white border-gray-600 hover:bg-gray-700">
          <FiCopy className="mr-2" /> Copy Link
        </Button>
      </div>

      <div className="flex-1 flex p-4 pb-24 gap-4 overflow-hidden h-[calc(100vh-80px)]">
        {pinnedParticipant ? (
          <div className="flex flex-col lg:flex-row w-full gap-4 h-full">
            <div className="flex-1 bg-gray-800 rounded-xl overflow-hidden shadow-lg h-full">
              {pinnedParticipant === 'local' ? renderLocalVideo(true) : 
                peers.filter(p => p.socketId === pinnedParticipant).map(p => (
                  <ParticipantVideo 
                    key={p.socketId} 
                    stream={p.stream}
                    userName={p.userName} 
                    isPinned={true} 
                    isScreenSharing={remoteScreenSharers.has(p.socketId)}
                    onPin={() => setPinnedParticipant(null)} 
                  />
              ))}
            </div>

            <div className="lg:w-64 flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto shrink-0">
              {pinnedParticipant !== 'local' && <div className="h-40 shrink-0">{renderLocalVideo(false)}</div>}
              {peers.filter(p => p.socketId !== pinnedParticipant).map(p => (
                <div className="h-40 shrink-0" key={p.socketId}>
                  <ParticipantVideo 
                    stream={p.stream} 
                    userName={p.userName} 
                    isPinned={false} 
                    isScreenSharing={remoteScreenSharers.has(p.socketId)}
                    onPin={() => setPinnedParticipant(p.socketId)} 
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr h-full">
            {renderLocalVideo(false)}
            {peers.map((peerObj) => (
              <ParticipantVideo 
                 key={peerObj.socketId} 
                 stream={peerObj.stream} 
                 userName={peerObj.userName} 
                 isScreenSharing={remoteScreenSharers.has(peerObj.socketId)}
                 isPinned={false} 
                 onPin={() => setPinnedParticipant(peerObj.socketId)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-full px-6 py-3 flex items-center space-x-4 shadow-2xl z-50">
        <Button onClick={toggleAudio} variant={audioEnabled ? "outline" : "destructive"} size="lg" className={`rounded-full w-14 h-14 ${audioEnabled ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-white' : ''}`}>
          {audioEnabled ? <FiMic className="w-5 h-5"/> : <FiMicOff className="w-5 h-5"/>}
        </Button>
        <Button onClick={toggleVideo} variant={videoEnabled ? "outline" : "destructive"} size="lg" className={`rounded-full w-14 h-14 ${videoEnabled ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-white' : ''}`}>
          {videoEnabled ? <FiVideo className="w-5 h-5"/> : <FiVideoOff className="w-5 h-5"/>}
        </Button>
        <Button onClick={shareScreen} variant={screenSharing ? "default" : "outline"} size="lg" className={`rounded-full w-14 h-14 ${!screenSharing ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
          <FiMonitor className="w-5 h-5"/>
        </Button>
        <div className="w-px h-8 bg-gray-600 mx-2"></div>
        <Button onClick={leaveMeeting} variant="destructive" size="lg" className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700">
          <FiPhoneOff className="w-5 h-5"/>
        </Button>
      </div>
    </div>
  );
};

export default MeetingRoom;
