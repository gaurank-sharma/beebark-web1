import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import ImageUpload from '../components/ImageUpload';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { FiHeart, FiMessageCircle, FiSend, FiImage, FiPlus } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [commentTexts, setCommentTexts] = useState({});
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/posts/feed`);
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Failed to load feed');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !mediaUrl) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/posts/create`, {
        content: newPost,
        mediaUrl
      });
      setPosts([response.data.post, ...posts]);
      setNewPost('');
      setMediaUrl('');
      setShowUpload(false);
      toast.success('Post shared!');
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`${API_URL}/api/posts/${postId}/like`);
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const isLiked = post.likes.includes(user.id);
          return {
            ...post,
            likes: isLiked ? post.likes.filter(id => id !== user.id) : [...post.likes, user.id]
          };
        }
        return post;
      }));
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleComment = async (postId) => {
    const text = commentTexts[postId];
    if (!text?.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/api/posts/${postId}/comment`, { text });
      setPosts(posts.map(post => post._id === postId ? { ...post, comments: response.data.comments } : post));
      setCommentTexts({ ...commentTexts, [postId]: '' });
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <div className="ml-64 mt-16 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex space-x-3 overflow-x-auto pb-2">
                  <div className="flex-shrink-0 text-center cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 border-2 border-yellow-600 flex items-center justify-center mb-2">
                      <FiPlus className="w-6 h-6 text-black" />
                    </div>
                    <p className="text-xs font-medium">Add Story</p>
                  </div>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-shrink-0 text-center cursor-pointer">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-2 border-white flex items-center justify-center mb-2">
                        <Avatar className="w-14 h-14">
                          <AvatarFallback className="bg-gray-200">U</AvatarFallback>
                        </Avatar>
                      </div>
                      <p className="text-xs">User {i}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex space-x-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user?.profilePic} />
                    <AvatarFallback className="bg-yellow-400 text-black">{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Textarea
                    placeholder={`What's your latest project, ${user?.name?.split(' ')[0]}?`}
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="min-h-20 resize-none border-gray-300"
                  />
                </div>
                {showUpload && (
                  <div className="mb-4">
                    <ImageUpload onUploadComplete={(url) => setMediaUrl(url)} />
                  </div>
                )}
                {mediaUrl && (
                  <div className="mb-4">
                    <img src={mediaUrl} alt="Upload" className="rounded-lg max-h-64 object-cover" />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <button onClick={() => setShowUpload(!showUpload)} className="flex items-center space-x-2 text-gray-600 hover:text-black">
                    <FiImage className="w-5 h-5" /><span className="text-sm">Photo</span>
                  </button>
                  <Button onClick={handleCreatePost} disabled={loading || (!newPost.trim() && !mediaUrl)} className="bg-black hover:bg-gray-900 text-white">
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post._id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar>
                        <AvatarImage src={post.author.profilePic} />
                        <AvatarFallback className="bg-yellow-400 text-black">{post.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-black">{post.author.name}</p>
                        <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">{post.content}</p>
                    {post.mediaUrl && <img src={post.mediaUrl} alt="Post" className="rounded-lg w-full object-cover max-h-96 mb-4" />}
                    <div className="flex items-center space-x-6 pt-3 border-t">
                      <button onClick={() => handleLike(post._id)} className="flex items-center space-x-2 text-gray-600 hover:text-red-500">
                        <FiHeart className={`w-5 h-5 ${post.likes.includes(user.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        <span>{post.likes.length}</span>
                      </button>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <FiMessageCircle className="w-5 h-5" />
                        <span>{post.comments.length}</span>
                      </div>
                    </div>
                    {post.comments.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {post.comments.map((comment, idx) => (
                          <div key={idx} className="flex space-x-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs">{comment.author?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                              <p className="text-sm font-semibold">{comment.author?.name}</p>
                              <p className="text-sm text-gray-700">{comment.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex space-x-2 mt-4">
                      <Input
                        placeholder="Write a comment..."
                        value={commentTexts[post._id] || ''}
                        onChange={(e) => setCommentTexts({ ...commentTexts, [post._id]: e.target.value })}
                        className="flex-1"
                      />
                      <Button onClick={() => handleComment(post._id)} size="sm" className="bg-black text-white">
                        <FiSend />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold text-black mb-4">Upcoming Webinars</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-semibold">Design Workshop</p>
                    <p className="text-xs text-gray-600">Wed 20 Sept, Online</p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold">AI in Construction</p>
                    <p className="text-xs text-gray-600">Fri 22 Sept, Virtual</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold text-black mb-4">Active Projects</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-black">P1</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Urban Development</p>
                      <p className="text-xs text-gray-500">5 members</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-white">P2</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Smart City</p>
                      <p className="text-xs text-gray-500">8 members</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;