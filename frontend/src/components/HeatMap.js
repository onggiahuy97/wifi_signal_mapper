import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const HeatMap = ({ imageUrl, onClose }) => {
  return (
    <Modal show={!!imageUrl} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>WiFi Signal Heat Map</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        {imageUrl && (
          <img
            src={imageUrl}
            alt="WiFi Heat Map"
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
          />
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          onClick={() => {
            // Download image
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = 'wifi-heat-map.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        >
          Download
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default HeatMap;
