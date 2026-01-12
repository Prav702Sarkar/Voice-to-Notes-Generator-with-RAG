import os
from groq import Groq
from flask import current_app

class AudioService:
    def __init__(self):
        self.client = Groq(api_key=current_app.config['GROQ_API_KEY'])
        self.max_file_size = 25 * 1024 * 1024

    def transcribe(self, file_path):
        """Transcribes audio using Groq's Whisper-large-v3 model."""
        try:
            file_size = os.path.getsize(file_path)
            if file_size > self.max_file_size:
                raise Exception(f"File size ({file_size / (1024*1024):.2f}MB) exceeds maximum limit of 25MB. Please upload a smaller file.")
            
            if file_size == 0:
                raise Exception("File is empty. Please upload a valid audio file.")
            
            print(f"Transcribing audio file: {os.path.basename(file_path)} ({file_size / (1024*1024):.2f}MB)")
            
            with open(file_path, "rb") as file:
                transcription = self.client.audio.transcriptions.create(
                    file=(os.path.basename(file_path), file.read()),
                    model="whisper-large-v3",
                    response_format="json",
                    temperature=0.0
                )
            
            print(f"Transcription completed: {len(transcription.text)} characters")
            return transcription.text
            
        except Exception as e:
            error_msg = str(e)
            if "timeout" in error_msg.lower():
                raise Exception("Transcription timed out. The audio file may be too long. Try a shorter clip or compress the audio.")
            elif "rate limit" in error_msg.lower():
                raise Exception("API rate limit exceeded. Please wait a moment and try again.")
            else:
                raise Exception(f"Transcription failed: {error_msg}")