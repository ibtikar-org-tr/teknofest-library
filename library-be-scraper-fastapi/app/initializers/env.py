import os
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

## Access environment variables

# Cloudflare D1 — set CLOUDFLARE_D1_MODE=local to seed/query wrangler offline sqlite,
# or remote (default) to use the Cloudflare HTTP API with the credentials below.
CLOUDFLARE_D1_MODE = os.getenv('CLOUDFLARE_D1_MODE', 'remote')
CLOUDFLARE_D1_SQLITE_PATH = os.getenv('CLOUDFLARE_D1_SQLITE_PATH')  # optional explicit local path
CLOUDFLARE_ACCOUNT_ID = os.getenv('CLOUDFLARE_ACCOUNT_ID')
CLOUDFLARE_D1_DATABASE_ID = os.getenv('CLOUDFLARE_D1_DATABASE_ID')
CLOUDFLARE_API_TOKEN = os.getenv('CLOUDFLARE_API_TOKEN')

# Bucket Link
BUCKET_LINK = os.getenv('BUCKET_LINK', default="https://files.ibtikar.tr/teknofest-library")