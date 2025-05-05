from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import io 
import os 
import uuid
import base64
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use a non-GUI backend for rendering
import matplotlib.pyplot as plt
from PIL import Image
from werkzeug.utils import secure_filename
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

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/wifi/info', methods=['GET'])
def wifi_info():
    """
    Get WiFi information.
    """
    try:
        info = wifi_scanner.MacOSWiFiScanner.get_wifi_info()
        return jsonify(info), 200
    except Exception as e:
        app.logger.exception("Error getting WiFi information")
        return jsonify({"error": str(e)}), 500

@app.route('/api/floor-plan', methods=['POST'])
def upload_floor_plan():
    """Upload a floor plan image"""
    global floor_plan
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Store floor plan info
        floor_plan = {
            'id': str(uuid.uuid4()),
            'filename': filename,
            'path': filepath
        }
        
        return jsonify(floor_plan), 201
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/api/floor-plan', methods=['GET'])
def get_floor_plan():
    """Get the current floor plan"""
    if floor_plan is None:
        return jsonify({'error': 'No floor plan uploaded'}), 404
    
    # Return image as base64
    with open(floor_plan['path'], 'rb') as image_file:
        encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
    
    return jsonify({
        'id': floor_plan['id'],
        'filename': floor_plan['filename'],
        'imageData': f"data:image/png;base64,{encoded_image}"
    })

@app.route('/api/measurements', methods=['GET'])
def get_measurements():
    """Get all measurement points"""
    return jsonify(measurements)

@app.route('/api/measurements', methods=['POST'])
def add_measurement():
    """Add a new measurement point"""
    data = request.json
    
    if not all(k in data for k in ('x', 'y', 'rssi')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    measurement = {
        'id': str(uuid.uuid4()),
        'x': data['x'],
        'y': data['y'],
        'rssi': data['rssi']
    }
    
    measurements.append(measurement)
    return jsonify(measurement), 201

@app.route('/api/heatmap', methods=['GET'])
def generate_heatmap():
    """Generate heat map from measurements"""
    if len(measurements) < 3:
        return jsonify({'error': 'Need at least 3 measurements for heat map'}), 400
    
    # Extract measurement data
    points = [(m['x'], m['y'], m['rssi']) for m in measurements]
    
    try:
        # Create a grid for interpolation
        x_coords = [p[0] for p in points]
        y_coords = [p[1] for p in points]
        rssi_values = [p[2] for p in points]
        
        # Get min/max coordinates with padding
        padding = HEATMAP_PADDING
        x_min = max(0, min(x_coords) - padding)
        x_max = max(x_coords) + padding
        y_min = max(0, min(y_coords) - padding)
        y_max = max(y_coords) + padding
        
        # Create grid for interpolation
        grid_size = 100
        x_grid = np.linspace(x_min, x_max, grid_size)
        y_grid = np.linspace(y_min, y_max, grid_size)
        X, Y = np.meshgrid(x_grid, y_grid)
        Z = np.zeros(X.shape)
        
        # Simple IDW interpolation (Inverse Distance Weighting)
        power = 2  # Power parameter for IDW
        for i in range(grid_size):
            for j in range(grid_size):
                point_x, point_y = X[i, j], Y[i, j]
                distances = np.sqrt([(x - point_x)**2 + (y - point_y)**2 for x, y in zip(x_coords, y_coords)])
                
                # Check if any point is exactly at the output location
                if np.any(np.array(distances) < 1e-6):
                    Z[i, j] = rssi_values[np.argmin(distances)]
                else:
                    weights = 1.0 / (np.array(distances)**power)
                    Z[i, j] = np.sum(weights * np.array(rssi_values)) / np.sum(weights)
        
        # Define the extent for properly aligning coordinates
        extent = [x_min, x_max, y_max, y_min]  # [left, right, bottom, top]
        
        # Create matplotlib figure
        fig = plt.figure(figsize=(10, 8))
        ax = fig.add_subplot(111)
        
        # If floor plan exists, use it as background
        if floor_plan:
            try:
                img = Image.open(floor_plan['path'])
                ax.imshow(np.array(img), extent=extent, origin='upper', aspect='equal', alpha=0.9)
            except Exception as e:
                app.logger.error(f"Error loading floor plan: {e}")
        
        # Create contour plot
        contour = ax.contourf(X, Y, Z, cmap='RdYlGn', alpha=0.6, levels=15, extent=extent)
        
        # Add colorbar
        fig.colorbar(contour, ax=ax, label='Signal Strength (dBm)')
        
        # Mark measurement points
        for point in points:
            x, y, rssi = point
            ax.plot(x, y, 'ko', markersize=8, zorder=10)
            ax.text(x, y-15, f"{rssi} dBm", ha='center', fontsize=8, fontweight='bold', zorder=10)
        
        # Set axes limits
        ax.set_xlim(extent[0], extent[1])
        ax.set_ylim(extent[3], extent[2])  # Note: reversed y-axis
        ax.invert_yaxis()  # Invert y-axis to match canvas coordinates
        
        # Title
        ax.set_title("WiFi Signal Strength Heat Map")
        
        # Save figure to memory
        img_bytes = io.BytesIO()
        fig.tight_layout()
        fig.savefig(img_bytes, format='png', dpi=100, bbox_inches='tight')
        img_bytes.seek(0)
        
        # Close the figure
        plt.close(fig)
        
        return send_file(img_bytes, mimetype='image/png')
    except Exception as e:
        app.logger.exception(f"Error generating heat map: {e}")
        return jsonify({'error': f'Heat map generation failed: {str(e)}'}), 500

@app.route('/api/reset', methods=['POST'])
def reset_data():
    """Reset all measurements and floor plan"""
    global measurements, floor_plan
    
    # Clear measurements
    measurements = []
    
    # Clear floor plan
    if floor_plan and 'path' in floor_plan:
        try:
            # Optionally delete the file
            os.remove(floor_plan['path'])
        except Exception as e:
            app.logger.error(f"Error removing floor plan file: {e}")
    
    floor_plan = None
    
    return jsonify({'message': 'All data reset successfully'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001, threaded=False)
