# ═══════════════════════════════════════════════════════════════════════════════
#                           BEEBARK - COMPLETE DOCUMENTATION
#                    Professional Social Networking Platform
# ═══════════════════════════════════════════════════════════════════════════════

## TABLE OF CONTENTS
1. Project Overview
2. Tech Stack
3. Project Structure
4. Database Models
5. API Endpoints (Complete Reference)
6. Frontend Pages & Components
7. Real-time Features (Socket.io)
8. Authentication System
9. Environment Variables
10. Test Accounts
11. Feature Implementation Status
12. Deployment Information

═══════════════════════════════════════════════════════════════════════════════
## 1. PROJECT OVERVIEW
═══════════════════════════════════════════════════════════════════════════════

BeeBark is a comprehensive social networking, chat, and enterprise meeting web 
application designed for professionals. The platform enables users to:
- Connect with other professionals (search by name/username/email)
- Share posts with images
- Real-time chat messaging
- Video meetings (Zoom/Meet clone)
- Job portal with AI-powered matching
- Resume upload and parsing

### Design Theme
- Primary Color: Yellow (#FFC107)
- Secondary Color: Black (#1A1A1A)
- Brand Identity: BeeBark with honeybee motif
- Style: Professional, modern, clean

### Preview URL
https://bee-connect-test.preview.emergentagent.com

═══════════════════════════════════════════════════════════════════════════════
## 2. TECH STACK
═══════════════════════════════════════════════════════════════════════════════

### Backend
- Runtime: Node.js
- Framework: Express.js
- Database: MongoDB with Mongoose ODM
- Authentication: JWT (jsonwebtoken)
- Password Hashing: bcryptjs
- Real-time: Socket.io
- File Upload: Multer
- PDF Parsing: pdf-parse
- DOCX Parsing: mammoth
- NLP: natural
- Validation: express-validator

### Frontend
- Framework: React.js 19
- Styling: Tailwind CSS
- UI Components: Shadcn/UI (Radix primitives)
- Routing: react-router-dom v7
- HTTP Client: axios
- Real-time: socket.io-client
- File Upload: react-dropzone
- Icons: react-icons, lucide-react
- Toast Notifications: sonner
- Video: PeerJS (WebRTC wrapper)

### Database
- MongoDB (localhost:27017)
- Database Name: social_network_db

═══════════════════════════════════════════════════════════════════════════════
## 3. PROJECT STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

/app/
├── backend/
│   ├── config/
│   │   └── cloudinary.js          # Cloudinary config (optional)
│   ├── middleware/
│   │   └── auth.js                # JWT authentication middleware
│   ├── models/
│   │   ├── User.js                # User model
│   │   ├── Post.js                # Post model with comments
│   │   ├── Message.js             # Chat message model
│   │   ├── Job.js                 # Job posting model
│   │   └── Meeting.js             # Video meeting model
│   ├── routes/
│   │   ├── auth.js                # Authentication routes
│   │   ├── profile.js             # User profile routes
│   │   ├── connection.js          # Connection/Network routes
│   │   ├── post.js                # Social feed routes
│   │   ├── message.js             # Chat message routes
│   │   ├── job.js                 # Job portal routes
│   │   ├── meeting.js             # Video meeting routes
│   │   └── upload.js              # File upload routes
│   ├── utils/
│   │   ├── email.js               # Email utilities
│   │   ├── jobMatcher.js          # AI job matching algorithm
│   │   ├── recommendationEngine.js # Connection suggestions
│   │   └── resumeParser.js        # Resume parsing utility
│   ├── server.js                  # Main server entry
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                # Shadcn UI components
│   │   │   ├── Sidebar.js         # Main navigation sidebar
│   │   │   ├── TopBar.js          # Top navigation bar
│   │   │   └── ImageUpload.js     # Image upload component
│   │   ├── context/
│   │   │   ├── AuthContext.js     # Authentication context
│   │   │   └── SocketContext.js   # Socket.io context
│   │   ├── pages/
│   │   │   ├── Login.js           # Login page
│   │   │   ├── Register.js        # Registration page
│   │   │   ├── ForgotPassword.js  # Password reset page
│   │   │   ├── Dashboard.js       # Main dashboard
│   │   │   ├── Feed.js            # Social feed page
│   │   │   ├── Connections.js     # Network/Connections page
│   │   │   ├── Chat.js            # Real-time chat page
│   │   │   ├── Jobs.js            # Job portal page
│   │   │   ├── Meetings.js        # Video meetings page
│   │   │   └── Profile.js         # User profile page
│   │   ├── App.js                 # Main app with routing
│   │   ├── App.css                # Global styles + BeeBark theme
│   │   └── index.js               # React entry point
│   ├── package.json
│   └── .env
│
└── memory/
    └── PRD.md                     # Product Requirements Document

═══════════════════════════════════════════════════════════════════════════════
## 4. DATABASE MODELS
═══════════════════════════════════════════════════════════════════════════════

### USER MODEL (/app/backend/models/User.js)
```javascript
{
  name: String (required),              // Full name
  username: String (unique, auto-gen),  // Auto-generated from email
  email: String (required, unique),     // Email address
  password: String (required, hashed),  // Bcrypt hashed password
  profilePic: String (default: ''),     // Profile picture URL
  bio: String (default: ''),            // User bio/description
  skills: [String],                     // Array of skills
  experience: [{                        // Work experience
    title: String,
    company: String,
    duration: String,
    description: String
  }],
  connections: [ObjectId ref User],     // Connected users
  pendingRequests: [ObjectId ref User], // Incoming requests
  sentRequests: [ObjectId ref User],    // Outgoing requests
  role: 'user' | 'recruiter',          // User role
  resume: {                             // Resume data
    url: String,
    fileName: String,
    parsedData: {
      skills: [String],
      experience: Mixed,
      education: [String],
      email: String,
      phone: String
    },
    uploadedAt: Date
  },
  resetPasswordToken: String,           // Password reset token
  resetPasswordExpires: Date,           // Token expiry
  createdAt: Date,
  updatedAt: Date
}
```

### POST MODEL (/app/backend/models/Post.js)
```javascript
{
  author: ObjectId ref User (required), // Post author
  content: String (required),           // Post text content
  mediaUrl: String (default: ''),       // Attached image URL
  likes: [ObjectId ref User],           // Users who liked
  comments: [{                          // Comments array
    author: ObjectId ref User,
    text: String,
    createdAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### MESSAGE MODEL (/app/backend/models/Message.js)
```javascript
{
  sender: ObjectId ref User (required),   // Message sender
  receiver: ObjectId ref User (required), // Message receiver
  text: String (required),                // Message content
  read: Boolean (default: false),         // Read status
  createdAt: Date,
  updatedAt: Date
}
// Index: { sender: 1, receiver: 1, createdAt: -1 }
```

### JOB MODEL (/app/backend/models/Job.js)
```javascript
{
  title: String (required),             // Job title
  description: String (required),       // Job description
  company: String (required),           // Company name
  location: String (default: ''),       // Job location
  salary: String (default: ''),         // Salary range
  postedBy: ObjectId ref User,          // Recruiter who posted
  applicants: [{                        // Job applicants
    user: ObjectId ref User,
    appliedAt: Date (default: now),
    status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
  }],
  status: 'active' | 'closed',          // Job status
  createdAt: Date,
  updatedAt: Date
}
```

### MEETING MODEL (/app/backend/models/Meeting.js)
```javascript
{
  host: ObjectId ref User (required),   // Meeting host
  meetingId: String (unique, required), // Unique meeting code
  title: String (default: 'Untitled'),  // Meeting title
  scheduledTime: Date (default: now),   // Scheduled time
  participants: [ObjectId ref User],    // Meeting participants
  status: 'scheduled' | 'ongoing' | 'ended',
  duration: Number (default: 0),        // Duration in minutes
  createdAt: Date,
  updatedAt: Date
}
```

═══════════════════════════════════════════════════════════════════════════════
## 5. API ENDPOINTS (COMPLETE REFERENCE)
═══════════════════════════════════════════════════════════════════════════════

Base URL: https://bee-connect-test.preview.emergentagent.com/api

### HEALTH CHECK
┌─────────────────────────────────────────────────────────────────────────────┐
│ GET /api/health                                                             │
│ Response: { status: 'ok', message: 'Server is running' }                    │
└─────────────────────────────────────────────────────────────────────────────┘

### AUTHENTICATION (/api/auth)
┌─────────────────────────────────────────────────────────────────────────────┐
│ POST /api/auth/register                                                     │
│ Body: { name, email, password, role? }                                      │
│ Response: { message, token, user: { id, name, username, email, role } }     │
│ Note: Username is auto-generated from email                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ POST /api/auth/login                                                        │
│ Body: { email, password }                                                   │
│ Response: { message, token, user: { id, name, username, email, role } }     │
├─────────────────────────────────────────────────────────────────────────────┤
│ POST /api/auth/forgot-password                                              │
│ Body: { email }                                                             │
│ Response: { message: 'Password reset email sent' }                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ POST /api/auth/reset-password/:token                                        │
│ Body: { password }                                                          │
│ Response: { message: 'Password reset successful' }                          │
└─────────────────────────────────────────────────────────────────────────────┘

### USER PROFILE (/api/profile) [Auth Required]
┌─────────────────────────────────────────────────────────────────────────────┐
│ GET /api/profile/me                                                         │
│ Response: { user: { ...userObject without password } }                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ GET /api/profile/:userId                                                    │
│ Response: { user: { ...publicUserData } }                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ PUT /api/profile/update                                                     │
│ Body: { name?, bio?, profilePic?, skills?, experience? }                    │
│ Response: { message, user }                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ GET /api/profile/search/users?query=searchTerm                              │
│ Response: { users: [...] }                                                  │
└─────────────────────────────────────────────────────────────────────────────┘

### CONNECTIONS (/api/connections) [Auth Required]
┌─────────────────────────────────────────────────────────────────────────────┐
│ GET /api/connections/search?query=searchTerm                                │
│ Search by: name, username, email                                            │
│ Response: { users: [{ ...user, isConnected, requestSent }] }                │
├─────────────────────────────────────────────────────────────────────────────┤
│ GET /api/connections/suggestions                                            │
│ Response: { suggestions: [{ ...user, suggestionScore, mutualConnections }] }│
├─────────────────────────────────────────────────────────────────────────────┤
│ GET /api/connections/list                                                   │
│ Response: { connections: [...connectedUsers] }                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ GET /api/connections/pending                                                │
│ Response: { requests: [...pendingRequestUsers] }                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ POST /api/connections/send-request/:targetUserId                            │
│ Response: { message: 'Connection request sent' }                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ POST /api/connections/accept-request/:requesterId                           │
│ Response: { message: 'Connection request accepted' }                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ POST /api/connections/reject-request/:requesterId                           │
│ Response: { message: 'Connection request rejected' }                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ DELETE /api/connections/remove/:connectionId                                │
│ Response: { message: 'Connection removed' }                                 │
└─────────────────────────────────────────────────────────────────────────────┘

### POSTS/FEED (/api/posts) [Auth Required]
┌─────────────────────────────────────────────────────────────────────────────┐
│ GET /api/posts/feed?page=1&limit=20                                         │
│ Response: { posts: [...], pagination: { page, limit, total, pages } }       │
├─────────────────────────────────────────────────────────────────────────────┤
│ POST /api/posts/create                                                      │
│ Body: { content, mediaUrl? }                                                │
│ Response: { message, post }                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ POST /api/posts/:postId/like                                                │
│ Response: { message, likes: count }                                         │
│ Note: Toggle like/unlike                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ POST /api/posts/:postId/comment                                             │
│ Body: { text }                                                              │
│ Response: { message, comments: [...] }                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ DELETE /api/posts/:postId                                                   │
│ Response: { message: 'Post deleted' }                                       │
│ Note: Only author can delete                                                │
└─────────────────────────────────────────────────────────────────────────────┘

### MESSAGES (/api/messages) [Auth Required]
┌─────────────────────────────────────────────────────────────────────────────┐
│ GET /api/messages/:connectionId                                             │
│ Response: { messages: [...] }                                               │
│ Note: Returns last 100 messages                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ POST /api/messages/send                                                     │
│ Body: { receiver, text }                                                    │
│ Response: { message, data: messageObject }                                  │
│ Note: Can only message connections                                          │
└─────────────────────────────────────────────────────────────────────────────┘

### JOBS (/api/jobs) [Auth Required]
┌─────────────────────────────────────────────────────────────────────────────┐
│ GET /api/jobs/list?page=1&limit=20                                          │
│ Response: { jobs: [...], pagination }                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ GET /api/jobs/recommended                                                   │
│ Response: { recommendations: [{ ...job, matchScore, matchedSkills }] }      │
│ Note: Based on user's resume skills                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ GET /api/jobs/my/applications                                               │
│ Response: { applications: [{ job, appliedAt, status }] }                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ GET /api/jobs/my/posted                                                     │
│ Response: { jobs: [...] }                                                   │
│ Note: Recruiters only                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ GET /api/jobs/:jobId                                                        │
│ Response: { job }                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ POST /api/jobs/create                                                       │
│ Body: { title, description, company, location?, salary? }                   │
│ Response: { message, job }                                                  │
│ Note: Recruiters only                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ POST /api/jobs/:jobId/apply                                                 │
│ Response: { message: 'Application submitted successfully' }                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ POST /api/jobs/upload-resume                                                │
│ Body: FormData with 'resume' file (PDF/DOCX)                                │
│ Response: { message, parsedData: { skills, experience, education } }        │
├─────────────────────────────────────────────────────────────────────────────┤
│ GET /api/jobs/:jobId/matched-candidates                                     │
│ Response: { matchedCandidates: [{ ...user, matchScore, matchedSkills }] }   │
│ Note: Recruiters only, returns top 10 matches                               │
└─────────────────────────────────────────────────────────────────────────────┘

### MEETINGS (/api/meetings) [Auth Required]
┌─────────────────────────────────────────────────────────────────────────────┐
│ GET /api/meetings/list                                                      │
│ Response: { meetings: [...] }                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ GET /api/meetings/:meetingId                                                │
│ Response: { meeting }                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ POST /api/meetings/create                                                   │
│ Body: { title?, scheduledTime?, participants?, duration? }                  │
│ Response: { message, meeting }                                              │
│ Note: meetingId is auto-generated                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ POST /api/meetings/:meetingId/join                                          │
│ Response: { message, meeting }                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ PUT /api/meetings/:meetingId/end                                            │
│ Response: { message, meeting }                                              │
│ Note: Host only                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ DELETE /api/meetings/:meetingId                                             │
│ Response: { message: 'Meeting deleted' }                                    │
│ Note: Host only                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

### FILE UPLOAD (/api/upload) [Auth Required]
┌─────────────────────────────────────────────────────────────────────────────┐
│ POST /api/upload/image                                                      │
│ Body: FormData with 'image' file                                            │
│ Response: { url: 'uploaded_image_url' }                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ POST /api/upload/multiple                                                   │
│ Body: FormData with 'images' files                                          │
│ Response: { images: ['url1', 'url2', ...] }                                 │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
## 6. FRONTEND PAGES & COMPONENTS
═══════════════════════════════════════════════════════════════════════════════

### ROUTES (App.js)
┌─────────────────────────────────────────────────────────────────────────────┐
│ Route                    │ Component       │ Auth Required │ Description    │
├──────────────────────────┼─────────────────┼───────────────┼────────────────┤
│ /                        │ Redirect        │ No            │ → /dashboard   │
│ /login                   │ Login           │ No            │ Login page     │
│ /register                │ Register        │ No            │ Signup page    │
│ /forgot-password         │ ForgotPassword  │ No            │ Reset request  │
│ /dashboard               │ Dashboard       │ Yes           │ Main dashboard │
│ /feed                    │ Feed            │ Yes           │ Social feed    │
│ /profile                 │ Profile         │ Yes           │ User profile   │
│ /connections             │ Connections     │ Yes           │ Network page   │
│ /chat                    │ Chat            │ Yes           │ Messaging      │
│ /jobs                    │ Jobs            │ Yes           │ Job portal     │
│ /meetings                │ Meetings        │ Yes           │ Video meetings │
└─────────────────────────────────────────────────────────────────────────────┘

### PAGE DESCRIPTIONS

**Login Page** (/login)
- Email/password form
- Social login buttons (Facebook, GitHub, Google) - UI only
- "Remember me" checkbox
- Link to forgot password
- Link to register

**Register Page** (/register)
- Email, username, password, confirm password form
- Role selection (user/recruiter)
- Social signup buttons - UI only
- Link to login

**Dashboard Page** (/dashboard)
- Overview statistics
- Recent activity
- Quick actions

**Feed Page** (/feed)
- Stories row (Add Story + User stories)
- Create post form with image upload
- Posts feed with likes/comments
- Upcoming webinars sidebar
- Active projects sidebar

**Connections Page** (/connections)
- **Search bar** - Search by name, username, or email
- **Tabs**: Suggestions, Search Results, My Network, Pending
- PRO MATCH cards for suggestions
- Connect/Message buttons
- Accept/Reject for pending requests

**Chat Page** (/chat)
- Connections list sidebar
- Message thread view
- Real-time messaging
- Voice/video call buttons (UI ready)

**Jobs Page** (/jobs)
- **Tabs**: Browse Jobs, Recommended, My Applications, Posted Jobs (recruiters)
- Resume upload button
- Job cards with apply button
- AI match score display
- Top 10 candidates view (recruiters)

**Meetings Page** (/meetings)
- Start instant meeting button
- Schedule meeting button
- Join meeting with code
- Upcoming meetings list

### REUSABLE COMPONENTS

**Sidebar** (/components/Sidebar.js)
- BeeBark logo
- Navigation menu items
- Active state with yellow highlight
- User profile section at bottom

**TopBar** (/components/TopBar.js)
- Global search input
- Stats badges (2.4k, 12)
- Dark mode toggle
- Notifications bell
- User avatar dropdown
- Logout button

**ImageUpload** (/components/ImageUpload.js)
- Drag & drop zone
- File type validation (JPG, PNG, GIF, WebP)
- 5MB max size
- Preview with remove button
- Upload progress indicator

═══════════════════════════════════════════════════════════════════════════════
## 7. REAL-TIME FEATURES (SOCKET.IO)
═══════════════════════════════════════════════════════════════════════════════

### Socket Events

**Client → Server:**
- `user-connected` - Register user's socket ID
- `send-message` - Send chat message { sender, receiver, text }
- `call-user` - Initiate call { to, from, callType }

**Server → Client:**
- `receive-message` - Incoming message notification
- `message-sent` - Message delivery confirmation
- `message-error` - Message send failure
- `incoming-call` - Incoming call notification { from, callType }

### Implementation (server.js)
```javascript
io.on('connection', (socket) => {
  socket.on('user-connected', (userId) => {
    connectedUsers.set(userId, socket.id);
  });

  socket.on('send-message', async (data) => {
    // Save message to DB
    // Emit to receiver if online
  });

  socket.on('call-user', (data) => {
    // Forward call to receiver
  });
});
```

═══════════════════════════════════════════════════════════════════════════════
## 8. AUTHENTICATION SYSTEM
═══════════════════════════════════════════════════════════════════════════════

### JWT Token Flow
1. User registers/logs in
2. Server generates JWT with userId, expires in 7 days
3. Token stored in localStorage
4. Axios interceptor adds `Authorization: Bearer <token>` header
5. Backend middleware validates token on protected routes

### Auth Middleware (/middleware/auth.js)
```javascript
const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId);
  req.user = user;
  req.userId = user._id;
  next();
};
```

### Frontend AuthContext
- `user` - Current user object
- `token` - JWT token
- `loading` - Auth state loading
- `login(email, password)` - Login function
- `register(name, email, password, role)` - Register function
- `logout()` - Logout function

═══════════════════════════════════════════════════════════════════════════════
## 9. ENVIRONMENT VARIABLES
═══════════════════════════════════════════════════════════════════════════════

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=social_network_db
CORS_ORIGINS=*
JWT_SECRET=BeeBark2026SuperSecureProductionKey_ChangeInProduction
PORT=8001
APP_URL=https://bee-connect-test.preview.emergentagent.com

# Optional - Cloudinary for image storage
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional - Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@beebark.com
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://bee-connect-test.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

═══════════════════════════════════════════════════════════════════════════════
## 10. TEST ACCOUNTS
═══════════════════════════════════════════════════════════════════════════════

| Role      | Name            | Email                    | Username  | Password     |
|-----------|-----------------|--------------------------|-----------|--------------|
| User      | Test User       | test@beebark.com         | test      | test123456   |
| User      | John Developer  | john.dev@beebark.com     | johndev   | test123456   |
| Recruiter | Sarah Recruiter | sarah.hr@beebark.com     | sarahhr   | test123456   |
| User      | Mike Engineer   | mike.eng@beebark.com     | mikeeng   | test123456   |

═══════════════════════════════════════════════════════════════════════════════
## 11. FEATURE IMPLEMENTATION STATUS
═══════════════════════════════════════════════════════════════════════════════

| Feature                    | Status      | Notes                            |
|----------------------------|-------------|----------------------------------|
| User Registration          | ✅ Complete | Username auto-generated          |
| User Login                 | ✅ Complete | JWT authentication               |
| Password Reset             | ✅ Complete | Email template ready             |
| User Profile               | ✅ Complete | View/Edit profile                |
| Connection Search          | ✅ Complete | Search by name/username/email    |
| Connection Suggestions     | ✅ Complete | AI-based scoring algorithm       |
| Connection Requests        | ✅ Complete | Send/Accept/Reject               |
| Social Feed                | ✅ Complete | Posts, likes, comments           |
| Image Upload               | ✅ Complete | Local storage (Cloudinary ready) |
| Real-time Chat             | ✅ Complete | Socket.io messaging              |
| Job Browsing               | ✅ Complete | List, filter, apply              |
| Resume Upload              | ✅ Complete | PDF/DOCX parsing                 |
| Job Recommendations        | ⚠️ Basic   | Keyword matching (not AI)        |
| Candidate Matching         | ⚠️ Basic   | Keyword matching (not AI)        |
| Video Meetings UI          | ✅ Complete | Start, schedule, join            |
| Video Meetings WebRTC      | ⏳ Pending  | Infrastructure ready             |
| Email Notifications        | ⏳ Pending  | Nodemailer configured            |

═══════════════════════════════════════════════════════════════════════════════
## 12. DEPLOYMENT INFORMATION
═══════════════════════════════════════════════════════════════════════════════

### Current Deployment
- **Platform**: Emergent Preview Environment
- **URL**: https://bee-connect-test.preview.emergentagent.com
- **Frontend Port**: 3000 (internal)
- **Backend Port**: 8001 (internal)
- **MongoDB**: localhost:27017

### Services
- Backend: Node.js Express server with Socket.io
- Frontend: React app with hot reload
- Database: MongoDB

### Supervisor Commands
```bash
sudo supervisorctl status           # Check service status
sudo supervisorctl restart backend  # Restart backend
sudo supervisorctl restart frontend # Restart frontend
```

### Log Files
```bash
tail -n 100 /var/log/supervisor/backend.*.log  # Backend logs
tail -n 100 /var/log/supervisor/frontend.*.log # Frontend logs
```

═══════════════════════════════════════════════════════════════════════════════
## QUICK START GUIDE
═══════════════════════════════════════════════════════════════════════════════

1. **Register a new account**
   - Go to /register
   - Fill in name, email, password
   - Username will be auto-generated

2. **Search for connections**
   - Go to /connections
   - Use the search bar to find users by name, username, or email
   - Click "Connect" to send a request

3. **Create a post**
   - Go to /feed
   - Write your post content
   - Optionally attach an image
   - Click "Share"

4. **Send a message**
   - Go to /chat
   - Select a connection from the sidebar
   - Type and send messages

5. **Browse jobs**
   - Go to /jobs
   - Upload your resume for AI recommendations
   - Apply to jobs

6. **Start a meeting**
   - Go to /meetings
   - Click "Start Meeting Now" for instant meeting
   - Or "Schedule for Later" to plan ahead

═══════════════════════════════════════════════════════════════════════════════
                              END OF DOCUMENTATION
═══════════════════════════════════════════════════════════════════════════════
