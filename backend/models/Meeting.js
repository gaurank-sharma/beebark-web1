const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  meetingId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    default: 'Untitled Meeting'
  },
  scheduledTime: {
    type: Date,
    default: Date.now
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'ended'],
    default: 'scheduled'
  },
  duration: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Meeting', meetingSchema);