import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { FiUserPlus, FiCheck, FiX, FiSearch } from 'react-icons/fi';

const Connections = () => {
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchConnections();
    fetchPendingRequests();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/connections/list`);
      setConnections(response.data.connections);
    } catch (error) {
      toast.error('Failed to load connections');
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/connections/pending`);
      setPendingRequests(response.data.requests);
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

  const handleSendRequest = async (userId) => {
    try {
      await axios.post(`${API_URL}/api/connections/send-request/${userId}`);
      toast.success('Connection request sent!');
      setSearchResults(searchResults.filter(user => user._id !== userId));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (requesterId) => {
    try {
      await axios.post(`${API_URL}/api/connections/accept-request/${requesterId}`);
      toast.success('Request accepted!');
      fetchConnections();
      fetchPendingRequests();
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (requesterId) => {
    try {
      await axios.post(`${API_URL}/api/connections/reject-request/${requesterId}`);
      toast.success('Request rejected');
      fetchPendingRequests();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="connections-page">
      <Navbar />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">My Network</h1>

        <Tabs defaultValue="connections" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="connections" data-testid="connections-tab">Connections</TabsTrigger>
            <TabsTrigger value="requests" data-testid="requests-tab">
              Requests {pendingRequests.length > 0 && (
                <Badge className="ml-2 bg-blue-600">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="search" data-testid="search-tab">Find People</TabsTrigger>
          </TabsList>

          <TabsContent value="connections" data-testid="connections-list">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connections.map((connection) => (
                <Card key={connection._id} className="shadow-md border-slate-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={connection.profilePic} />
                        <AvatarFallback className="bg-blue-600 text-white text-lg">
                          {connection.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{connection.name}</h3>
                        <p className="text-sm text-slate-600">{connection.email}</p>
                        {connection.bio && (
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{connection.bio}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {connections.length === 0 && (
                <div className="col-span-2 text-center py-12 text-slate-500">
                  <p>No connections yet. Start connecting with people!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="requests" data-testid="requests-list">
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request._id} className="shadow-md border-slate-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={request.profilePic} />
                          <AvatarFallback className="bg-blue-600 text-white text-lg">
                            {request.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-slate-900">{request.name}</h3>
                          <p className="text-sm text-slate-600">{request.email}</p>
                          {request.bio && (
                            <p className="text-sm text-slate-500 mt-1">{request.bio}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleAcceptRequest(request._id)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          data-testid={`accept-${request._id}`}
                        >
                          <FiCheck className="mr-1" /> Accept
                        </Button>
                        <Button
                          onClick={() => handleRejectRequest(request._id)}
                          size="sm"
                          variant="outline"
                          className="border-slate-300"
                          data-testid={`reject-${request._id}`}
                        >
                          <FiX className="mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {pendingRequests.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <p>No pending requests</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="search" data-testid="search-users">
            <Card className="mb-6 shadow-md border-slate-200">
              <CardContent className="pt-6">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search by name, email, or bio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="border-slate-300"
                    data-testid="search-input"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={searching}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="search-button"
                  >
                    <FiSearch className="mr-2" /> Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {searchResults.map((user) => (
                <Card key={user._id} className="shadow-md border-slate-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={user.profilePic} />
                          <AvatarFallback className="bg-blue-600 text-white text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-slate-900">{user.name}</h3>
                          <p className="text-sm text-slate-600">{user.email}</p>
                          {user.bio && (
                            <p className="text-sm text-slate-500 mt-1">{user.bio}</p>
                          )}
                          <Badge className="mt-2">{user.role}</Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleSendRequest(user._id)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        data-testid={`connect-${user._id}`}
                      >
                        <FiUserPlus className="mr-1" /> Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Connections;