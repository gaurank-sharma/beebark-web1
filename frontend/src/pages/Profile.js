import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { FiEdit2, FiSave } from 'react-icons/fi';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    profilePic: '',
    skills: []
  });
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        profilePic: user.profilePic || '',
        skills: user.skills || []
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await axios.put(`${API_URL}/api/profile/update`, formData);
      setUser(response.data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="profile-page">
      <Navbar />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="shadow-xl border-slate-200">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-24 h-24 border-4 border-white">
                  <AvatarImage src={formData.profilePic} />
                  <AvatarFallback className="bg-white text-blue-700 text-2xl">
                    {formData.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{user?.name}</CardTitle>
                  <p className="text-blue-100">{user?.email}</p>
                  <Badge className="mt-2 bg-white text-blue-700">{user?.role}</Badge>
                </div>
              </div>
              <Button
                onClick={() => editing ? handleSave() : setEditing(true)}
                variant="secondary"
                disabled={loading}
                data-testid="edit-profile-button"
              >
                {editing ? <><FiSave className="mr-2" /> Save</> : <><FiEdit2 className="mr-2" /> Edit</>}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="mt-6 space-y-6">
            {editing ? (
              <>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="border-slate-300"
                    data-testid="name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Profile Picture URL</Label>
                  <Input
                    value={formData.profilePic}
                    onChange={(e) => setFormData({ ...formData, profilePic: e.target.value })}
                    className="border-slate-300"
                    data-testid="profile-pic-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="min-h-24 border-slate-300"
                    data-testid="bio-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Skills</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                      placeholder="Add a skill"
                      className="border-slate-300"
                      data-testid="skill-input"
                    />
                    <Button onClick={handleAddSkill} type="button" data-testid="add-skill-button">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.skills.map((skill, idx) => (
                      <Badge
                        key={idx}
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                        onClick={() => handleRemoveSkill(skill)}
                      >
                        {skill} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">About</h3>
                  <p className="text-slate-700">{formData.bio || 'No bio yet'}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.length > 0 ? (
                      formData.skills.map((skill, idx) => (
                        <Badge key={idx} className="bg-blue-600">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-slate-500">No skills added yet</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Connections</h3>
                  <p className="text-slate-700">{user?.connections?.length || 0} connections</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;