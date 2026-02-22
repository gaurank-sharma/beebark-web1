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
  const [searchQuery, setSearchQuery] = useState('');
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
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const filteredConnections = connections.filter(conn =>
    conn.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className=\"min-h-screen bg-white\" data-testid=\"chat-page\">
      <Sidebar />
      <TopBar />
      
      <div className=\"ml-64 mt-16 flex h-[calc(100vh-4rem)]\">
        {/* Left Sidebar - Messages List */}
        <div className=\"w-80 border-r border-gray-200 flex flex-col bg-gray-50\">
          <div className=\"p-4\">
            <div className=\"relative\">
              <Input
                placeholder=\"Search in messages...\"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className=\"pl-10 bg-white border-gray-300\"
              />
              <svg className=\"absolute left-3 top-3 w-5 h-5 text-gray-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z\" />
              </svg>
            </div>
          </div>

          <div className=\"flex-1 overflow-y-auto\">
            {filteredConnections.length > 0 ? (
              filteredConnections.map((connection) => (
                <div
                  key={connection._id}
                  onClick={() => handleSelectConnection(connection)}
                  className={`flex items-center space-x-3 p-4 cursor-pointer transition-colors ${
                    selectedConnection?._id === connection._id ? 'bg-white' : 'hover:bg-gray-100'
                  }`}
                  data-testid={`connection-${connection._id}`}
                >
                  <div className=\"relative\">
                    <Avatar className=\"w-12 h-12\">
                      <AvatarImage src={connection.profilePic} />
                      <AvatarFallback className=\"bg-gray-300 text-black\">
                        {connection.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className=\"absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white\"></span>
                  </div>
                  <div className=\"flex-1 min-w-0\">
                    <p className=\"font-semibold text-black truncate\">{connection.name}</p>
                    <p className=\"text-sm text-gray-500 truncate\">Can't wait for the project updates!</p>
                  </div>
                  <span className=\"text-xs text-gray-400\">15m</span>
                </div>
              ))
            ) : (
              <div className=\"p-8 text-center text-gray-500\">
                <p>No connections yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className=\"flex-1 flex flex-col\">
          {selectedConnection ? (
            <>
              {/* Chat Header */}
              <div className=\"h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white\">
                <div className=\"flex items-center space-x-3\">
                  <div className=\"relative\">
                    <Avatar className=\"w-10 h-10\">
                      <AvatarImage src={selectedConnection.profilePic} />
                      <AvatarFallback className=\"bg-gray-300 text-black\">
                        {selectedConnection.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className=\"absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white\"></span>
                  </div>
                  <div>
                    <h3 className=\"font-bold text-black\">{selectedConnection.name}</h3>
                    <p className=\"text-sm text-green-500\">Online now</p>
                  </div>
                </div>
                <div className=\"flex items-center space-x-4\">
                  <button className=\"p-2 hover:bg-gray-100 rounded-full transition\">
                    <FiPhone className=\"w-5 h-5 text-gray-600\" />
                  </button>
                  <button className=\"p-2 hover:bg-gray-100 rounded-full transition\">
                    <FiVideo className=\"w-5 h-5 text-gray-600\" />
                  </button>
                  <button className=\"p-2 hover:bg-gray-100 rounded-full transition\">
                    <svg className=\"w-5 h-5 text-gray-600\" fill=\"currentColor\" viewBox=\"0 0 24 24\">
                      <path d=\"M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z\"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages Container */}
              <div className=\"flex-1 overflow-y-auto p-6 space-y-4 bg-white\" data-testid=\"messages-container\">
                {messages.map((msg, idx) => {
                  const isSender = msg.sender === user.id || msg.sender === user._id;
                  return (
                    <div key={idx} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                      <div className={`message-bubble ${isSender ? 'message-sent' : 'message-received'}`}>
                        <p className=\"text-sm\">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className=\"border-t border-gray-200 p-4 bg-white\">
                <form onSubmit={handleSendMessage} className=\"flex items-center space-x-2\">
                  <button type=\"button\" className=\"p-2 hover:bg-gray-100 rounded-full transition\">
                    <FiImage className=\"w-5 h-5 text-gray-400\" />
                  </button>
                  <button type=\"button\" className=\"p-2 hover:bg-gray-100 rounded-full transition\">
                    <FiPaperclip className=\"w-5 h-5 text-gray-400\" />
                  </button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder=\"Type your message...\"
                    className=\"flex-1 border-gray-300\"
                    data-testid=\"message-input\"
                  />
                  <button
                    type=\"submit\"
                    className=\"w-12 h-12 bg-yellow-400 hover:bg-yellow-500 rounded-lg flex items-center justify-center transition\"
                    data-testid=\"send-message-button\"
                  >
                    <FiSend className=\"w-5 h-5 text-black\" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className=\"flex-1 flex items-center justify-center bg-white\">
              <div className=\"text-center text-gray-500\">
                <svg className=\"w-24 h-24 mx-auto mb-4 text-gray-300\" fill=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path d=\"M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z\"/>
                </svg>
                <p className=\"text-lg\">Select a connection to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
