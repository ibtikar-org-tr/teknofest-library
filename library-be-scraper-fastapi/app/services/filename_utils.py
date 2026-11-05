"""Filename sanitization utility for file system operations."""


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename by replacing Turkish characters with English equivalents
    and replacing spaces with underscores.
    
    Args:
        filename: The original filename to sanitize
        
    Returns:
        Sanitized filename safe for file systems
    """
    # Turkish to English character mapping (keeping case)
    turkish_map = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U',
    }
    
    # Replace Turkish characters
    for turkish, english in turkish_map.items():
        filename = filename.replace(turkish, english)
    
    # Replace spaces with underscores
    filename = filename.replace(' ', '_')
    
    # Remove any remaining problematic characters
    filename = filename.replace('<', '').replace('>', '').replace(':', '')
    filename = filename.replace('"', '').replace('/', '').replace('\\', '')
    filename = filename.replace('|', '').replace('?', '').replace('*', '')
    
    return filename
