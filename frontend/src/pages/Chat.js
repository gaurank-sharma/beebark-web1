import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { toast } from 'sonner';
import { FiSend, FiPhone, FiVideo, FiPhoneOff } from 'react-icons/fi';
import Peer from 'peerjs';

const Chat = () => {
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState(null);
  const socket = useSocket();
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_BACKEND_URL;
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('receive-message', (message) => {
        if (selectedConnection && 
           (message.sender === selectedConnection._id || message.receiver === selectedConnection._id)) {
          setMessages(prev => [...prev, message]);
        }
      });

      socket.on('incoming-call', ({ from, callType: type }) => {
        const accept = window.confirm(`Incoming ${type} call. Accept?`);
        if (accept) {
          answerCall(from, type);
        }
      });

      return () => {
        socket.off('receive-message');
        socket.off('incoming-call');
      };
    }
  }, [socket, selectedConnection]);

  const fetchConnections = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/connections/list`);
      setConnections(response.data.connections);
    } catch (error) {
      toast.error('Failed to load connections');
    }
  };

  const fetchMessages = async (connectionId) => {
    try {
      const response = await axios.get(`${API_URL}/api/messages/${connectionId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      setMessages([]);
    }
  };

  const handleSelectConnection = (connection) => {
    setSelectedConnection(connection);
    fetchMessages(connection._id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConnection) return;

    const messageData = {
      receiver: selectedConnection._id,
      text: newMessage
    };

    try {
      socket.emit('send-message', messageData);
      setMessages([...messages, {
        sender: user.id,
        receiver: selectedConnection._id,
        text: newMessage,
        createdAt: new Date()
      }]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const startCall = async (type) => {
    if (!selectedConnection) return;

    setCallType(type);
    setInCall(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peer = new Peer(user.id);
      peerRef.current = peer;

      peer.on('open', (id) => {
        socket.emit('call-user', {
          to: selectedConnection._id,
          from: user.id,
          callType: type
        });

        const call = peer.call(selectedConnection._id, stream);
        call.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });
      });
    } catch (error) {
      toast.error('Failed to access media devices');
      endCall();
    }
  };

  const answerCall = async (callerId, type) => {
    setCallType(type);
    setInCall(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peer = new Peer(user.id);
      peerRef.current = peer;

      peer.on('call', (call) => {
        call.answer(stream);
        call.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });
      });
    } catch (error) {
      toast.error('Failed to answer call');
      endCall();
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    setInCall(false);
    setCallType(null);
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="chat-page">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
          <Card className="md:col-span-1 shadow-md border-slate-200 overflow-hidden" data-testid="connections-sidebar">
            <CardHeader className="bg-blue-600 text-white">
              <h2 className="text-xl font-bold">Messages</h2>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-200 overflow-y-auto max-h-[calc(100vh-16rem)]">
                {connections.map((connection) => (
                  <div
                    key={connection._id}
                    onClick={() => handleSelectConnection(connection)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                      selectedConnection?._id === connection._id ? 'bg-blue-50' : ''
                    }`}
                    data-testid={`connection-${connection._id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={connection.profilePic} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {connection.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{connection.name}</p>
                        <p className="text-xs text-slate-500">{connection.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {connections.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    <p>No connections yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 shadow-md border-slate-200 flex flex-col" data-testid="chat-window">
            {selectedConnection ? (
              <>
                <CardHeader className="bg-blue-600 text-white flex-row items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={selectedConnection.profilePic} />
                      <AvatarFallback className="bg-white text-blue-700">
                        {selectedConnection.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg">{selectedConnection.name}</h3>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => startCall('audio')}
                      size="sm"
                      variant="secondary"
                      disabled={inCall}
                      data-testid="audio-call-button"
                    >
                      <FiPhone className="w-5 h-5" />
                    </Button>
                    <Button
                      onClick={() => startCall('video')}
                      size="sm"
                      variant="secondary"
                      disabled={inCall}
                      data-testid="video-call-button"
                    >
                      <FiVideo className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>

                {inCall && (
                  <div className="bg-slate-900 p-4 relative" data-testid="call-interface">
                    <div className="grid grid-cols-2 gap-4">
                      {callType === 'video' && (
                        <>
                          <div className="relative">
                            <video
                              ref={remoteVideoRef}
                              autoPlay
                              className="w-full h-48 bg-slate-800 rounded-lg"
                            />
                            <p className="text-white text-sm mt-1">Remote</p>
                          </div>
                          <div className="relative">
                            <video
                              ref={localVideoRef}
                              autoPlay
                              muted
                              className="w-full h-48 bg-slate-800 rounded-lg"
                            />
                            <p className="text-white text-sm mt-1">You</p>
                          </div>
                        </>
                      )}
                    </div>
                    <Button
                      onClick={endCall}
                      className="mt-4 bg-red-600 hover:bg-red-700"
                      data-testid="end-call-button"
                    >
                      <FiPhoneOff className="mr-2" /> End Call
                    </Button>
                  </div>
                )}

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="messages-container">
                  {messages.map((msg, idx) => {
                    const isSender = msg.sender === user.id || msg.sender === user._id;
                    return (
                      <div
                        key={idx}
                        className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            isSender
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-900'
                          }`}
                        >
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>

                <div className="p-4 border-t border-slate-200">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 border-slate-300"
                      data-testid="message-input"
                    />
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="send-message-button"
                    >
                      <FiSend />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <p>Select a connection to start chatting</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;