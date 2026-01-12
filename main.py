import os
import sys
import logging
from app import create_app

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)

logger = logging.getLogger(__name__)
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting LectraNote on port {port}")
    logger.info(f"Environment: {'Production' if not os.environ.get('DEBUG') else 'Development'}")
    app.run(host='0.0.0.0', port=port, threaded=True, debug=False)