// App.js
import React, { useState, useEffect, useRef } from 'react';
import { Container, Button, Alert } from 'react-bootstrap';
import FloorPlan from './components/FloorPlan';
import HeatMap from './components/HeatMap';
import {
  getWifiInfo,
  uploadFloorPlan,
  getFloorPlan,
  getMeasurements,
  addMeasurement,
  generateHeatMap,
  resetAll
} from './services/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [floorPlan, setFloorPlan] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [heatMapUrl, setHeatMapUrl] = useState(null);
  const [status, setStatus] = useState('Click on the floor plan to measure WiFi signal');
  const [error, setError] = useState(null);

  // Refs
  const stageRef = useRef(null);

  // Load data on mount
  useEffect(() => {
    loadFloorPlan();
    loadMeasurements();
  }, []);

  const handleReset = async () => {
    try {
      setStatus('Resetting all data...');
      await resetAll();
      setFloorPlan(null);
      setMeasurements([]);
      setShowHeatMap(false);
      setStatus('Click on the floor plan to measure WiFi signal');
    } catch (error) {
      console.error('Error resetting data:', error);
      setError('Failed to reset data');
    }
  }

  const loadFloorPlan = async () => {
    try {
      const response = await getFloorPlan();
      setFloorPlan(response);
    } catch (error) {
      console.error('Error loading floor plan:', error);
      // It's OK if no floor plan exists yet
    }
  };

  const loadMeasurements = async () => {
    try {
      const response = await getMeasurements();
      setMeasurements(response);
    } catch (error) {
      console.error('Error loading measurements:', error);
    }
  };

  const handleFloorPlanUpload = async (file) => {
    try {
      setStatus('Uploading floor plan...');
      const response = await uploadFloorPlan(file);
      setFloorPlan(response);
      setStatus('Floor plan uploaded. Click anywhere to measure WiFi signal.');
      // Reload floor plan to get image data
      loadFloorPlan();
    } catch (error) {
      console.error('Error uploading floor plan:', error);
      setError('Failed to upload floor plan');
      setStatus('Ready');
    }
  };

  const handleCanvasClick = async (x, y) => {
    try {
      setStatus('Measuring WiFi signal...');
      const wifiInfo = await getWifiInfo();

      if (wifiInfo.error) {
        throw new Error(wifiInfo.error);
      }

      if (!wifiInfo.RSSI) {
        throw new Error('No RSSI value found in WiFi information');
      }

      const newMeasurement = {
        x: Math.round(x),
        y: Math.round(y),
        rssi: wifiInfo.RSSI
      };

      const response = await addMeasurement(newMeasurement);
      const updatedMeasurements = [...measurements, response];
      setMeasurements(updatedMeasurements);
      setStatus(`Measured ${wifiInfo.RSSI} dBm at (${x}, ${y})`);

    } catch (error) {
      console.error('Error taking measurement:', error);
      setError(`Failed to take measurement: ${error.message}`);
      setStatus('Ready');
    }
  };

  const generateHeatMapFromPoints = async () => {
    if (measurements.length < 3) {
      setStatus('Need at least 3 measurement points for a heat map');
      return;
    }

    try {
      setStatus('Generating heat map...');
      const url = await generateHeatMap('idw');
      setHeatMapUrl(url);
      setShowHeatMap(true);
      setStatus('Heat map generated');
    } catch (error) {
      console.error('Error generating heat map:', error);
      setError('Failed to generate heat map');
      setStatus('Ready');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFloorPlanUpload(file);
    }
  };

  return (
    <Container fluid className="app-container">
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <div className="heat-map-button-container">
        <Button
          variant="primary"
          onClick={generateHeatMapFromPoints}
          disabled={measurements.length < 3}
          className="me-2"
        >
          Generate Heat Map {measurements.length < 3 ? `(Need ${3 - measurements.length} more points)` : ''}
        </Button>

        <Button
          variant="secondary"
          onClick={handleReset}
          disabled={measurements.length === 0}
          className="me-2"
        >
          Reset Measurements
        </Button>

      </div>

      <div className="status-bar">
        {status}
      </div>

      {!floorPlan ? (
        <div className="upload-prompt">
          <h2>WiFi Heat Mapper</h2>
          <p>Upload a floor plan image to begin mapping WiFi signal strength</p>
          <input
            type="file"
            id="floor-plan-upload"
            accept=".png,.jpg,.jpeg"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Button
            variant="primary"
            size="lg"
            onClick={() => document.getElementById('floor-plan-upload').click()}
          >
            Upload Floor Plan
          </Button>
        </div>
      ) : (
        <div className="main-content">
          <div className="canvas-container">
            <FloorPlan
              floorPlan={floorPlan}
              measurements={measurements}
              onCanvasClick={handleCanvasClick}
              stageRef={stageRef}
            />
          </div>

          <div className="status-bar">
            {status}
          </div>

          {showHeatMap && heatMapUrl && (
            <HeatMap
              imageUrl={heatMapUrl}
              onClose={() => setShowHeatMap(false)}
            />
          )}
        </div>
      )}
    </Container>
  );
}

export default App;
