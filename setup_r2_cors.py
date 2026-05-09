"""
Setup CORS policy on Cloudflare R2 bucket so browsers can PUT directly via presigned URLs.
"""
import os
import boto3
from botocore.config import Config
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'backend' / '.env')

R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')
R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME')
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

s3 = boto3.client(
    's3',
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    config=Config(signature_version='s3v4', region_name='auto'),
)

cors_config = {
    'CORSRules': [
        {
            'AllowedOrigins': ['*'],
            'AllowedMethods': ['GET', 'PUT', 'POST', 'HEAD', 'DELETE'],
            'AllowedHeaders': ['*'],
            'ExposeHeaders': ['ETag', 'Content-Length', 'Content-Type'],
            'MaxAgeSeconds': 3600,
        }
    ]
}

try:
    s3.put_bucket_cors(Bucket=R2_BUCKET_NAME, CORSConfiguration=cors_config)
    print(f"[OK] CORS configured on bucket '{R2_BUCKET_NAME}'")

    # Verify
    response = s3.get_bucket_cors(Bucket=R2_BUCKET_NAME)
    print(f"[OK] CORS verified:")
    for rule in response.get('CORSRules', []):
        print(f"     Origins: {rule.get('AllowedOrigins')}")
        print(f"     Methods: {rule.get('AllowedMethods')}")
        print(f"     Headers: {rule.get('AllowedHeaders')}")
except Exception as e:
    print(f"[ERROR] CORS setup failed: {e}")
