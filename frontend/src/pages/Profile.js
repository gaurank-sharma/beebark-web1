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
import { FiEdit2, FiSave, FiPlus, FiTrash2, FiBriefcase } from 'react-icons/fi';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    profilePic: '',
    skills: [],
    experience: []
  });
  const [newSkill, setNewSkill] = useState('');
  const [newExperience, setNewExperience] = useState({
    title: '',
    company: '',
    duration: '',
    description: ''
  });
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [loading, setLoading] = useState(false);
  import { API_URL } from '../config/api'; // Auto-fixed

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        profilePic: user.profilePic || '',
        skills: user.skills || [],
        experience: user.experience || []
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

  const handleAddExperience = () => {
    if (newExperience.title && newExperience.company) {
      setFormData({ 
        ...formData, 
        experience: [...formData.experience, { ...newExperience }] 
      });
      setNewExperience({ title: '', company: '', duration: '', description: '' });
      setShowAddExperience(false);
      toast.success('Experience added');
    } else {
      toast.error('Please fill in title and company');
    }
  };

  const handleRemoveExperience = (index) => {
    setFormData({
      ...formData,
      experience: formData.experience.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="profile-page">
      <Navbar />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="shadow-xl border-slate-200">
          <CardHeader className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-24 h-24 border-4 border-white">
                  <AvatarImage src={formData.profilePic} />
                  <AvatarFallback className="bg-white text-yellow-700 text-2xl font-bold">
                    {formData.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl font-bold">{user?.name}</CardTitle>
                  <p className="text-gray-800">{user?.email}</p>
                  <Badge className="mt-2 bg-gray-900 text-yellow-400">{user?.role}</Badge>
                </div>
              </div>
              <Button
                onClick={() => editing ? handleSave() : setEditing(true)}
                className="bg-gray-900 text-yellow-400 hover:bg-gray-800"
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
                    <Button onClick={handleAddSkill} type="button" className="bg-yellow-500 hover:bg-yellow-600" data-testid="add-skill-button">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.skills.map((skill, idx) => (
                      <Badge
                        key={idx}
                        className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer"
                        onClick={() => handleRemoveSkill(skill)}
                      >
                        {skill} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Experience Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Experience</Label>
                    <Button
                      onClick={() => setShowAddExperience(!showAddExperience)}
                      className="bg-yellow-500 hover:bg-yellow-600"
                      size="sm"
                    >
                      <FiPlus className="mr-1" /> Add Experience
                    </Button>
                  </div>

                  {showAddExperience && (
                    <Card className="p-4 bg-slate-50">
                      <div className="space-y-3">
                        <Input
                          placeholder="Job Title"
                          value={newExperience.title}
                          onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                        />
                        <Input
                          placeholder="Company"
                          value={newExperience.company}
                          onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                        />
                        <Input
                          placeholder="Duration (e.g., Jan 2020 - Present)"
                          value={newExperience.duration}
                          onChange={(e) => setNewExperience({ ...newExperience, duration: e.target.value })}
                        />
                        <Textarea
                          placeholder="Description"
                          value={newExperience.description}
                          onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                          rows={3}
                        />
                        <div className="flex space-x-2">
                          <Button onClick={handleAddExperience} className="bg-yellow-500 hover:bg-yellow-600">
                            Save Experience
                          </Button>
                          <Button onClick={() => setShowAddExperience(false)} variant="outline">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="space-y-3">
                    {formData.experience.map((exp, idx) => (
                      <Card key={idx} className="p-4 relative">
                        <Button
                          onClick={() => handleRemoveExperience(idx)}
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <FiTrash2 />
                        </Button>
                        <div className="pr-10">
                          <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                          <p className="text-gray-700">{exp.company}</p>
                          <p className="text-sm text-gray-500">{exp.duration}</p>
                          {exp.description && (
                            <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                          )}
                        </div>
                      </Card>
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
                        <Badge key={idx} className="bg-yellow-500 text-gray-900">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-slate-500">No skills added yet</p>
                    )}
                  </div>
                </div>

                {/* Experience Display */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                    <FiBriefcase className="mr-2" /> Experience
                  </h3>
                  {formData.experience.length > 0 ? (
                    <div className="space-y-4">
                      {formData.experience.map((exp, idx) => (
                        <Card key={idx} className="p-4 border-l-4 border-yellow-500">
                          <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                          <p className="text-gray-700 font-medium">{exp.company}</p>
                          <p className="text-sm text-gray-500">{exp.duration}</p>
                          {exp.description && (
                            <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">No experience added yet</p>
                  )}
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