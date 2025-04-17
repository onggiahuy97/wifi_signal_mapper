// Utility function to determine color based on RSSI value
export const getRssiColor = (rssi) => {
  if (rssi > -50) {
    return '#00CC00';  // Strong signal - green
  } else if (rssi > -60) {
    return '#AAFF00';  // Good signal - light green
  } else if (rssi > -70) {
    return '#FFFF00';  // Fair signal - yellow
  } else if (rssi > -80) {
    return '#FFAA00';  // Poor signal - orange
  } else {
    return '#FF0000';  // Very weak signal - red
  }
};
