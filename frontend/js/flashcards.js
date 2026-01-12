// Flashcards State
let flashcards = [];
let currentCardIndex = 0;
let isFlipped = false;

// Load flashcards from localStorage
function loadFlashcards() {
    const savedData = localStorage.getItem('lectureData');
    if (!savedData) {
        // No data available - show empty state
        document.getElementById('noDataState').classList.remove('hidden');
        document.getElementById('flashcardsContainer').classList.add('hidden');
        return;
    }
    
    const data = JSON.parse(savedData);
    
    // Check if data is old
    if (!data.isFresh) {
        showOldDataWarning();
    }
    
    if (data.definitions) {
        flashcards = parseDefinitions(data.definitions);
        if (flashcards.length > 0) {
            document.getElementById('noDataState').classList.add('hidden');
            document.getElementById('flashcardsContainer').classList.remove('hidden');
            displayCard();
            updateProgress();
        } else {
            // No valid flashcards parsed
            showNoDataState();
        }
    } else {
        // No definitions in localStorage
        showNoDataState();
    }
}

function showOldDataWarning() {
    const warning = document.createElement('div');
    warning.className = 'old-data-warning';
    warning.innerHTML = `
        <i class="fa-solid fa-info-circle"></i>
        <span>Viewing flashcards from a previous upload.</span>
        <button onclick="window.location.href='index.html'" class="btn btn-secondary" style="padding: 0.5rem 1rem;">
            <i class="fa-solid fa-upload"></i> Upload New
        </button>
    `;
    document.querySelector('.page-header').insertAdjacentElement('afterend', warning);
}

function showNoDataState() {
    document.getElementById('noDataState').classList.remove('hidden');
    document.getElementById('flashcardsContainer').classList.add('hidden');
}

// Parse definitions HTML to extract term-definition pairs
function parseDefinitions(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const cards = [];
    
    // Get full text content
    let fullText = doc.body.innerHTML;
    
    // Split by <br> tags to get individual definitions
    const entries = fullText.split(/<br\s*\/?>/gi);
    
    entries.forEach(entry => {
        // Remove HTML tags and get clean text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = entry;
        const text = tempDiv.textContent.trim();
        
        if (!text || text.length < 10) return;
        
        // Look for patterns: "**Term:**" or "<strong>Term:</strong>" or "Term:"
        const match = text.match(/^(?:\*\*|<strong>)?(.+?)(?:\*\*|<\/strong>)?\s*[:–-]\s*(.+)$/s);
        if (match && match[1] && match[2]) {
            const term = match[1].trim().replace(/^\*\*|\*\*$/g, '').replace(/<\/?strong>/gi, '');
            const definition = match[2].trim();
            
            if (term.length > 0 && definition.length > 10) {
                cards.push({
                    term: term,
                    definition: definition,
                    mastery: 'unreviewed'
                });
            }
        }
    });
    
    // Fallback: Try paragraph-based parsing
    if (cards.length === 0) {
        const items = doc.querySelectorAll('p, li, div');
        items.forEach(item => {
            const text = item.textContent.trim();
            const match = text.match(/^(.+?)[:–-]\s*(.+)$/s);
            if (match && match[1] && match[2] && match[2].length > 10) {
                cards.push({
                    term: match[1].trim().replace(/^\*\*|\*\*$/g, ''),
                    definition: match[2].trim(),
                    mastery: 'unreviewed'
                });
            }
        });
    }
    
    console.log(`Parsed ${cards.length} flashcards from definitions`);
    return cards;
}

// Display current card
function displayCard() {
    if (flashcards.length === 0) return;
    
    const card = flashcards[currentCardIndex];
    document.getElementById('cardFront').textContent = card.term;
    document.getElementById('cardBack').textContent = card.definition;
    document.getElementById('currentCard').textContent = currentCardIndex + 1;
    document.getElementById('totalCards').textContent = flashcards.length;
    
    // Reset flip state
    document.getElementById('flashcard').classList.remove('flipped');
    isFlipped = false;
    
    // Update button states
    document.getElementById('prevBtn').disabled = currentCardIndex === 0;
    document.getElementById('nextBtn').disabled = currentCardIndex === flashcards.length - 1;
}

// Flip card
function flipCard() {
    const card = document.getElementById('flashcard');
    card.classList.toggle('flipped');
    isFlipped = !isFlipped;
}

// Navigation
function nextCard() {
    if (currentCardIndex < flashcards.length - 1) {
        currentCardIndex++;
        displayCard();
        updateProgress();
    }
}

function previousCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        displayCard();
        updateProgress();
    }
}

// Mark card mastery level
function markCard(level) {
    flashcards[currentCardIndex].mastery = level;
    
    // Save to localStorage
    const savedData = JSON.parse(localStorage.getItem('lectureData'));
    savedData.flashcards = flashcards;
    localStorage.setItem('lectureData', JSON.stringify(savedData));
    
    // Move to next card
    if (currentCardIndex < flashcards.length - 1) {
        nextCard();
    } else {
        // Show completion message
        alert('You have reviewed all flashcards!');
    }
}

// Shuffle cards
function shuffleCards() {
    flashcards = flashcards.sort(() => Math.random() - 0.5);
    currentCardIndex = 0;
    displayCard();
    updateProgress();
}

// Reset progress
function resetProgress() {
    if (confirm('Reset all progress? This will clear your mastery ratings.')) {
        flashcards.forEach(card => card.mastery = 'unreviewed');
        currentCardIndex = 0;
        displayCard();
        updateProgress();
        
        // Save to localStorage
        const savedData = JSON.parse(localStorage.getItem('lectureData'));
        savedData.flashcards = flashcards;
        localStorage.setItem('lectureData', JSON.stringify(savedData));
    }
}

// Update progress bar
function updateProgress() {
    const progress = ((currentCardIndex + 1) / flashcards.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
}

// Upload new lecture - clears old data and redirects to upload page
function uploadNewLecture() {
    if (confirm('Upload a new lecture? This will clear the current flashcards.')) {
        localStorage.removeItem('lectureData');
        window.location.href = 'index.html';
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', loadFlashcards);
