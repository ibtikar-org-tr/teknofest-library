import os
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

## Access environment variables

# Cloudflare D1
CLOUDFLARE_ACCOUNT_ID = os.getenv('CLOUDFLARE_ACCOUNT_ID')
CLOUDFLARE_D1_DATABASE_ID = os.getenv('CLOUDFLARE_D1_DATABASE_ID')
CLOUDFLARE_API_TOKEN = os.getenv('CLOUDFLARE_API_TOKEN')

# Bucket Link
BUCKET_LINK = os.getenv('BUCKET_LINK', default="https://files.ibtikar.tr/teknofest-library")