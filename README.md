# WiFi Signal Mapper

A web application that maps WiFi signal strength across a floor plan to identify areas with strong and weak connectivity.

## Features

- Upload floor plans to visualize your space
- Collect WiFi signal strength measurements at various points
- Generate heat maps showing signal strength distribution
- Identify weak signal areas that need improvement

## Screenshots

### Floor Plan with Signal Measurements
![Floor Plan](/floorplan.png)

### Heat Map Visualization
![Heat Map](/heatmap.png)

## Technology Stack

- **Frontend**: React.js
- **Backend**: Flask (Python)
- **WiFi Scanning**: Native OS integrations
- **Data Visualization**: Matplotlib

## Setup

1. Start the backend server
   ```
   cd backend
   python app.py
   ```

2. Start the frontend development server
   ```
   cd frontend
   npm install
   npm start
   ```

3. Access the application at `http://localhost:3000`