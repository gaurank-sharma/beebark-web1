import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { FiSend, FiPhone, FiVideo, FiImage, FiPaperclip } from 'react-icons/fi';

const Chat = () => {
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socket = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    if (socket && selectedConnection) {
      socket.on('receive-message', (message) => {
        if (message.sender === selectedConnection._id || message.receiver === selectedConnection._id) {
          setMessages(prev => [...prev, message]);
        }
      });
      return () => socket.off('receive-message');
    }
  }, [socket, selectedConnection]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConnections = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/connections/list`);
      setConnections(response.data.connections);
    } catch (error) {
      console.error('Failed to load connections');
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
      text: newMessage,
      sender: user.id
    };

    if (socket) {
      socket.emit('send-message', messageData);
      setMessages([...messages, {
        sender: user.id,
        receiver: selectedConnection._id,
        text: newMessage,
        createdAt: new Date()
      }]);
      setNewMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <TopBar />
      <div className="ml-64 mt-16 flex h-[calc(100vh-4rem)]">
        <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
          <div className="p-4">
            <Input placeholder="Search messages..." className="bg-white" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {connections.length > 0 ? connections.map((conn) => (
              <div
                key={conn._id}
                onClick={() => handleSelectConnection(conn)}
                className={`flex items-center space-x-3 p-4 cursor-pointer ${selectedConnection?._id === conn._id ? 'bg-white' : 'hover:bg-gray-100'}`}
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={conn.profilePic} />
                  <AvatarFallback className="bg-gray-300">{conn.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-black">{conn.name}</p>
                  <p className="text-sm text-gray-500">Online</p>
                </div>
              </div>
            )) : <p className="p-8 text-center text-gray-500">No connections</p>}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          {selectedConnection ? (
            <>
              <div className="h-16 border-b flex items-center justify-between px-6 bg-white">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedConnection.profilePic} />
                    <AvatarFallback>{selectedConnection.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-black">{selectedConnection.name}</h3>
                    <p className="text-sm text-green-500">Online</p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button className="p-2 hover:bg-gray-100 rounded-full"><FiPhone className="w-5 h-5" /></button>
                  <button className="p-2 hover:bg-gray-100 rounded-full"><FiVideo className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, idx) => {
                  const isSender = msg.sender === user.id || msg.sender === user._id;
                  return (
                    <div key={idx} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-4 py-2 rounded-2xl max-w-md ${isSender ? 'bg-yellow-400 text-black' : 'bg-white border text-black'}`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t p-4 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <button type="button" className="p-2 hover:bg-gray-100 rounded-full"><FiImage className="w-5 h-5 text-gray-400" /></button>
                  <button type="button" className="p-2 hover:bg-gray-100 rounded-full"><FiPaperclip className="w-5 h-5 text-gray-400" /></button>
                  <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type message..." className="flex-1" />
                  <button type="submit" className="w-12 h-12 bg-yellow-400 hover:bg-yellow-500 rounded-lg flex items-center justify-center">
                    <FiSend className="w-5 h-5 text-black" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Select a connection to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;