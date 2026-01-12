import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app.services.audio_service import AudioService
from app.services.rag_service import RagService

api_bp = Blueprint('api', __name__)

ALLOWED_EXTENSIONS = {'mp3', 'wav', 'm4a', 'ogg', 'flac', 'webm'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@api_bp.route('/process-lecture', methods=['POST'])
def process_lecture():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file format. Supported formats: MP3, WAV, M4A, OGG, FLAC, WEBM"}), 400
    
    filename = secure_filename(file.filename)
    save_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    
    try:
        file.save(save_path)
        
        file_size = os.path.getsize(save_path)
        max_size = 25 * 1024 * 1024
        
        if file_size > max_size:
            os.remove(save_path)
            return jsonify({
                "error": f"File size ({file_size / (1024*1024):.2f}MB) exceeds maximum limit of 25MB. Please compress your audio or upload a shorter clip."
            }), 413
        
        print(f"Processing file: {filename} ({file_size / (1024*1024):.2f}MB)")
        
        audio_service = AudioService()
        transcript = audio_service.transcribe(save_path)
        
        if not transcript or len(transcript.strip()) == 0:
            raise Exception("Transcription resulted in empty text. The audio may be silent or corrupted.")

        print(f"Transcript length: {len(transcript)} characters")

        quiz_count = request.form.get('quiz_count', '5')
        try:
            quiz_count = int(quiz_count)
            if quiz_count < 1 or quiz_count > 20:
                quiz_count = 5
        except ValueError:
            quiz_count = 5
        
        context = request.form.get('context', '')
        print(f"Starting RAG processing with {quiz_count} quiz questions...")
            
        rag_service = RagService()
        notes = rag_service.generate_study_material(
            transcript, 
            quiz_count=quiz_count,
            context=context
        )
        
        print("RAG processing completed successfully")

        if os.path.exists(save_path):
            os.remove(save_path)

        return jsonify({
            "status": "success",
            "transcript_preview": transcript[:200] + "...",
            "data": notes
        })

    except Exception as e:
        if os.path.exists(save_path):
            os.remove(save_path)
        
        error_message = str(e)
        print(f"Error processing lecture: {error_message}")
        return jsonify({"error": error_message}), 500