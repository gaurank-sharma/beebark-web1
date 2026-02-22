# BeeBark - Professional Social Networking Platform

## Product Requirements Document

### Overview
BeeBark is a comprehensive social networking, chat, and enterprise meeting web application designed for professionals. The platform enables users to connect with other professionals, share posts, find jobs, and conduct video meetings.

### Tech Stack
- **Frontend**: React.js 19, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **Authentication**: JWT
- **Video**: WebRTC/PeerJS (infrastructure ready)

### Core Features

#### 1. Authentication & User Management ✅
- User registration with auto-generated username from email
- Secure login with JWT tokens
- Password reset functionality (email templates ready)
- User profiles with bio, skills, experience

#### 2. Connections System ✅
- **Search Feature**: Search users by name, username, or email
- Send/Accept/Reject connection requests
- View connection list
- AI-powered connection suggestions based on mutual connections and skills
- PRO MATCH card display

#### 3. Social Feed ✅
- Create text/image posts
- Like and comment on posts
- Story feature placeholder
- Upcoming webinars sidebar

#### 4. Real-Time Chat ✅
- 1-on-1 messaging between connected users
- Socket.io integration for real-time messages
- Message history persistence

#### 5. Video Meetings ✅
- Start instant meetings
- Schedule meetings for later
- Join meetings with code
- Meeting list display
- WebRTC infrastructure (client implementation pending)

#### 6. Job Portal ✅
- Browse available jobs
- AI-powered job recommendations based on resume skills
- Job applications tracking
- Recruiter job posting
- Top 10 candidate matching (basic keyword algorithm)
- Resume upload and parsing

### Design Theme
- **Primary Color**: Yellow (#FFC107)
- **Secondary Color**: Black (#1A1A1A)
- **Brand**: BeeBark with honeybee motif
- **Style**: Professional, modern, clean

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password/:token` - Reset password

#### Connections
- `GET /api/connections/search?query=` - **NEW** Search by name/username/email
- `GET /api/connections/suggestions` - Get connection suggestions
- `GET /api/connections/list` - Get user's connections
- `GET /api/connections/pending` - Get pending requests
- `POST /api/connections/send-request/:userId` - Send connection request
- `POST /api/connections/accept-request/:userId` - Accept request
- `POST /api/connections/reject-request/:userId` - Reject request
- `DELETE /api/connections/remove/:userId` - Remove connection

#### Posts
- `GET /api/posts/feed` - Get feed posts
- `POST /api/posts/create` - Create new post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comment` - Add comment

#### Jobs
- `GET /api/jobs/list` - Browse all jobs
- `GET /api/jobs/recommended` - Get AI-recommended jobs
- `GET /api/jobs/my/applications` - User's job applications
- `GET /api/jobs/my/posted` - Recruiter's posted jobs
- `POST /api/jobs/create` - Post new job (recruiters only)
- `POST /api/jobs/:id/apply` - Apply to job
- `POST /api/jobs/upload-resume` - Upload and parse resume
- `GET /api/jobs/:id/matched-candidates` - Get top 10 matches

#### Meetings
- `GET /api/meetings/list` - Get user's meetings
- `POST /api/meetings/create` - Create/schedule meeting

#### Messages
- `GET /api/messages/:userId` - Get messages with user

### Database Models

#### User
```javascript
{
  name: String,
  username: String (unique, auto-generated),
  email: String (unique),
  password: String (hashed),
  profilePic: String,
  bio: String,
  skills: [String],
  experience: [{title, company, duration, description}],
  connections: [ObjectId],
  pendingRequests: [ObjectId],
  sentRequests: [ObjectId],
  role: 'user' | 'recruiter',
  resume: {url, fileName, parsedData}
}
```

#### Job
```javascript
{
  title: String,
  description: String,
  company: String,
  location: String,
  salary: String,
  postedBy: ObjectId,
  applicants: [{user: ObjectId, appliedAt, status}],
  status: 'active' | 'closed'
}
```

### Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| User Registration | ✅ Complete | Username auto-generated |
| User Login | ✅ Complete | JWT authentication |
| Connection Search | ✅ Complete | Search by name/username/email |
| Connection Suggestions | ✅ Complete | AI-based algorithm |
| Social Feed | ✅ Complete | Posts, likes, comments |
| Real-time Chat | ✅ Complete | Socket.io messaging |
| Job Portal | ✅ Complete | Browse, apply, recommend |
| Video Meetings | ⚠️ Partial | UI complete, WebRTC pending |
| Resume Parsing | ⚠️ Basic | Keyword extraction only |

### Test Accounts
- **User**: test@beebark.com / test123456
- **Developer**: john.dev@beebark.com / test123456
- **Recruiter**: sarah.hr@beebark.com / test123456

### What's Implemented (Session Date: Feb 2026)
1. ✅ Fixed backend connection.js route syntax error
2. ✅ Added username field to User model
3. ✅ Implemented connection search API (name/username/email)
4. ✅ Updated auth routes to auto-generate username
5. ✅ Enhanced Connections page with search UI and tabs
6. ✅ Updated App.css with BeeBark theme styles
7. ✅ All pages working: Login, Register, Dashboard, Feed, Connections, Chat, Jobs, Meetings

### Future Tasks (Backlog)
- P1: Implement WebRTC for actual video/audio calls
- P1: Complete real-time chat with typing indicators
- P2: Enhance AI job matching with LLM integration
- P2: Add image upload to Cloudinary
- P2: Implement email notifications with Nodemailer
- P3: Add profile editing with skills/experience
- P3: Story feature implementation

### Preview URL
https://bee-connect-test.preview.emergentagent.com
