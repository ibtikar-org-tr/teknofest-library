import os

def set_working_directory():
    local_downloads_path = os.path.join(os.getcwd(), 'downloads')
    if not os.path.exists(local_downloads_path):
        os.makedirs(local_downloads_path)
    os.chdir(local_downloads_path)