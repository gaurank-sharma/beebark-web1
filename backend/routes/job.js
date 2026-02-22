const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../config/cloudinary');
const { parseResume } = require('../utils/resumeParser');
const { matchCandidatesWithJob, getJobRecommendations } = require('../utils/jobMatcher');
const path = require('path');
const fs = require('fs');

router.post('/create', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (user.role !== 'recruiter') {
      return res.status(403).json({ error: 'Only recruiters can post jobs' });
    }

    const { title, description, company, location, salary } = req.body;

    if (!title || !description || !company) {
      return res.status(400).json({ error: 'Title, description, and company are required' });
    }

    const job = new Job({
      title,
      description,
      company,
      location,
      salary,
      postedBy: req.userId
    });

    await job.save();
    await job.populate('postedBy', 'name email profilePic');

    res.status(201).json({ message: 'Job posted successfully', job });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create job', message: error.message });
  }
});

router.get('/list', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const jobs = await Job.find({ status: 'active' })
      .populate('postedBy', 'name company profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Job.countDocuments({ status: 'active' });

    res.json({ 
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs', message: error.message });
  }
});

router.get('/:jobId', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId)
      .populate('postedBy', 'name email profilePic company')
      .populate('applicants.user', 'name email profilePic bio');

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job', message: error.message });
  }
});

router.post('/:jobId/apply', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'active') {
      return res.status(400).json({ error: 'Job is no longer active' });
    }

    const alreadyApplied = job.applicants.some(
      app => app.user.toString() === req.userId.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({ error: 'Already applied to this job' });
    }

    job.applicants.push({
      user: req.userId
    });

    await job.save();

    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply', message: error.message });
  }
});

router.get('/my/posted', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.userId })
      .populate('applicants.user', 'name email profilePic')
      .sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posted jobs', message: error.message });
  }
});

router.get('/my/applications', auth, async (req, res) => {
  try {
    const jobs = await Job.find({
      'applicants.user': req.userId
    })
    .populate('postedBy', 'name company profilePic')
    .sort({ createdAt: -1 });

    const applications = jobs.map(job => {
      const application = job.applicants.find(
        app => app.user.toString() === req.userId.toString()
      );
      return {
        job: {
          id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          postedBy: job.postedBy
        },
        appliedAt: application.appliedAt,
        status: application.status
      };
    });

    res.json({ applications });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications', message: error.message });
  }
});

module.exports = router;