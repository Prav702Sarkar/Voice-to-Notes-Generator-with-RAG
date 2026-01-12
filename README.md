# LectraNote - Lecture Voice-to-Notes Generator with RAG

Transform spoken lectures into structured study materials using AI-powered speech-to-text, BERT embeddings, and RAG technology.

## Features

- 🎙️ **Audio Transcription**: Powered by Groq's Whisper-large-v3 model
- 🧠 **BERT Embeddings**: Uses sentence-transformers for semantic understanding
- 📚 **RAG Pipeline**: LangChain + FAISS vector store for context-aware generation
- 💡 **Study Materials**: Auto-generates summaries, definitions, and quizzes
- 🎯 **Interactive UI**: Flashcards, quiz mode, and history tracking
- 🎨 **SDG Theme**: Quality Education (SDG 4) themed interface

## Tech Stack

### Backend
- **Framework**: Flask 3.0+
- **AI Models**: 
  - Whisper-large-v3 (transcription)
  - Llama-3.3-70b-versatile (content generation)
  - sentence-transformers/all-MiniLM-L6-v2 (BERT embeddings)
- **RAG**: LangChain + FAISS
- **API**: Groq API

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Font Awesome icons
- LocalStorage for data persistence

## Installation

### Prerequisites
- Python 3.11 or higher
- Groq API key ([Get one here](https://console.groq.com))

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd "Lecture Voice-to-Notes Generator with RAG"
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

5. **Run the application**
   ```bash
   python main.py
   ```

6. **Access the application**
   
   Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Usage

### 1. Upload Lecture
- Drag & drop or browse to select audio file (MP3, WAV, M4A, etc.)
- Or record audio directly using microphone
- Optionally add context/prompt for customized generation
- Select number of quiz questions (1-20)

### 2. Processing
- Audio is transcribed using Whisper AI
- Text is embedded using BERT
- Study materials are generated using RAG + Llama

### 3. Study Materials
- **Summary**: Structured executive summary
- **Definitions**: Key terms and concepts
- **Quiz**: Multiple-choice questions with answers

### 4. Interactive Features
- **Flashcards**: Flip cards to study definitions
- **Quiz Mode**: Test knowledge with randomized questions
- **History**: Save and reload previous lectures

## File Size Limits

- **Maximum file size**: 25MB (Groq API limit)
- **Recommended duration**: 1-10 minutes per audio file
- For longer lectures, split into multiple files

## Project Structure

```
.
├── app/
│   ├── __init__.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py          # Flask API endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── audio_service.py   # Whisper transcription
│   │   └── rag_service.py     # BERT + RAG pipeline
│   └── utils/
│       └── file_handler.py
├── frontend/
│   ├── index.html             # Upload page
│   ├── home.html              # Landing page
│   ├── results.html           # Study materials
│   ├── flashcards.html        # Flashcard viewer
│   ├── quiz.html              # Quiz interface
│   ├── history.html           # Saved lectures
│   ├── css/
│   │   └── style.css          # Global styles
│   └── js/
│       ├── main.js            # Upload logic
│       ├── results.js         # Results display
│       ├── flashcards.js      # Flashcard logic
│       └── quiz.js            # Quiz logic
├── uploads/                   # Temporary audio files
├── .env                       # Environment variables
├── .gitignore
├── config.py                  # Flask configuration
├── main.py                    # Application entry point
└── requirements.txt           # Python dependencies
```

## Configuration

Edit `config.py` to customize:

- `UPLOAD_FOLDER`: Temporary upload directory
- `MAX_CONTENT_LENGTH`: Maximum file size (default: 25MB)
- `EMBEDDING_MODEL_NAME`: BERT model for embeddings
- `VECTOR_DB_PATH`: FAISS index storage path

## Troubleshooting

### Audio processing fails
- Check file size is under 25MB
- Ensure audio format is supported
- Verify Groq API key is valid

### Out of memory errors
- Use smaller audio files
- Close other applications
- Increase system RAM if possible

### Slow processing
- Check internet connection (API calls required)
- Reduce quiz question count
- Use shorter audio clips

## API Rate Limits

Groq API free tier limits:
- Check current limits at [Groq Console](https://console.groq.com)
- Consider upgrading for higher usage

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Credits

**Created by Praveen Kumar Sarkar**

- Whisper AI by OpenAI
- Llama by Meta AI
- BERT by Google Research
- Groq API for inference
- SDG Quality Education (Goal 4) inspiration

## Support

For issues or questions:
- Create an issue on GitHub
- Check documentation
- Review troubleshooting section

---

**LectraNote** - Transform lectures into knowledge with AI 🧠
