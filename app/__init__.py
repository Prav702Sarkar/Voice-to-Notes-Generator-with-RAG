from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
import logging

logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__, static_folder='../frontend', static_url_path='/')
    app.config.from_object(Config)
    Config.init_app(app)
    CORS(app)

    from app.api.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    @app.route('/')
    def index():
        return app.send_static_file('home.html')
    
    @app.route('/health')
    def health():
        """Health check endpoint for Cloud Run."""
        return jsonify({
            'status': 'healthy',
            'service': 'LectraNote',
            'version': '1.0.0'
        }), 200
    
    @app.errorhandler(404)
    def not_found(error):
        logger.warning(f"404 error: {error}")
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(413)
    def request_entity_too_large(error):
        logger.warning(f"413 error: File too large")
        return jsonify({
            'error': 'File size exceeds maximum limit of 25MB. Please upload a smaller file.'
        }), 413
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"500 error: {error}")
        return jsonify({'error': 'Internal server error'}), 500

    logger.info("Flask app initialized successfully")
    return app