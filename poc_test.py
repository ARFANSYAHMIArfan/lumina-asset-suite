"""
Lumina Asset Suite - POC Test Script
=====================================

Tests core integrations:
1. Supabase Auth (signup + login)
2. Supabase DB (insert, query, delete asset)
3. Cloudflare R2 (presigned URL upload + public access verification)
4. End-to-end flow (auth -> upload -> store metadata -> query)

Usage:
    python poc_test.py
"""

import os
import sys
import uuid
import time
import requests
import boto3
from botocore.config import Config
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env from backend
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'backend' / '.env')

# ============================================================
# Configuration
# ============================================================
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')
R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME')
R2_PUBLIC_URL = os.environ.get('R2_PUBLIC_URL')
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

# Test credentials - use real-looking domain to pass Supabase email validation
TEST_EMAIL = f"poctest+{int(time.time())}@gmail.com"
TEST_PASSWORD = "LuminaTest123!"


def print_header(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_success(msg):
    print(f"  [PASS] {msg}")


def print_error(msg):
    print(f"  [FAIL] {msg}")


def print_info(msg):
    print(f"  [INFO] {msg}")


# ============================================================
# TEST 1: Supabase Auth
# ============================================================
def test_supabase_auth():
    print_header("TEST 1: Supabase Auth (Signup + Login)")

    try:
        # Use admin client (service role) to create + auto-confirm user (no email verification needed)
        admin_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        # Anon client to test login flow (as a real user would)
        anon_client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        print_info(f"Supabase URL: {SUPABASE_URL}")
        print_info(f"Test email: {TEST_EMAIL}")

        # Create user with email_confirm=True (admin API bypasses email verification)
        create_response = admin_client.auth.admin.create_user({
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "email_confirm": True,
        })
        if create_response.user is None:
            print_error("Admin create_user returned no user")
            return None
        user_id = create_response.user.id
        print_success(f"User created (email auto-confirmed). User ID: {user_id}")

        # Now test login flow as a real user would
        login_response = anon_client.auth.sign_in_with_password({
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        })
        if login_response.session is None:
            print_error("Login did not return session")
            return None
        access_token = login_response.session.access_token
        print_success(f"Login successful (token: {access_token[:20]}...)")

        return {"user_id": user_id, "access_token": access_token, "email": TEST_EMAIL}

    except Exception as e:
        print_error(f"Supabase auth failed: {e}")
        return None


# ============================================================
# TEST 2: Supabase DB (using service role)
# ============================================================
def test_supabase_db(user_info):
    print_header("TEST 2: Supabase DB (Insert + Query Assets)")

    try:
        # Use service role key to bypass RLS for backend operations
        admin_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        user_id = user_info["user_id"]

        # Insert a test asset
        test_asset = {
            "user_id": user_id,
            "title": "POC Test Asset",
            "type": "video",
            "r2_key": f"test/{uuid.uuid4()}.mp4",
            "public_url": f"{R2_PUBLIC_URL}/test/sample.mp4",
            "duration": 120.5,
            "file_size": 1024000,
            "mime_type": "video/mp4",
            "tags": ["test", "poc"],
        }
        result = admin_client.table("assets").insert(test_asset).execute()
        if not result.data:
            print_error("Insert returned no data")
            return False
        asset_id = result.data[0]["id"]
        print_success(f"Inserted asset: {asset_id}")

        # Query assets
        query_result = admin_client.table("assets").select("*").eq("user_id", user_id).execute()
        if not query_result.data:
            print_error("Query returned no data")
            return False
        print_success(f"Query returned {len(query_result.data)} asset(s)")

        # Delete the test asset
        del_result = admin_client.table("assets").delete().eq("id", asset_id).execute()
        print_success("Deleted test asset")

        return True

    except Exception as e:
        print_error(f"Supabase DB failed: {e}")
        return False


# ============================================================
# TEST 3: Cloudflare R2 (presigned URL + upload + public access)
# ============================================================
def test_r2_upload():
    print_header("TEST 3: Cloudflare R2 (Presigned URL + Upload + Public Access)")

    try:
        # Create boto3 S3 client for R2
        s3 = boto3.client(
            's3',
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            config=Config(signature_version='s3v4', region_name='auto'),
        )
        print_info(f"R2 endpoint: {R2_ENDPOINT}")
        print_info(f"R2 bucket: {R2_BUCKET_NAME}")

        # List buckets to verify connection
        try:
            buckets = s3.list_buckets()
            bucket_names = [b['Name'] for b in buckets.get('Buckets', [])]
            print_success(f"Connected. Buckets: {bucket_names}")
            if R2_BUCKET_NAME not in bucket_names:
                print_error(f"Bucket '{R2_BUCKET_NAME}' not found!")
                return False
        except Exception as e:
            print_error(f"Could not list buckets: {e}")
            return False

        # Generate presigned PUT URL
        test_key = f"poc-test/{uuid.uuid4()}.txt"
        content_type = "text/plain"
        presigned_url = s3.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': R2_BUCKET_NAME,
                'Key': test_key,
                'ContentType': content_type,
            },
            ExpiresIn=3600,
        )
        print_success(f"Generated presigned URL")
        print_info(f"  Key: {test_key}")

        # Upload via presigned URL (simulates frontend upload)
        test_content = b"Lumina POC Test File - " + str(uuid.uuid4()).encode()
        upload_response = requests.put(
            presigned_url,
            data=test_content,
            headers={'Content-Type': content_type},
            timeout=30,
        )
        if upload_response.status_code not in (200, 204):
            print_error(f"Upload failed: {upload_response.status_code} - {upload_response.text}")
            return False
        print_success(f"Upload successful (HTTP {upload_response.status_code})")

        # Verify public access
        public_url = f"{R2_PUBLIC_URL}/{test_key}"
        print_info(f"Public URL: {public_url}")
        time.sleep(1)  # Brief delay for propagation
        get_response = requests.get(public_url, timeout=10)
        if get_response.status_code == 200 and get_response.content == test_content:
            print_success(f"Public access verified ({len(get_response.content)} bytes)")
        else:
            print_error(f"Public access failed: {get_response.status_code}")
            print_error(f"  Response: {get_response.text[:200]}")
            print_info("  TIP: Ensure 'Public Access' is enabled on the R2 bucket OR")
            print_info("       custom domain is configured. Public URL must be set up in R2 dashboard.")
            return False

        # Cleanup
        s3.delete_object(Bucket=R2_BUCKET_NAME, Key=test_key)
        print_success("Cleanup complete")

        return True

    except Exception as e:
        import traceback
        print_error(f"R2 test failed: {e}")
        traceback.print_exc()
        return False


