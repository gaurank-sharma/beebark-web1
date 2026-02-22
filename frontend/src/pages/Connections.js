import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { toast } from 'sonner';
import { FiUserPlus } from 'react-icons/fi';

const Connections = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchSuggestions();
    fetchConnections();
    fetchPendingRequests();
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

  const fetchConnections = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/connections/list`);
      setConnections(response.data.connections || []);
    } catch (error) {
      console.error('Failed to load connections');
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/connections/pending`);
      setPendingRequests(response.data.requests || []);
    } catch (error) {
      console.error('Failed to load pending requests');
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      toast.error('Search query too short');
      return;
    }
    setSearching(true);
    try {
      const response = await axios.get(`${API_URL}/api/profile/search/users?query=${searchQuery}`);
      setSearchResults(response.data.users);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleConnect = async (userId) => {
    try {
      await axios.post(`${API_URL}/api/connections/send-request/${userId}`);
      toast.success('Connection request sent!');
      setSuggestions(suggestions.filter(s => s._id !== userId));
      setSearchResults(searchResults.filter(s => s._id !== userId));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send request');
    }
  };

  const handleAccept = async (requesterId) => {
    try {
      await axios.post(`${API_URL}/api/connections/accept-request/${requesterId}`);
      toast.success('Request accepted!');
      fetchConnections();
      fetchPendingRequests();
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleReject = async (requesterId) => {
    try {
      await axios.post(`${API_URL}/api/connections/reject-request/${requesterId}`);
      toast.success('Request rejected');
      fetchPendingRequests();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <div className="ml-64 mt-16 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Network & Growth</h1>
          <p className="text-gray-600">AI-curated partners for your projects.</p>
        </div>
        {loading ? (
          <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {suggestions.length > 0 ? suggestions.map((suggestion) => (
              <div key={suggestion._id} className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-6 shadow-lg">
                <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded-full text-xs font-bold">PRO MATCH</div>
                <div className="flex items-start justify-between mt-8">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-20 h-20 border-4 border-white">
                      <AvatarImage src={suggestion.profilePic} />
                      <AvatarFallback className="bg-gray-300 text-2xl">{suggestion.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold text-black">{suggestion.name}</h3>
                      <p className="text-sm text-gray-800">{suggestion.role === 'recruiter' ? 'Recruiter' : 'Professional'}</p>
                    </div>
                  </div>
                  <button className="bg-black text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-gray-800">+ Follow</button>
                </div>
                {suggestion.mutualConnectionsCount > 0 && (
                  <div className="mt-6 bg-white/90 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 font-medium">{suggestion.mutualConnectionsCount} MUTUAL CONNECTIONS</p>
                      <div className="flex -space-x-2">
                        {suggestion.mutualConnections?.slice(0, 3).map((conn, idx) => (
                          <Avatar key={idx} className="w-8 h-8 border-2 border-white">
                            <AvatarImage src={conn.profilePic} />
                            <AvatarFallback className="text-xs">{conn.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button onClick={() => handleConnect(suggestion._id)} className="bg-white text-black font-semibold py-3 rounded-lg hover:bg-gray-100 flex items-center justify-center space-x-2">
                    <FiUserPlus className="w-5 h-5" /><span>Connect</span>
                  </button>
                  <button className="bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-800">Message</button>
                </div>
              </div>
            )) : <p className="col-span-2 text-center py-12 text-gray-500">No recommendations available</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;