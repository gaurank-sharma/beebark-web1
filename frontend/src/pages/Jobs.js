import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiBriefcase, FiMapPin, FiDollarSign } from 'react-icons/fi';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    salary: ''
  });
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchJobs();
    fetchMyApplications();
    if (user?.role === 'recruiter') {
      fetchMyPostedJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/jobs/list`);
      setJobs(response.data.jobs);
    } catch (error) {
      toast.error('Failed to load jobs');
    }
  };

  const fetchMyPostedJobs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/jobs/my/posted`);
      setMyJobs(response.data.jobs);
    } catch (error) {
      console.error('Failed to load posted jobs');
    }
  };

  const fetchMyApplications = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/jobs/my/applications`);
      setApplications(response.data.applications);
    } catch (error) {
      console.error('Failed to load applications');
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/jobs/create`, formData);
      toast.success('Job posted successfully!');
      setOpenDialog(false);
      setFormData({ title: '', description: '', company: '', location: '', salary: '' });
      fetchJobs();
      fetchMyPostedJobs();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to post job');
    }
  };

  const handleApply = async (jobId) => {
    try {
      await axios.post(`${API_URL}/api/jobs/${jobId}/apply`);
      toast.success('Application submitted!');
      fetchMyApplications();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to apply');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="jobs-page">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Job Board</h1>
          {user?.role === 'recruiter' && (
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700" data-testid="post-job-button">
                  <FiPlus className="mr-2" /> Post Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Post a New Job</DialogTitle>
                </DialogHeader>
                <form onSubmit={handlePostJob} className="space-y-4" data-testid="post-job-form">
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      data-testid="job-title-input"
                      className="border-slate-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      required
                      data-testid="job-company-input"
                      className="border-slate-300"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        data-testid="job-location-input"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Salary</Label>
                      <Input
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        placeholder="e.g. $80k-100k"
                        data-testid="job-salary-input"
                        className="border-slate-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Job Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      className="min-h-32 border-slate-300"
                      data-testid="job-description-input"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" data-testid="submit-job-button">
                    Post Job
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="browse" data-testid="browse-tab">Browse Jobs</TabsTrigger>
            <TabsTrigger value="applied" data-testid="applied-tab">My Applications</TabsTrigger>
            {user?.role === 'recruiter' && (
              <TabsTrigger value="posted" data-testid="posted-tab">Posted Jobs</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="browse" data-testid="browse-jobs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <Card key={job._id} className="shadow-md border-slate-200" data-testid={`job-${job._id}`}>
                  <CardHeader>
                    <CardTitle className="text-xl text-slate-900">{job.title}</CardTitle>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center text-slate-600 text-sm">
                        <FiBriefcase className="mr-2" />
                        {job.company}
                      </div>
                      {job.location && (
                        <div className="flex items-center text-slate-600 text-sm">
                          <FiMapPin className="mr-2" />
                          {job.location}
                        </div>
                      )}
                      {job.salary && (
                        <div className="flex items-center text-slate-600 text-sm">
                          <FiDollarSign className="mr-2" />
                          {job.salary}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 line-clamp-3">{job.description}</p>
                    <Badge className="mt-3 bg-blue-600">Active</Badge>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => handleApply(job._id)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      data-testid={`apply-${job._id}`}
                    >
                      Apply Now
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            {jobs.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <p>No jobs available at the moment</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="applied" data-testid="my-applications">
            <div className="space-y-4">
              {applications.map((app, idx) => (
                <Card key={idx} className="shadow-md border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-xl text-slate-900">{app.job.title}</CardTitle>
                    <div className="flex items-center text-slate-600 text-sm mt-2">
                      <FiBriefcase className="mr-2" />
                      {app.job.company}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600">
                        Applied on {new Date(app.appliedAt).toLocaleDateString()}
                      </p>
                      <Badge className={app.status === 'pending' ? 'bg-yellow-500' : 'bg-green-600'}>
                        {app.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {applications.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <p>You haven't applied to any jobs yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {user?.role === 'recruiter' && (
            <TabsContent value="posted" data-testid="posted-jobs">
              <div className="space-y-4">
                {myJobs.map((job) => (
                  <Card key={job._id} className="shadow-md border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-xl text-slate-900">{job.title}</CardTitle>
                      <div className="flex items-center text-slate-600 text-sm mt-2">
                        <FiBriefcase className="mr-2" />
                        {job.company}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-700 mb-4">{job.description}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600">
                          <strong>{job.applicants.length}</strong> applicants
                        </p>
                        <Badge className={job.status === 'active' ? 'bg-blue-600' : 'bg-slate-600'}>
                          {job.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {myJobs.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <p>You haven't posted any jobs yet</p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Jobs;