# ============================================================
# TEST 4: End-to-End Flow
# ============================================================
def test_end_to_end(user_info):
    print_header("TEST 4: End-to-End (R2 Upload + Supabase Asset Record)")

    if not user_info:
        print_error("Skipped (no user)")
        return False

    try:
        admin_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        s3 = boto3.client(
            's3',
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            config=Config(signature_version='s3v4', region_name='auto'),
        )

        # Step 1: Get presigned URL
        user_id = user_info["user_id"]
        test_key = f"users/{user_id}/{uuid.uuid4()}.mp4"
        content_type = "video/mp4"
        presigned_url = s3.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': R2_BUCKET_NAME,
                'Key': test_key,
                'ContentType': content_type,
            },
            ExpiresIn=3600,
        )

        # Step 2: Upload (simulated mp4 with magic bytes)
        fake_mp4 = b'\x00\x00\x00\x20ftypmp42' + b'\x00' * 1024
        upload_response = requests.put(
            presigned_url,
            data=fake_mp4,
            headers={'Content-Type': content_type},
            timeout=30,
        )
        if upload_response.status_code not in (200, 204):
            print_error(f"Upload failed: {upload_response.status_code}")
            return False
        print_success("Upload to R2 complete")

        # Step 3: Insert metadata in Supabase
        public_url = f"{R2_PUBLIC_URL}/{test_key}"
        asset_record = {
            "user_id": user_id,
            "title": "End-to-End Test Video",
            "type": "video",
            "r2_key": test_key,
            "public_url": public_url,
            "file_size": len(fake_mp4),
            "mime_type": content_type,
        }
        insert_result = admin_client.table("assets").insert(asset_record).execute()
        if not insert_result.data:
            print_error("Failed to insert asset metadata")
            return False
        asset_id = insert_result.data[0]["id"]
        print_success(f"Asset metadata stored in Supabase: {asset_id}")

        # Step 4: Query and verify
        query_result = admin_client.table("assets").select("*").eq("id", asset_id).single().execute()
        if query_result.data and query_result.data["public_url"] == public_url:
            print_success("End-to-end flow verified!")
        else:
            print_error("Query mismatch")
            return False

        # Cleanup
        admin_client.table("assets").delete().eq("id", asset_id).execute()
        s3.delete_object(Bucket=R2_BUCKET_NAME, Key=test_key)
        print_success("Cleanup complete")

        return True

    except Exception as e:
        import traceback
        print_error(f"End-to-end test failed: {e}")
        traceback.print_exc()
        return False


# ============================================================
# CLEANUP: Remove test user
# ============================================================
def cleanup_test_user(user_info):
    if not user_info or not user_info.get("user_id"):
        return
    try:
        admin_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        admin_client.auth.admin.delete_user(user_info["user_id"])
        print_info(f"Test user deleted: {user_info['email']}")
    except Exception as e:
        print_info(f"Could not delete test user (manual cleanup may be needed): {e}")


# ============================================================
# MAIN
# ============================================================
def main():
    print("\n" + "=" * 60)
    print("  LUMINA ASSET SUITE - POC TEST")
    print("=" * 60)

    results = {}

    # Test 1: Auth
    user_info = test_supabase_auth()
    results["auth"] = bool(user_info and user_info.get("access_token"))

    # Test 2: DB (depends on auth)
    if user_info:
        results["db"] = test_supabase_db(user_info)
    else:
        results["db"] = False
        print_info("Skipping DB test (no user)")

    # Test 3: R2
    results["r2"] = test_r2_upload()

    # Test 4: End-to-end
    if user_info and results["r2"]:
        results["e2e"] = test_end_to_end(user_info)
    else:
        results["e2e"] = False
        print_info("Skipping E2E test (prerequisites failed)")

    # Cleanup
    cleanup_test_user(user_info)

    # Summary
    print_header("RESULTS SUMMARY")
    for test, passed in results.items():
        status = "PASS" if passed else "FAIL"
        print(f"  [{status}] {test.upper()}")

    all_passed = all(results.values())
    print()
    if all_passed:
        print("  ALL TESTS PASSED - READY FOR APP DEVELOPMENT")
    else:
        print("  SOME TESTS FAILED - FIX BEFORE PROCEEDING")
    print("=" * 60 + "\n")

    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
