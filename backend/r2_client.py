"""
Lumina Asset Suite - Cloudflare R2 client setup
"""
import os
import boto3
from botocore.config import Config
from functools import lru_cache

R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')
R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME')
R2_PUBLIC_URL = os.environ.get('R2_PUBLIC_URL')

if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL]):
    raise RuntimeError("Missing R2 environment variables")

R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"


@lru_cache(maxsize=1)
def get_r2_client():
    """Returns boto3 S3 client configured for Cloudflare R2."""
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4', region_name='auto'),
    )


def public_url_for(key: str) -> str:
    return f"{R2_PUBLIC_URL.rstrip('/')}/{key.lstrip('/')}"


def generate_presigned_put(key: str, content_type: str, expires_in: int = 3600) -> str:
    """Generates a presigned PUT URL for direct browser upload."""
    s3 = get_r2_client()
    return s3.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': R2_BUCKET_NAME,
            'Key': key,
            'ContentType': content_type,
        },
        ExpiresIn=expires_in,
    )


def delete_object(key: str) -> None:
    """Deletes an object from R2."""
    s3 = get_r2_client()
    s3.delete_object(Bucket=R2_BUCKET_NAME, Key=key)
