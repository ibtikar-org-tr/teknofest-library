from difflib import get_close_matches
import unicodedata
from app.services.unify.lists import full_groups

# Function to remove accents and normalize non-Latin characters
def normalize_text(text):
    try:
        text = text.lower()
        text = unicodedata.normalize("NFKD", text)  # Normalize accented characters
        return "".join(c for c in text if not unicodedata.combining(c))  # Remove diacritics
    except:
        return None

def find_original_sentence(sentence, groups=full_groups, threshold=None):
    lookup = {}
    all_phrases = []
    try_any_threshold = False
    if threshold is None:
        threshold = 0.5
        try_any_threshold = True

    
    for group in groups:
        original = group[0]  # First element is the original
        for phrase in group:
            normalized = normalize_text(phrase)
            lookup[normalized] = original
            all_phrases.append(normalized)

    normalized_input = normalize_text(sentence)
    
    if normalized_input is None:
        return None
    
    # Try exact match first
    if normalized_input in lookup:
        return lookup[normalized_input]
    
    # Try fuzzy matching
    close_matches = get_close_matches(normalized_input, all_phrases, n=1, cutoff=threshold)
    
    if close_matches:
        return lookup[close_matches[0]]  # Return original key
    elif try_any_threshold:
        # Try with lower thresholds if no match found
        for t in [0.4, 0.3, 0.2, 0.1]:
            close_matches = get_close_matches(normalized_input, all_phrases, n=1, cutoff=t)
            if close_matches:
                return lookup[close_matches[0]]
    
    return None  # No match found

if __name__ == "__main__":
    test_sentences = [
        "chip-design-competition",
        "chip-design",
        "5g",
        "biotek"
    ]
    
    for sentence in test_sentences:
        result = find_original_sentence(sentence)
        print(f"Input: {sentence} => Matched: {result}")