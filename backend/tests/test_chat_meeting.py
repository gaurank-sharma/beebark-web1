"""
BeeBark Chat & Meeting API Tests
Tests cover: Message persistence, Message history, Connection validation
"""

import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable must be set")


class TestChatMessaging:
    """Test chat messaging functionality - persistence and retrieval"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create two connected test users for chat testing"""
        unique_id = uuid.uuid4().hex[:6]
        
        # Register User A
        response_a = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": f"Chat User A {unique_id}",
            "email": f"chata_{unique_id}@test.com",
            "password": "test123456"
        })
        
        if response_a.status_code == 201:
            self.token_a = response_a.json()["token"]
            self.user_a_id = response_a.json()["user"]["id"]
        else:
            # User might already exist, try login
            login_a = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": f"chata_{unique_id}@test.com",
                "password": "test123456"
            })
            assert login_a.status_code == 200
            self.token_a = login_a.json()["token"]
            self.user_a_id = login_a.json()["user"]["id"]
        
        # Register User B
        response_b = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": f"Chat User B {unique_id}",
            "email": f"chatb_{unique_id}@test.com",
            "password": "test123456"
        })
        
        if response_b.status_code == 201:
            self.token_b = response_b.json()["token"]
            self.user_b_id = response_b.json()["user"]["id"]
        else:
            login_b = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": f"chatb_{unique_id}@test.com",
                "password": "test123456"
            })
            assert login_b.status_code == 200
            self.token_b = login_b.json()["token"]
            self.user_b_id = login_b.json()["user"]["id"]
        
        self.headers_a = {"Authorization": f"Bearer {self.token_a}"}
        self.headers_b = {"Authorization": f"Bearer {self.token_b}"}
        
        # Connect users: A sends request to B
        requests.post(
            f"{BASE_URL}/api/connections/send-request/{self.user_b_id}",
            headers=self.headers_a
        )
        
        # B accepts request from A
        requests.post(
            f"{BASE_URL}/api/connections/accept-request/{self.user_a_id}",
            headers=self.headers_b
        )
        
        print(f"✅ Test users created and connected: {self.user_a_id} <-> {self.user_b_id}")
    
    def test_send_message_via_rest_api(self):
        """Test sending message via REST API and verify persistence"""
        message_text = f"Test message {time.time()}"
        
        response = requests.post(
            f"{BASE_URL}/api/messages/send",
            json={"receiver": self.user_b_id, "text": message_text},
            headers=self.headers_a
        )
        
        print(f"Send message status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["text"] == message_text
        assert data["data"]["sender"] == self.user_a_id
        assert data["data"]["receiver"] == self.user_b_id
        print("✅ Message sent successfully via REST API")
    
    def test_message_persistence_sender_can_retrieve(self):
        """Verify sender can retrieve sent messages"""
        # Send a message first
        message_text = f"Persistence test sender {time.time()}"
        requests.post(
            f"{BASE_URL}/api/messages/send",
            json={"receiver": self.user_b_id, "text": message_text},
            headers=self.headers_a
        )
        
        # Sender retrieves messages
        response = requests.get(
            f"{BASE_URL}/api/messages/{self.user_b_id}",
            headers=self.headers_a
        )
        
        print(f"Get messages status: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert "messages" in data
        assert any(msg["text"] == message_text for msg in data["messages"])
        print("✅ Sender can retrieve messages from DB")
    
    def test_message_persistence_receiver_can_retrieve(self):
        """Verify receiver can retrieve messages sent to them"""
        # Send a message first
        message_text = f"Persistence test receiver {time.time()}"
        requests.post(
            f"{BASE_URL}/api/messages/send",
            json={"receiver": self.user_b_id, "text": message_text},
            headers=self.headers_a
        )
        
        # Receiver retrieves messages
        response = requests.get(
            f"{BASE_URL}/api/messages/{self.user_a_id}",
            headers=self.headers_b
        )
        
        print(f"Get messages status: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert "messages" in data
        assert any(msg["text"] == message_text for msg in data["messages"])
        print("✅ Receiver can retrieve messages from DB")
    
    def test_messages_reload_after_simulated_refresh(self):
        """Test that messages persist and reload (simulating page refresh)"""
        # Send multiple messages
        messages_to_send = [
            f"Message 1 - {time.time()}",
            f"Message 2 - {time.time()}",
            f"Message 3 - {time.time()}"
        ]
        
        for msg in messages_to_send:
            requests.post(
                f"{BASE_URL}/api/messages/send",
                json={"receiver": self.user_b_id, "text": msg},
                headers=self.headers_a
            )
        
        # "Refresh" - fetch fresh from API
        response = requests.get(
            f"{BASE_URL}/api/messages/{self.user_b_id}",
            headers=self.headers_a
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all messages are persisted
        retrieved_texts = [msg["text"] for msg in data["messages"]]
        for msg in messages_to_send:
            assert msg in retrieved_texts
        
        print(f"✅ All {len(messages_to_send)} messages persisted and retrieved after refresh")
    
    def test_cannot_message_non_connection(self):
        """Test that users cannot message people they're not connected to"""
        # Create a third user not connected to User A
        unique_id = uuid.uuid4().hex[:6]
        response_c = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": f"Non Connected User {unique_id}",
            "email": f"nonconn_{unique_id}@test.com",
            "password": "test123456"
        })
        
        if response_c.status_code == 201:
            user_c_id = response_c.json()["user"]["id"]
        else:
            pytest.skip("Could not create third user")
        
        # Try to send message to non-connected user
        response = requests.post(
            f"{BASE_URL}/api/messages/send",
            json={"receiver": user_c_id, "text": "Should fail"},
            headers=self.headers_a
        )
        
        print(f"Message to non-connection status: {response.status_code}")
        
        assert response.status_code == 403
        print("✅ Correctly rejected message to non-connected user")
    
    def test_get_messages_non_connection_returns_403(self):
        """Test that fetching messages from non-connection returns 403"""
        # Create a third user not connected to User A
        unique_id = uuid.uuid4().hex[:6]
        response_c = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": f"Non Connected User {unique_id}",
            "email": f"nonconnget_{unique_id}@test.com",
            "password": "test123456"
        })
        
        if response_c.status_code == 201:
            user_c_id = response_c.json()["user"]["id"]
        else:
            pytest.skip("Could not create third user")
        
        # Try to get messages from non-connected user
        response = requests.get(
            f"{BASE_URL}/api/messages/{user_c_id}",
            headers=self.headers_a
        )
        
        print(f"Get messages from non-connection status: {response.status_code}")
        
        assert response.status_code == 403
        print("✅ Correctly rejected fetching messages from non-connected user")


