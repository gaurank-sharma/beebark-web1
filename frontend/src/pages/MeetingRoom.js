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
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, FiPhoneOff, FiCopy, FiUsers } from 'react-icons/fi';

// FIX: Separate Component to safely render remote peer videos without resetting refs
const ParticipantVideo = ({ peer, userName }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on('stream', stream => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    });
  }, [peer]);

  return (
    <Card className="relative bg-gray-800 border-gray-700 overflow-hidden h-full">
      <video
        playsInline
        autoPlay
        ref={ref}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded text-sm text-white">
        {userName}
      </div>
    </Card>
  );
};

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const { user } = useAuth();
  
  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  
  const myVideo = useRef();
  const peersRef = useRef([]);
  const streamRef = useRef(); // FIX: Keep track of stream for simple-peer callbacks without triggering re-renders
  const screenStreamRef = useRef(null);

  // 1. Initialize local media FIRST
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(currentStream => {
        setStream(currentStream);
        streamRef.current = currentStream;
        
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        // 2. ONLY connect to socket AFTER stream is ready
        if (socket && user) {
          socket.emit('join-meeting', { meetingId, userId: user.id, userName: user.name });
        }
      })
      .catch(err => {
        console.error('Failed to get media:', err);
        toast.error('Failed to access camera/microphone');
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Run ONCE on mount

  // 3. Socket event listeners setup
  useEffect(() => {
    if (!socket) return;

    socket.on('existing-participants', (existingParticipants) => {
      const peersArray = [];
      existingParticipants.forEach(participant => {
        // We are joining, so we initiate connection to existing users
        const peer = createPeer(participant.socketId, participant.userId, participant.userName, streamRef.current);
        peersRef.current.push({
          socketId: participant.socketId,
          peerID: participant.userId,
          userName: participant.userName,
          peer
        });
        peersArray.push({
          socketId: participant.socketId,
          userName: participant.userName,
          peer
        });
      });
      setPeers(peersArray);
      setParticipants(existingParticipants.map(p => ({ id: p.userId, name: p.userName, socketId: p.socketId })));
    });

    socket.on('user-joined', (data) => {
      setParticipants(prev => [...prev, { id: data.userId, name: data.userName, socketId: data.socketId }]);
    });

    socket.on('receive-signal', (data) => {
      // Incoming connection from a new user
      const peer = addPeer(data.signal, data.from, streamRef.current);
      peersRef.current.push({
        socketId: data.from,
        peerID: data.userId,
        userName: data.userName,
        peer
      });
      setPeers([...peersRef.current]);
    });

    socket.on('signal-returned', (data) => {
      // The peer we initiated connection to accepted it
      const item = peersRef.current.find(p => p.socketId === data.from);
      if (item) {
        item.peer.signal(data.signal);
      }
    });

    socket.on('user-left', (data) => {
      const item = peersRef.current.find(p => p.socketId === data.socketId);
      if (item) item.peer.destroy();
      
      peersRef.current = peersRef.current.filter(p => p.socketId !== data.socketId);
      setPeers([...peersRef.current]);
      setParticipants(prev => prev.filter(p => p.socketId !== data.socketId));
    });

    return () => {
      if(socket) {
        socket.emit('leave-meeting', { meetingId, userId: user?.id });
        socket.off('existing-participants');
        socket.off('user-joined');
        socket.off('receive-signal');
        socket.off('signal-returned');
        socket.off('user-left');
      }
      peersRef.current.forEach(({ peer }) => peer.destroy());
      peersRef.current = [];
    };
  }, [socket]); // Don't depend on stream state, use streamRef instead

  // FIX: Clear signaling logic
  const createPeer = (userToSignal, userId, userName, currentStream) => {
    const peer = new Peer({
      initiator: true, // We initiate
      trickle: false,
      stream: currentStream,
    });

    peer.on('signal', signal => {
      socket.emit('send-signal', { to: userToSignal, signal });
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerSocketId, currentStream) => {
    const peer = new Peer({
      initiator: false, // They initiated
      trickle: false,
      stream: currentStream,
    });

    peer.on('signal', signal => {
      socket.emit('return-signal', { signal, to: callerSocketId });
    });

    peer.signal(incomingSignal);
    return peer;
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // FIX: Screen sharing WebRTC track replacement logic
  const shareScreen = async () => {
    if (screenSharing) {
      // 1. Stop screen tracks
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      
      // 2. Turn camera back on
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(cameraStream);
      streamRef.current = cameraStream;
      myVideo.current.srcObject = cameraStream;
      
      // 3. Replace video track across ALL connected peers
      const newVideoTrack = cameraStream.getVideoTracks()[0];
      peersRef.current.forEach(({ peer }) => {
        const oldTrack = peer.streams[0].getVideoTracks()[0];
        peer.replaceTrack(oldTrack, newVideoTrack, peer.streams[0]);
      });
      
      setScreenSharing(false);
      toast.success('Camera restored');

    } else {
      try {
        // 1. Get Screen
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        myVideo.current.srcObject = screenStream;
        
        // 2. Replace video track across ALL connected peers
        const newVideoTrack = screenStream.getVideoTracks()[0];
        peersRef.current.forEach(({ peer }) => {
          const oldTrack = peer.streams[0].getVideoTracks()[0];
          peer.replaceTrack(oldTrack, newVideoTrack, peer.streams[0]);
        });
        
        setScreenSharing(true);
        toast.success('Screen sharing started');
        
        // 3. Stop sharing when user stops via browser UI ("Stop Sharing" bar)
        screenStream.getVideoTracks()[0].onended = () => {
          shareScreen();
        };
      } catch (err) {
        toast.error('Failed to share screen');
      }
    }
  };

  const leaveMeeting = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(track => track.stop());
    socket.emit('leave-meeting', { meetingId, userId: user.id });
    navigate('/meetings');
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Meeting link copied!');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-xl font-bold text-white">Meeting: {meetingId}</h1>
          <p className="text-sm text-gray-400">{participants.length + 1} participants</p>
        </div>
        <Button onClick={copyMeetingLink} variant="outline" size="sm" className="bg-transparent text-white border-gray-600 hover:bg-gray-700">
          <FiCopy className="mr-2" /> Copy Link
        </Button>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Video Grid */}
        <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          
          {/* My Video */}
          <Card className="relative bg-gray-800 border-gray-700 overflow-hidden h-full">
            <video
              ref={myVideo}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded text-sm text-white">
              {user?.name} (You)
            </div>
            {!videoEnabled && !screenSharing && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user?.profilePic} />
                  <AvatarFallback className="bg-yellow-500 text-3xl text-black">
                    {user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </Card>

          {/* Peer Videos */}
          {peers.map((peerObj, index) => (
            <ParticipantVideo 
               key={peerObj.socketId} 
               peer={peerObj.peer} 
               userName={peerObj.userName || `Participant ${index + 1}`} 
            />
          ))}

          {/* Empty slot placeholder */}
          {peers.length === 0 && (
            <Card className="bg-gray-800 border-gray-700 flex items-center justify-center border-dashed border-2">
              <div className="text-center text-gray-500">
                <FiUsers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Waiting for others to join...</p>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar - Participants */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4 flex items-center text-gray-300">
            <FiUsers className="mr-2" /> Participants
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-2 bg-gray-700/50 rounded-lg">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profilePic} />
                <AvatarFallback className="bg-yellow-500 text-black text-xs">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user?.name} (You)</span>
            </div>
            {participants.map((participant, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-700/30 rounded-lg transition">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-500 text-white text-xs">
                    {participant.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{participant.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-full px-6 py-3 flex items-center space-x-4 shadow-2xl">
        <Button
          onClick={toggleAudio}
          variant={audioEnabled ? "outline" : "destructive"}
          size="lg"
          className={`rounded-full w-14 h-14 ${audioEnabled ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-white' : ''}`}
        >
          {audioEnabled ? <FiMic className="w-5 h-5"/> : <FiMicOff className="w-5 h-5"/>}
        </Button>

        <Button
          onClick={toggleVideo}
          variant={videoEnabled ? "outline" : "destructive"}
          size="lg"
          className={`rounded-full w-14 h-14 ${videoEnabled ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-white' : ''}`}
        >
          {videoEnabled ? <FiVideo className="w-5 h-5"/> : <FiVideoOff className="w-5 h-5"/>}
        </Button>

        <Button
          onClick={shareScreen}
          variant={screenSharing ? "default" : "outline"}
          size="lg"
          className={`rounded-full w-14 h-14 ${!screenSharing ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          <FiMonitor className="w-5 h-5"/>
        </Button>

        <div className="w-px h-8 bg-gray-600 mx-2"></div>

        <Button
          onClick={leaveMeeting}
          variant="destructive"
          size="lg"
          className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700"
        >
          <FiPhoneOff className="w-5 h-5"/>
        </Button>
      </div>
    </div>
  );
};

export default MeetingRoom;
