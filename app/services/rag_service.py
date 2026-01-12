from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from groq import Groq
from flask import current_app

class RagService:
    def __init__(self):
        # INITIALIZE BERT: We use a BERT-based Sentence Transformer for embeddings
        model_name = current_app.config['EMBEDDING_MODEL_NAME']
        print(f"Loading BERT Model: {model_name}...")
        self.embeddings = HuggingFaceEmbeddings(model_name=model_name)
        
        # Initialize LLM Client
        self.llm_client = Groq(api_key=current_app.config['GROQ_API_KEY'])

    def create_vector_db(self, text):
        """Chunks text and embeds it using BERT into FAISS."""
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        docs = [Document(page_content=x) for x in text_splitter.split_text(text)]
        
        # Creates the vector store locally using BERT embeddings
        vector_db = FAISS.from_documents(docs, self.embeddings)
        return vector_db

    def generate_study_material(self, full_text, **kwargs):
        """Orchestrates the RAG pipeline."""
        
        print(f"Starting RAG processing for {len(full_text)} characters of text")
        
        # 1. Create Knowledge Base
        print("Creating vector database with BERT embeddings...")
        db = self.create_vector_db(full_text)
        retriever = db.as_retriever(search_kwargs={"k": 4})
        print("Vector database created successfully")

        # 2. Get parameters
        quiz_count = kwargs.get('quiz_count', 5)
        user_context = kwargs.get('context', '')
        
        # Add context to system prompt if provided
        context_instruction = ""
        if user_context:
            context_instruction = f"\n\nUser Context: {user_context}\nPlease consider this context when generating the study materials."
        
        # 3. Define Prompts
        prompts = {
            "summary": f"Write a structured executive summary of this lecture.{context_instruction}",
            "definitions": f"""Extract ALL important terms, concepts, and definitions from the lecture. 
            Format EACH as: <strong>Term:</strong> Definition<br><br>
            Include at least 10-15 key terms. Be comprehensive and accurate.
            Example format:
            <strong>Serializability:</strong> The property of a concurrency control protocol that ensures...<br><br>
            <strong>Two-Phase Locking:</strong> A protocol that ensures serializability by...<br><br>{context_instruction}""",
            "quiz": f"""Generate EXACTLY {quiz_count} multiple-choice questions with 4 options each. 
            
            STRICT FORMAT for EACH question:
            
            1. [Question text ending with ?]
            A) [First option]
            B) [Second option]
            C) [Third option]
            D) [Fourth option]
            Correct answer: [A, B, C, or D]
            
            2. [Next question text ending with ?]
            A) [First option]
            B) [Second option]
            C) [Third option]
            D) [Fourth option]
            Correct answer: [A, B, C, or D]
            
            Continue for all {quiz_count} questions. Each question MUST have exactly 4 options (A, B, C, D) and one correct answer.{context_instruction}"""
        }
        
        results = {}

        # 4. Run RAG for each section
        for key, prompt in prompts.items():
            print(f"Generating {key}...")
            
            # Retrieve relevant chunks from BERT vectors
            relevant_docs = retriever.invoke(prompt)
            context = "\n".join([doc.page_content for doc in relevant_docs])
            
            # Build system message with context awareness
            system_message = "You are a university professor. Format output in HTML."
            if user_context:
                system_message += f" The user has provided this additional context: {user_context}"
            
            # Generate Answer with timeout handling
            try:
                response = self.llm_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": f"Context: {context}\n\nTask: {prompt}"}
                    ],
                    max_tokens=2000,  # Limit response length to prevent timeouts
                    temperature=0.7
                )
                results[key] = response.choices[0].message.content
                print(f"{key} generated successfully ({len(results[key])} characters)")
                
            except Exception as e:
                error_msg = str(e)
                print(f"Error generating {key}: {error_msg}")
                if "timeout" in error_msg.lower():
                    raise Exception(f"LLM request timed out while generating {key}. The transcript may be too long.")
                else:
                    raise Exception(f"Failed to generate {key}: {error_msg}")
            
        print("All study materials generated successfully")
        return results