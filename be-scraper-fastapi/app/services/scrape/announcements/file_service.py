import os
import requests # type: ignore
import urllib.parse
from PyPDF2 import PdfReader # type: ignore
import re

FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.zip', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.ppt', '.pptx']

def sanitize_filename(filename):
    return re.sub(r'[<>:"/\\|?*]', '', filename)

def download_file(url, DOWNLOAD_FOLDER):
    if any(url.endswith(ext) for ext in FILE_EXTENSIONS):
        return download_to_folder(url, DOWNLOAD_FOLDER)
    
    try:
        response = requests.head(url, allow_redirects=True)
        content_type = response.headers.get('Content-Type', '')
        if 'application' in content_type or 'image' in content_type:
            return download_to_folder(url, DOWNLOAD_FOLDER)
        else:
            print(f"Not a file: {url}")
    except requests.RequestException as e:
        print(f"Error checking URL: {e}")

def download_to_folder(url, DOWNLOAD_FOLDER):
    try:
        file_name = url.split('/')[-1]
        decoded_file_name = urllib.parse.unquote(file_name)

        # Re-decode (e.g., from Latin-1 to UTF-8) if needed
        decoded_file_name = decoded_file_name.encode("latin-1", errors="replace").decode("utf-8", errors="replace")

        sanitized_file_name = sanitize_filename(decoded_file_name)

        file_path = os.path.join(DOWNLOAD_FOLDER, sanitized_file_name)
        
        os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)
        
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        with open(file_path, 'wb') as file:
            for chunk in response.iter_content(chunk_size=8192):
                file.write(chunk)
        
        print(f"Downloaded: {sanitized_file_name} to {DOWNLOAD_FOLDER}")
        return file_path
    except requests.RequestException as e:
        print(f"Error downloading file: {e}")

def extract_pdf_title(file_path):
    try:
        with open(file_path, 'rb') as pdf_file:
            pdf_reader = PdfReader(pdf_file)
            metadata = pdf_reader.metadata
            title = metadata.get("/Title", None)
            return title if title else "Untitled"
    except Exception as e:
        print(f"Error extracting PDF title: {e}")
        return None

def rename_file_with_title(file_path, title):
    try:
        directory, original_file_name = os.path.split(file_path)
        file_name, file_extension = os.path.splitext(original_file_name)
        
        sanitized_title = sanitize_filename(title)

        new_file_name = f"{sanitized_title}_{file_name}{file_extension}"
        new_file_path = os.path.join(directory, new_file_name)
        
        os.rename(file_path, new_file_path)
        print(f"File renamed to: {new_file_name}")
        return new_file_path
    except Exception as e:
        print(f"Error renaming file: {e}")
        return None

def download_the_files(file_urls, DOWNLOAD_FOLDER):
    for url in file_urls:
        downloaded_file_path = download_file(url, DOWNLOAD_FOLDER)
        print("file downloaded")

        if downloaded_file_path:
            pdf_title = extract_pdf_title(downloaded_file_path)
            
            if pdf_title:
                rename_file_with_title(downloaded_file_path, pdf_title)
                print("file renamed")


if __name__ == "__main__":
    url_list = [
    "https://cdn.t3kys.com/media/uploads/2023/09/28/Giri%C5%9Fim_Yar%C4%B1%C5%9Fmas%C4%B1_-_Sa%C4%9Fl%C4%B1k-%C3%B6n_kulu%C3%A7ka.pdf"]
    DOWNLOAD_FOLDER = "."
    download_the_files(url_list)