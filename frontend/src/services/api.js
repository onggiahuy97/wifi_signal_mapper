import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// WiFi information
export const getWifiInfo = async () => {
  try {
    const response = await axios.get(`${API_URL}/wifi/info`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Floor plan operations
export const uploadFloorPlan = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/floor-plan`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getFloorPlan = async () => {
  try {
    const response = await axios.get(`${API_URL}/floor-plan`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Measurement operations
export const getMeasurements = async () => {
  try {
    const response = await axios.get(`${API_URL}/measurements`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const addMeasurement = async (measurement) => {
  try {
    const response = await axios.post(`${API_URL}/measurements`, measurement);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const updateMeasurement = async (id, measurement) => {
  try {
    const response = await axios.put(`${API_URL}/measurements/${id}`, measurement);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const deleteMeasurement = async (id) => {
  try {
    await axios.delete(`${API_URL}/measurements/${id}`);
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Heat map generation
export const generateHeatMap = async (method = 'idw') => {
  try {
    // Return URL directly for image display
    return `${API_URL}/heatmap?method=${method}&t=${Date.now()}`;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Session operations
export const saveSession = async () => {
  try {
    const response = await axios.post(`${API_URL}/session`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const loadSession = async (sessionData) => {
  try {
    const response = await axios.put(`${API_URL}/session`, sessionData);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}// Add this function to your existing api.js file

// Signal chart generation
export const generateSignalChart = async () => {
  try {
    // Return URL directly for image display
    return `${API_URL}/signal-chart?t=${Date.now()}`;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};;

export const resetAll = async () => {
  try {
    const response = await axios.post(`${API_URL}/reset`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
