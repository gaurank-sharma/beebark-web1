#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  LinkedIn-like social network with WebRTC meetings, real-time chat, profile editing, 
  stories, job matching with LLM. Current focus: Fix WebRTC multi-user meetings and 
  real-time chat message delivery & persistence.

backend:
  - task: "WebRTC Meeting Room Signaling"
    implemented: true
    working: "unknown"
    file: "/app/backend/server.js (lines 162-234)"
    stuck_count: 2
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "user"
        comment: "Users reported that joining same meeting link shows only their own video, not other participants"
      - working: "unknown"
        agent: "main"
        comment: "Implemented room-based socket architecture with proper signaling. Added meetingRooms Map to track participants, 'existing-participants' event to send current users to new joiners, 'send-signal' and 'return-signal' events for proper WebRTC offer/answer exchange."

  - task: "Chat Message Real-time Delivery"
    implemented: true
    working: "unknown"
    file: "/app/backend/server.js (lines 72-132)"
    stuck_count: 2
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "user"
        comment: "Messages not reaching other user in real-time"
      - working: "unknown"
        agent: "main"
        comment: "Enhanced socket user registration to handle reconnections, added detailed logging to track message flow, improved receiver socket ID lookup"

  - task: "Chat Message Persistence to MongoDB"
    implemented: true
    working: "unknown"
    file: "/app/backend/server.js (lines 93-100), /app/backend/routes/message.js"
    stuck_count: 2
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "user"
        comment: "Messages disappear on page refresh, not being saved to database"
      - working: "unknown"
        agent: "main"
        comment: "Message save logic exists at line 93-100 in server.js. Messages are saved to DB before being sent. API endpoint /api/messages/:connectionId fetches message history."

frontend:
  - task: "WebRTC Meeting Room Multi-user Connection"
    implemented: true
    working: "unknown"
    file: "/app/frontend/src/pages/MeetingRoom.js"
    stuck_count: 2
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "user"
        comment: "Two users can't see each other in the same meeting, only see themselves"
      - working: "unknown"
        agent: "main"
        comment: "Completely rewrote peer connection logic. Now properly handles 'existing-participants' event, creates peer with correct initiator flag (true for existing users, false for new joiners), implements proper signal exchange with 'send-signal' and 'return-signal' events"

  - task: "Chat Real-time Message UI Updates"
    implemented: true
    working: "unknown"
    file: "/app/frontend/src/pages/Chat.js"
    stuck_count: 2
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "user"
        comment: "Messages not showing up for receiver in real-time"
      - working: "unknown"
        agent: "main"
        comment: "Enhanced socket connection handling to re-register on reconnection, improved message deduplication, better optimistic UI updates, added comprehensive logging"

  - task: "Chat Message History Loading"
    implemented: true
    working: "unknown"
    file: "/app/frontend/src/pages/Chat.js (fetchMessages function)"
    stuck_count: 2
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "user"
        comment: "Chat history disappears on page refresh"
      - working: "unknown"
        agent: "main"
        comment: "fetchMessages function exists and is called when selecting a connection. It calls GET /api/messages/:connectionId to load history from MongoDB"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: true

test_plan:
  current_focus:
    - "WebRTC Meeting Room Signaling"
    - "WebRTC Meeting Room Multi-user Connection"
    - "Chat Message Real-time Delivery"
    - "Chat Message Persistence to MongoDB"
    - "Chat Real-time Message UI Updates"
    - "Chat Message History Loading"
  stuck_tasks:
    - "WebRTC Meeting Room - All components (recurring issue)"
    - "Chat functionality - All components (recurring issue)"
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      CRITICAL FIXES COMPLETED - NEEDS COMPREHENSIVE TESTING
      
      Fixed 3 major issues:
      
      1. WEBRTC MEETING (P0):
         - Root cause: Socket signaling didn't use room-based architecture
         - Fixed: Implemented meetingRooms Map, proper join/leave events
         - Fixed: Added 'existing-participants' event to inform new joiners
         - Fixed: Rewrote client peer connection logic with correct initiator flags
         - Fixed: Proper signal exchange with 'send-signal'/'return-signal' events
         
      2. CHAT REAL-TIME DELIVERY (P1):
         - Enhanced user registration to handle reconnections
         - Added comprehensive logging to trace message flow
         - Improved socket connection handling on client
         
      3. CHAT PERSISTENCE (P1):
         - Message save logic already exists
         - Verified API endpoint /api/messages/:connectionId exists
         - fetchMessages function called when selecting connection
      
      TESTING REQUIREMENTS:
      - Need to test with 2 separate browser sessions/incognito windows
      - Test users available: sharmagaurank63@gmail.com & sharmagaurank64@gmail.com (already connected)
      - Alternative: usera@test.com & userb@test.com (password: test123456)
      
      TEST SCENARIOS:
      1. Meeting: User A creates meeting, User B joins same link, verify both can see/hear each other
      2. Chat: User A sends message to User B, verify B receives in real-time
      3. Chat: Send messages, refresh page, verify history loads from DB
      
      IMPORTANT: These are recurring issues (stuck_count: 2), user is frustrated. 
      Need thorough testing to ensure fixes work completely.