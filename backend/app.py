from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import io 
import os 

import wifi_scanner

from typing import List, Dict, Any, Optional

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
HEATMAP_PADDING = 50

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

measurements: List[Dict[str, Any]] = []
floor_plan: Optional[Dict[str, str]] = None 

@app.route('/api/wifi/info', methods=['GET'])
def wifi_info():
    """
    Get WiFi information.
    """
    try:
        scanner = wifi_scanner.MacOSWiFiScanner()
        info = scanner.get_wifi_info()
        return jsonify(info), 200
    except Exception as e:
        app.logger.exception("Error getting WiFi information")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001, threaded=False)
