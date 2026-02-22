import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import ImageUpload from '../components/ImageUpload';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
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
      toast.error('Failed to load feed');
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
      toast.success('Post created!');
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (url) => {
    setMediaUrl(url);
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`${API_URL}/api/posts/${postId}/like`);
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const isLiked = post.likes.includes(user.id);
          return {
            ...post,
            likes: isLiked 
              ? post.likes.filter(id => id !== user.id)
              : [...post.likes, user.id]
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
      setPosts(posts.map(post => 
        post._id === postId ? { ...post, comments: response.data.comments } : post
      ));
      setCommentTexts({ ...commentTexts, [postId]: '' });
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const stories = [
    { id: 1, name: 'Your Story', avatar: user?.profilePic, isAdd: true },
    { id: 2, name: 'User 1', avatar: '' },
    { id: 3, name: 'User 2', avatar: '' },
    { id: 4, name: 'User 3', avatar: '' },
    { id: 5, name: 'User 4', avatar: '' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <TopBar />
      
      <div className="ml-64 mt-16 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Stories Section */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {stories.map((story) => (
                  <div key={story.id} className="flex-shrink-0 text-center cursor-pointer">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                      story.isAdd 
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 border-2 border-yellow-600'
                        : 'bg-gradient-to-br from-purple-400 to-pink-500 border-2 border-white'
                    }`}>
                      {story.isAdd ? (
                        <FiPlus className="w-6 h-6 text-black" />
                      ) : (
                        <Avatar className="w-14 h-14">
                          <AvatarImage src={story.avatar} />
                          <AvatarFallback className="bg-slate-200">
                            {story.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    <p className="text-xs font-medium">{story.isAdd ? 'Add Story' : story.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Create Post */}
          <Card data-testid="create-post-card">
            <CardContent className="pt-6">
              <div className="flex space-x-3 mb-4">
                <Avatar>
                  <AvatarImage src={user?.profilePic} />
                  <AvatarFallback className="bg-yellow-400 text-black">
                    {user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Textarea
                  placeholder="What's your latest project, Gaurank?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-20 resize-none border-slate-300"
                  data-testid="post-content-input"
                />
              </div>

              {showUpload && (
                <div className="mb-4">
                  <ImageUpload onUploadComplete={handleImageUpload} />
                </div>
              )}

              {mediaUrl && (
                <div className="mb-4">
                  <img src={mediaUrl} alt="Upload preview" className="rounded-lg max-h-64 object-cover" />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUpload(!showUpload)}
                    className="text-slate-600"
                  >
                    <FiImage className="mr-2" /> Photo
                  </Button>
                </div>
                <Button
                  onClick={handleCreatePost}
                  disabled={loading || (!newPost.trim() && !mediaUrl)}
                  className="btn-black"
                  data-testid="post-submit-button"
                >
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          <div className="space-y-6" data-testid="posts-list">
            {posts.map((post) => (
              <Card key={post._id} data-testid={`post-${post._id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={post.author.profilePic} />
                        <AvatarFallback className="bg-yellow-400 text-black">
                          {post.author.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-black">{post.author.name}</p>
                        <p className="text-xs text-slate-500">
                          {post.author.role} • {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 whitespace-pre-wrap mb-4">{post.content}</p>
                  {post.mediaUrl && (
                    <img
                      src={post.mediaUrl}
                      alt="Post media"
                      className="rounded-lg w-full object-cover max-h-96"
                    />
                  )}
                </CardContent>
                <CardFooter className="flex-col items-start space-y-4 border-t">
                  <div className="flex items-center space-x-6 w-full pt-3">
                    <button
                      onClick={() => handleLike(post._id)}
                      className="flex items-center space-x-2 text-slate-600 hover:text-red-500 transition-colors"
                      data-testid={`like-button-${post._id}`}
                    >
                      <FiHeart
                        className={`w-5 h-5 ${post.likes.includes(user.id) ? 'fill-red-500 text-red-500' : ''}`}
                      />
                      <span className="font-medium">{post.likes.length}</span>
                    </button>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <FiMessageCircle className="w-5 h-5" />
                      <span className="font-medium">{post.comments.length}</span>
                    </div>
                  </div>

                  {post.comments.length > 0 && (
                    <div className="w-full space-y-3">
                      {post.comments.map((comment, idx) => (
                        <div key={idx} className="flex space-x-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.author?.profilePic} />
                            <AvatarFallback className="bg-slate-300 text-xs">
                              {comment.author?.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-sm font-semibold">{comment.author?.name}</p>
                            <p className="text-sm text-slate-700">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex space-x-2 w-full">
                    <Input
                      placeholder="Write a comment..."
                      value={commentTexts[post._id] || ''}
                      onChange={(e) => setCommentTexts({ ...commentTexts, [post._id]: e.target.value })}
                      className="flex-1"
                      data-testid={`comment-input-${post._id}`}
                    />
                    <Button
                      onClick={() => handleComment(post._id)}
                      size="sm"
                      className="btn-black"
                      data-testid={`comment-button-${post._id}`}
                    >
                      <FiSend />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;