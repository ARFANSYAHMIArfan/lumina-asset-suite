"""
Lumina Asset Suite - Backend API Tests
Tests all backend endpoints for auth, assets, queue, and history.
"""
import requests
import sys
import time
from datetime import datetime

class LuminaAPITester:
    def __init__(self, base_url="https://media-control-hub-3.preview.emergentagent.com"):
        self.base_url = base_url.rstrip('/')
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
    def log_result(self, test_name, passed, message="", status_code=None):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ PASS: {test_name}")
            if message:
                print(f"   {message}")
        else:
            print(f"❌ FAIL: {test_name}")
            print(f"   {message}")
            if status_code:
                print(f"   Status Code: {status_code}")
        
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "message": message,
            "status_code": status_code
        })
        
    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        req_headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            req_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            req_headers.update(headers)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=req_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=req_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=req_headers, timeout=10)
            else:
                self.log_result(name, False, f"Unsupported method: {method}")
                return False, {}
            
            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {}
            
            if success:
                self.log_result(name, True, f"Status: {response.status_code}", response.status_code)
            else:
                error_msg = response_data.get('detail', response.text[:200])
                self.log_result(name, False, f"Expected {expected_status}, got {response.status_code}. Error: {error_msg}", response.status_code)
            
            return success, response_data
            
        except requests.exceptions.Timeout:
            self.log_result(name, False, "Request timeout after 10 seconds")
            return False, {}
        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {}
    
    # ==================== AUTH TESTS ====================
    
    def test_signup_new_user(self):
        """Test signup with new email"""
        timestamp = int(time.time())
        email = f"luminatest+{timestamp}@gmail.com"
        password = "TestPass123!"
        
        success, response = self.run_test(
            "POST /api/auth/signup (new user)",
            "POST",
            "/api/auth/signup",
            200,
            data={"email": email, "password": password},
            auth_required=False
        )
        
        if success and 'access_token' in response and 'refresh_token' in response:
            print(f"   Created user: {email}")
            return True, email, password
        return False, None, None
    
    def test_login_valid_credentials(self, email, password):
        """Test login with valid credentials"""
        success, response = self.run_test(
            "POST /api/auth/login (valid credentials)",
            "POST",
            "/api/auth/login",
            200,
            data={"email": email, "password": password},
            auth_required=False
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False
    
    def test_login_wrong_password(self, email):
        """Test login with wrong password"""
        success, response = self.run_test(
            "POST /api/auth/login (wrong password)",
            "POST",
            "/api/auth/login",
            401,
            data={"email": email, "password": "WrongPassword123!"},
            auth_required=False
        )
        return success
    
    def test_get_me_with_token(self):
        """Test GET /api/auth/me with valid token"""
        success, response = self.run_test(
            "GET /api/auth/me (with token)",
            "GET",
            "/api/auth/me",
            200,
            auth_required=True
        )
        
        if success and 'user_id' in response and 'email' in response:
            print(f"   User: {response.get('email')}")
            return True
        return False
    
    def test_get_me_without_token(self):
        """Test GET /api/auth/me without token"""
        saved_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "GET /api/auth/me (without token)",
            "GET",
            "/api/auth/me",
            401,
            auth_required=False
        )
        
        self.token = saved_token
        return success
    
    # ==================== ASSETS TESTS ====================
    
    def test_upload_url_video(self):
        """Test POST /api/assets/upload-url for video"""
        success, response = self.run_test(
            "POST /api/assets/upload-url (video)",
            "POST",
            "/api/assets/upload-url",
            200,
            data={
                "filename": "test_video.mp4",
                "content_type": "video/mp4",
                "asset_type": "video"
            }
        )
        
        if success and 'upload_url' in response and 'r2_key' in response and 'public_url' in response:
            print(f"   R2 Key: {response['r2_key']}")
            return True, response
        return False, {}
    
    def test_create_asset(self, r2_key, public_url):
        """Test POST /api/assets to create asset metadata"""
        success, response = self.run_test(
            "POST /api/assets (create asset)",
            "POST",
            "/api/assets",
            200,
            data={
                "title": "Test Video Asset",
                "type": "video",
                "r2_key": r2_key,
                "public_url": public_url,
                "duration": 120.5,
                "file_size": 1024000,
                "mime_type": "video/mp4",
                "tags": ["test", "video"]
            }
        )
        
        if success and 'id' in response:
            print(f"   Asset ID: {response['id']}")
            return True, response['id']
        return False, None
    
    def test_list_assets(self):
        """Test GET /api/assets"""
        success, response = self.run_test(
            "GET /api/assets (list user assets)",
            "GET",
            "/api/assets",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} assets")
            return True, response
        return False, []
    
    def test_get_asset(self, asset_id):
        """Test GET /api/assets/{id}"""
        success, response = self.run_test(
            f"GET /api/assets/{asset_id}",
            "GET",
            f"/api/assets/{asset_id}",
            200
        )
        
        if success and response.get('id') == asset_id:
            return True
        return False
    
    def test_update_asset(self, asset_id):
        """Test PATCH /api/assets/{id}"""
        success, response = self.run_test(
            f"PATCH /api/assets/{asset_id}",
            "PATCH",
            f"/api/assets/{asset_id}",
            200,
            data={
                "title": "Updated Test Video",
                "tags": ["updated", "test"]
            }
        )
        
        if success and response.get('title') == "Updated Test Video":
            return True
        return False
    
    def test_delete_asset(self, asset_id):
        """Test DELETE /api/assets/{id}"""
        success, response = self.run_test(
            f"DELETE /api/assets/{asset_id}",
            "DELETE",
            f"/api/assets/{asset_id}",
            200
        )
        return success
    
    # ==================== QUEUE TESTS ====================
    
    def test_add_to_queue(self, asset_id):
        """Test POST /api/queue"""
        success, response = self.run_test(
            "POST /api/queue (add item)",
            "POST",
            "/api/queue",
            200,
            data={"asset_id": asset_id}
        )
        
        if success and 'id' in response:
            print(f"   Queue Item ID: {response['id']}")
            return True, response['id']
        return False, None
    
    def test_list_queue(self):
        """Test GET /api/queue"""
        success, response = self.run_test(
            "GET /api/queue (list items)",
            "GET",
            "/api/queue",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} queue items")
            return True, response
        return False, []
    
    def test_reorder_queue(self, item_ids):
        """Test POST /api/queue/reorder"""
        if not item_ids:
            self.log_result("POST /api/queue/reorder", False, "No items to reorder")
            return False
        
        # Reverse the order
        reversed_ids = list(reversed(item_ids))
        success, response = self.run_test(
            "POST /api/queue/reorder",
            "POST",
            "/api/queue/reorder",
            200,
            data={"item_ids": reversed_ids}
        )
        return success
    
    def test_remove_queue_item(self, item_id):
        """Test DELETE /api/queue/{id}"""
        success, response = self.run_test(
            f"DELETE /api/queue/{item_id}",
            "DELETE",
            f"/api/queue/{item_id}",
            200
        )
        return success
    
    def test_clear_queue(self):
        """Test DELETE /api/queue"""
        success, response = self.run_test(
            "DELETE /api/queue (clear all)",
            "DELETE",
            "/api/queue",
            200
        )
        return success
    
    # ==================== HISTORY TESTS ====================
    
    def test_add_history(self, asset_id, asset_title):
        """Test POST /api/history"""
        success, response = self.run_test(
            "POST /api/history (record playback)",
            "POST",
            "/api/history",
            200,
            data={
                "asset_id": asset_id,
                "asset_title": asset_title,
                "asset_type": "video",
                "duration_played": 60.0,
                "source": "manual"
            }
        )
        
        if success and 'id' in response:
            print(f"   History ID: {response['id']}")
            return True
        return False
    
    def test_list_history(self):
        """Test GET /api/history"""
        success, response = self.run_test(
            "GET /api/history (list entries)",
            "GET",
            "/api/history",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} history entries")
            return True
        return False
    
    def test_clear_history(self):
        """Test DELETE /api/history"""
        success, response = self.run_test(
            "DELETE /api/history (clear all)",
            "DELETE",
            "/api/history",
            200
        )
        return success
    
    # ==================== MAIN TEST FLOW ====================
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print("\n" + "="*60)
        print("LUMINA ASSET SUITE - BACKEND API TESTS")
        print("="*60 + "\n")
        
        print("🔐 AUTH TESTS")
        print("-" * 60)
        
        # Test signup
        signup_success, new_email, new_password = self.test_signup_new_user()
        
        # Test login with existing credentials
        print("\n📝 Testing with existing test account...")
        test_email = "luminaop+1778294201@gmail.com"
        test_password = "TestPass123!"
        login_success = self.test_login_valid_credentials(test_email, test_password)
        
        if not login_success:
            print("\n❌ CRITICAL: Cannot login with test credentials. Stopping tests.")
            return False
        
        # Test wrong password
        self.test_login_wrong_password(test_email)
        
        # Test /me endpoint
        self.test_get_me_with_token()
        self.test_get_me_without_token()
        
        print("\n\n📦 ASSETS TESTS")
        print("-" * 60)
        
        # Test upload URL generation
        upload_success, upload_data = self.test_upload_url_video()
        
        asset_id = None
        if upload_success:
            # Create asset
            create_success, asset_id = self.test_create_asset(
                upload_data['r2_key'],
                upload_data['public_url']
            )
            
            if create_success:
                # List assets
                list_success, assets = self.test_list_assets()
                
                # Get specific asset
                self.test_get_asset(asset_id)
                
                # Update asset
                self.test_update_asset(asset_id)
        
        print("\n\n📋 QUEUE TESTS")
        print("-" * 60)
        
        queue_item_id = None
        if asset_id:
            # Add to queue
            add_success, queue_item_id = self.test_add_to_queue(asset_id)
            
            # List queue
            list_success, queue_items = self.test_list_queue()
            
            # Reorder queue (if we have items)
            if queue_items:
                item_ids = [item['id'] for item in queue_items]
                self.test_reorder_queue(item_ids)
            
            # Remove single item
            if queue_item_id:
                self.test_remove_queue_item(queue_item_id)
            
            # Add again for clear test
            add_success, queue_item_id = self.test_add_to_queue(asset_id)
            
            # Clear queue
            self.test_clear_queue()
        
        print("\n\n📜 HISTORY TESTS")
        print("-" * 60)
        
        if asset_id:
            # Add history
            self.test_add_history(asset_id, "Test Video Asset")
            
            # List history
            self.test_list_history()
            
            # Clear history
            self.test_clear_history()
        
        print("\n\n🧹 CLEANUP")
        print("-" * 60)
        
        # Delete the test asset
        if asset_id:
            self.test_delete_asset(asset_id)
        
        # Print summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        print("="*60 + "\n")
        
        return self.tests_passed == self.tests_run


def main():
    tester = LuminaAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
