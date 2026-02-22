import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { FiHeart, FiMessageCircle, FiSend, FiImage } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading] = useState(false);
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
    if (!newPost.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/posts/create`, {
        content: newPost,
        mediaUrl
      });
      setPosts([response.data.post, ...posts]);
      setNewPost('');
      setMediaUrl('');
      toast.success('Post created!');
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

  return (
    <div className="min-h-screen bg-slate-50" data-testid="feed-page">
      <Navbar />
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card className="mb-6 shadow-md border-slate-200" data-testid="create-post-card">
          <CardContent className="pt-6">
            <form onSubmit={handleCreatePost}>
              <Textarea
                placeholder="What's on your mind?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-24 border-slate-300 focus:border-blue-500 resize-none"
                data-testid="post-content-input"
              />
              <div className="mt-3 flex items-center space-x-2">
                <Input
                  type="url"
                  placeholder="Image URL (optional)"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="flex-1 border-slate-300"
                  data-testid="post-media-input"
                />
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={loading || !newPost.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="post-submit-button"
                >
                  <FiSend className="mr-2" /> Post
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4" data-testid="posts-list">
          {posts.map((post) => (
            <Card key={post._id} className="shadow-md border-slate-200" data-testid={`post-${post._id}`}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={post.author.profilePic} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {post.author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-slate-900">{post.author.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap">{post.content}</p>
                {post.mediaUrl && (
                  <img
                    src={post.mediaUrl}
                    alt="Post media"
                    className="mt-4 rounded-lg w-full object-cover max-h-96"
                  />
                )}
              </CardContent>
              <CardFooter className="flex-col items-start space-y-4">
                <div className="flex items-center space-x-6 w-full">
                  <button
                    onClick={() => handleLike(post._id)}
                    className="flex items-center space-x-2 text-slate-600 hover:text-red-500 transition-colors"
                    data-testid={`like-button-${post._id}`}
                  >
                    <FiHeart
                      className={`w-5 h-5 ${post.likes.includes(user.id) ? 'fill-red-500 text-red-500' : ''}`}
                    />
                    <span>{post.likes.length}</span>
                  </button>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <FiMessageCircle className="w-5 h-5" />
                    <span>{post.comments.length}</span>
                  </div>
                </div>

                {post.comments.length > 0 && (
                  <div className="w-full space-y-3 pt-3 border-t border-slate-200">
                    {post.comments.map((comment, idx) => (
                      <div key={idx} className="flex space-x-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.author?.profilePic} />
                          <AvatarFallback className="bg-slate-600 text-white text-xs">
                            {comment.author?.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-slate-100 rounded-lg px-3 py-2">
                          <p className="text-sm font-semibold text-slate-900">{comment.author?.name}</p>
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
                    className="flex-1 border-slate-300"
                    data-testid={`comment-input-${post._id}`}
                  />
                  <Button
                    onClick={() => handleComment(post._id)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
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
  );
};

export default Feed;