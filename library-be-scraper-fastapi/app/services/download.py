import os
import requests
from time import sleep
from pathlib import Path

def download_file(url, destination, MAX_RETRY_ATTEMPTS=3, RETRY_DELAY_SECONDS=5):
    retry_attempts = 0
    while retry_attempts < MAX_RETRY_ATTEMPTS:
        try:
            response = requests.get(url)
            response.raise_for_status()
            if response.status_code == 200:
                # Ensure directory structure exists before saving the file
                Path(os.path.dirname(destination)).mkdir(parents=True, exist_ok=True)
                with open(destination, 'wb') as f:
                    f.write(response.content)
                print(f"Downloaded: {destination}")
                return True  # Exit function and indicate success
            else:
                print(f"Failed to download: {url}")
                return False  # Exit function and indicate failure
        except requests.exceptions.HTTPError as e:
            print(f"HTTP error occurred: {e}")
            retry_attempts += 1
            print(f"Retry attempt {retry_attempts}/{MAX_RETRY_ATTEMPTS} in {RETRY_DELAY_SECONDS} seconds...")
            sleep(RETRY_DELAY_SECONDS)
        except requests.exceptions.RequestException as e:
            print(f"Request error occurred: {e}")
            retry_attempts += 1
            print(f"Retry attempt {retry_attempts}/{MAX_RETRY_ATTEMPTS} in {RETRY_DELAY_SECONDS} seconds...")
            sleep(RETRY_DELAY_SECONDS)
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return False
    
    print(f"Failed to download after {MAX_RETRY_ATTEMPTS} attempts: {url}")
    return False  # Exit function and indicate failure