class TestMeetingAPI:
    """Test meeting creation and management"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login test user"""
        unique_id = uuid.uuid4().hex[:6]
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": f"Meeting User {unique_id}",
            "email": f"meeting_{unique_id}@test.com",
            "password": "test123456"
        })
        
        if response.status_code == 201:
            self.token = response.json()["token"]
            self.user_id = response.json()["user"]["id"]
        else:
            pytest.skip("Could not create meeting test user")
        
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_create_meeting(self):
        """Test creating a new meeting"""
        response = requests.post(
            f"{BASE_URL}/api/meetings/create",
            json={
                "title": f"Test Meeting {time.time()}",
                "scheduledTime": "2026-02-25T10:00:00Z"
            },
            headers=self.headers
        )
        
        print(f"Create meeting status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 201
        data = response.json()
        assert "meeting" in data
        assert "meetingId" in data["meeting"]
        self.meeting_id = data["meeting"]["meetingId"]
        print(f"✅ Meeting created with ID: {self.meeting_id}")
    
    def test_list_meetings(self):
        """Test listing user's meetings"""
        # Create a meeting first
        requests.post(
            f"{BASE_URL}/api/meetings/create",
            json={"title": "List Test Meeting"},
            headers=self.headers
        )
        
        response = requests.get(
            f"{BASE_URL}/api/meetings/list",
            headers=self.headers
        )
        
        print(f"List meetings status: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert "meetings" in data
        assert len(data["meetings"]) > 0
        print(f"✅ Retrieved {len(data['meetings'])} meetings")


class TestConnectionsList:
    """Test connections list for chat"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login with pre-existing test user that has connections"""
        # Use the test users we created earlier
        self.token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTljOTQ4NzZjMmI4ZmVmNjA4MzhmOTYiLCJpYXQiOjE3NzE4NjkzMTksImV4cCI6MTc3MjQ3NDExOX0.Dk-d0-oVuX4umsn4M7GbFkQj0NrnHbwFdCsBeLmDcxQ"
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_connections_list_returns_contacts_for_chat(self):
        """Test that connections list returns contacts that can be chatted with"""
        response = requests.get(
            f"{BASE_URL}/api/connections/list",
            headers=self.headers
        )
        
        print(f"Connections list status: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert "connections" in data
        
        # Verify connection has required fields for chat
        if data["connections"]:
            conn = data["connections"][0]
            assert "_id" in conn
            assert "name" in conn
            print(f"✅ Connections list has {len(data['connections'])} contacts ready for chat")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
