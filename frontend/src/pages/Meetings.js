import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { FiVideo, FiMic, FiMicOff, FiVideoOff, FiMonitor, FiPhoneOff } from 'react-icons/fi';
import Peer from 'peerjs';

const Meetings = () => {
  const [meetingId, setMeetingId] = useState('');
  const [inMeeting, setInMeeting] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const { user } = useAuth();

  const generateMeetingId = () => {
    const id = Math.random().toString(36).substring(2, 10);
    setMeetingId(id);
    return id;
  };

  const startMeeting = async () => {
    const id = meetingId || generateMeetingId();
    await joinMeeting(id);
  };

  const joinMeeting = async (id) => {
    if (!id) {
      toast.error('Please enter a meeting ID');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peer = new Peer(user.id + '-' + id, {
        host: '0.peerjs.com',
        port: 443,
        path: '/'
      });

      peerRef.current = peer;
      setInMeeting(true);
      setMeetingId(id);

      peer.on('open', (peerId) => {
        toast.success(`Joined meeting: ${id}`);
      });

      peer.on('call', (call) => {
        call.answer(stream);
        
        call.on('stream', (remoteStream) => {
          addParticipant(call.peer, remoteStream);
        });

        call.on('close', () => {
          removeParticipant(call.peer);
        });

        peersRef.current[call.peer] = call;
      });

      peer.on('error', (error) => {
        console.error('Peer error:', error);
        toast.error('Connection error');
      });

    } catch (error) {
      console.error('Failed to join meeting:', error);
      toast.error('Failed to access media devices');
    }
  };

  const addParticipant = (peerId, stream) => {
    setParticipants(prev => {
      if (prev.find(p => p.id === peerId)) return prev;
      return [...prev, { id: peerId, stream }];
    });
  };

  const removeParticipant = (peerId) => {
    setParticipants(prev => prev.filter(p => p.id !== peerId));
    if (peersRef.current[peerId]) {
      delete peersRef.current[peerId];
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];

        Object.values(peersRef.current).forEach(call => {
          const sender = call.peerConnection.getSenders().find(s => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
          Object.values(peersRef.current).forEach(call => {
            const sender = call.peerConnection.getSenders().find(s => s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(currentVideoTrack);
            }
          });
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } catch (error) {
        toast.error('Failed to share screen');
      }
    } else {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      Object.values(peersRef.current).forEach(call => {
        const sender = call.peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
      setIsScreenSharing(false);
    }
  };

  const leaveMeeting = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    Object.values(peersRef.current).forEach(call => call.close());
    
    if (peerRef.current) {
      peerRef.current.destroy();
    }

    setInMeeting(false);
    setParticipants([]);
    setMeetingId('');
    peersRef.current = {};
  };

  const copyMeetingLink = () => {
    const link = `${window.location.origin}/meetings?id=${meetingId}`;
    navigator.clipboard.writeText(link);
    toast.success('Meeting link copied!');
  };

  return (
    <div className="min-h-screen bg-slate-900" data-testid="meetings-page">
      <Navbar />
      {!inMeeting ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
          <Card className="w-full max-w-md shadow-xl border-slate-200" data-testid="meeting-lobby">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiVideo className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-slate-900">Video Meetings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Button
                  onClick={() => startMeeting()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  data-testid="start-meeting-button"
                >
                  <FiVideo className="mr-2" /> Start New Meeting
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-slate-500">or</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Enter meeting ID"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                    className="border-slate-300"
                    data-testid="meeting-id-input"
                  />
                  <Button
                    onClick={() => joinMeeting(meetingId)}
                    variant="outline"
                    className="w-full"
                    data-testid="join-meeting-button"
                  >
                    Join Meeting
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="h-screen flex flex-col" data-testid="meeting-room">
          <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Meeting: {meetingId}</h2>
              <p className="text-sm text-slate-300">{participants.length + 1} participant(s)</p>
            </div>
            <Button onClick={copyMeetingLink} variant="secondary" size="sm" data-testid="copy-link-button">
              Copy Link
            </Button>
          </div>

          <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
            <div className="relative bg-slate-800 rounded-lg overflow-hidden" data-testid="local-video">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-full h-64 object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white px-3 py-1 rounded text-sm">
                You {!isAudioEnabled && '(muted)'}
              </div>
            </div>

            {participants.map((participant) => (
              <div key={participant.id} className="relative bg-slate-800 rounded-lg overflow-hidden" data-testid={`participant-${participant.id}`}>
                <video
                  ref={(el) => {
                    if (el && participant.stream) {
                      el.srcObject = participant.stream;
                    }
                  }}
                  autoPlay
                  className="w-full h-64 object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white px-3 py-1 rounded text-sm">
                  Participant
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-800 p-4">
            <div className="flex justify-center space-x-4">
              <Button
                onClick={toggleAudio}
                size="lg"
                className={isAudioEnabled ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'}
                data-testid="toggle-audio-button"
              >
                {isAudioEnabled ? <FiMic className="w-6 h-6" /> : <FiMicOff className="w-6 h-6" />}
              </Button>
              <Button
                onClick={toggleVideo}
                size="lg"
                className={isVideoEnabled ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'}
                data-testid="toggle-video-button"
              >
                {isVideoEnabled ? <FiVideo className="w-6 h-6" /> : <FiVideoOff className="w-6 h-6" />}
              </Button>
              <Button
                onClick={toggleScreenShare}
                size="lg"
                className={isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-600'}
                data-testid="toggle-screen-share-button"
              >
                <FiMonitor className="w-6 h-6" />
              </Button>
              <Button
                onClick={leaveMeeting}
                size="lg"
                className="bg-red-600 hover:bg-red-700"
                data-testid="leave-meeting-button"
              >
                <FiPhoneOff className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;