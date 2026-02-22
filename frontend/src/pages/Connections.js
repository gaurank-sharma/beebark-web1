import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { toast } from 'sonner';
import { FiUserPlus } from 'react-icons/fi';

const Connections = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/connections/suggestions`);
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId) => {
    try {
      await axios.post(`${API_URL}/api/connections/send-request/${userId}`);
      toast.success('Connection request sent!');
      setSuggestions(suggestions.filter(s => s._id !== userId));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send request');
    }
  };

  const handleMessage = (userId) => {
    window.location.href = '/chat';
  };

  return (
    <div className=\"min-h-screen bg-gray-50\" data-testid=\"connections-page\">
      <Sidebar />
      <TopBar />
      
      <div className=\"ml-64 mt-16 p-8\">
        <div className=\"mb-8\">
          <h1 className=\"text-3xl font-bold text-black mb-2\">Network & Growth</h1>
          <p className=\"text-gray-600\">AI-curated partners for your projects.</p>
        </div>

        <div className=\"flex justify-between items-center mb-6\">
          <h2 className=\"text-2xl font-semibold text-black\">Recommended for you</h2>
          <Input
            placeholder=\"Search connections...\"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className=\"max-w-sm\"
          />
        </div>

        {loading ? (
          <div className=\"text-center py-12\">
            <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto\"></div>
          </div>
        ) : (
          <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
            {suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <div
                  key={suggestion._id}
                  className=\"relative bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-6 shadow-lg\"
                  data-testid={`suggestion-${suggestion._id}`}
                >
                  {/* PRO MATCH Badge */}
                  <div className=\"absolute top-4 left-4 bg-black text-white px-3 py-1 rounded-full text-xs font-bold\">
                    PRO MATCH
                  </div>

                  <div className=\"flex items-start justify-between mt-8\">
                    <div className=\"flex items-center space-x-4\">
                      <Avatar className=\"w-20 h-20 border-4 border-white\">
                        <AvatarImage src={suggestion.profilePic} />
                        <AvatarFallback className=\"bg-gray-300 text-black text-2xl\">
                          {suggestion.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className=\"text-xl font-bold text-black\">{suggestion.name}</h3>
                        <p className=\"text-sm text-gray-800\">{suggestion.role === 'recruiter' ? 'Recruiter' : suggestion.skills?.[0] || 'Professional'}</p>
                      </div>
                    </div>

                    <div className=\"text-right\">
                      <Avatar className=\"w-16 h-16 border-2 border-white\">
                        <AvatarImage src=\"\" />
                        <AvatarFallback className=\"bg-white text-black font-bold\">
                          {suggestion.email?.split('@')[1]?.split('.')[0]?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className=\"text-xs text-black mt-1 font-semibold\">
                        {suggestion.email?.split('@')[1]?.split('.')[0] || 'Company'}
                      </p>
                      <button className=\"mt-2 bg-black text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-gray-800 transition\">
                        + Follow
                      </button>
                    </div>
                  </div>

                  {/* Mutual Connections */}
                  {suggestion.mutualConnectionsCount > 0 && (
                    <div className=\"mt-6 bg-white/90 rounded-xl p-4\">
                      <div className=\"flex items-center justify-between\">
                        <div className=\"flex items-center space-x-2\">
                          <p className=\"text-sm text-gray-600 font-medium\">
                            {suggestion.mutualConnectionsCount} MUTUAL CONNECTIONS
                          </p>
                        </div>
                        <div className=\"flex -space-x-2\">
                          {suggestion.mutualConnections?.slice(0, 3).map((conn, idx) => (
                            <Avatar key={idx} className=\"w-8 h-8 border-2 border-white\">
                              <AvatarImage src={conn.profilePic} />
                              <AvatarFallback className=\"bg-gray-300 text-xs\">
                                {conn.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {suggestion.mutualConnectionsCount > 3 && (
                            <div className=\"w-8 h-8 rounded-full bg-black border-2 border-white flex items-center justify-center\">
                              <span className=\"text-white text-xs font-bold\">
                                +{suggestion.mutualConnectionsCount - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className=\"mt-6 grid grid-cols-2 gap-3\">
                    <button
                      onClick={() => handleConnect(suggestion._id)}
                      className=\"bg-white text-black font-semibold py-3 rounded-lg hover:bg-gray-100 transition flex items-center justify-center space-x-2\"
                      data-testid={`connect-${suggestion._id}`}
                    >
                      <FiUserPlus className=\"w-5 h-5\" />
                      <span>Connect</span>
                    </button>
                    <button
                      onClick={() => handleMessage(suggestion._id)}
                      className=\"bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition flex items-center justify-center space-x-2\"
                    >
                      <svg className=\"w-5 h-5\" fill=\"currentColor\" viewBox=\"0 0 24 24\">
                        <path d=\"M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z\"/>
                      </svg>
                      <span>Message</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className=\"col-span-2 text-center py-12 text-gray-500\">
                <p>No recommendations available. Build your network to get AI-powered suggestions!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;
