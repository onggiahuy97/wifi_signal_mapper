// FloorPlan.js
import React, { useState, useEffect } from 'react';
import { Stage, Layer, Image, Circle, Text, Rect } from 'react-konva';
import useImage from 'use-image';
import { getRssiColor } from '../utils/colors';

const MeasurementPoint = ({ point }) => {
  const { x, y, rssi } = point;
  const radius = 6;
  const color = getRssiColor(rssi);

  return (
    <>
      <Circle
        x={x}
        y={y}
        radius={radius}
        fill={color}
        stroke={'black'}
        strokeWidth={1}
      />
      <Text
        x={x - 15}
        y={y - 20}
        text={`${rssi} dBm`}
        fontSize={12}
        align="center"
        width={30}
      />
    </>
  );
};

const FloorPlan = ({
  floorPlan,
  measurements,
  onCanvasClick,
  stageRef
}) => {
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [image, status] = useImage(floorPlan ? floorPlan.imageData : '');
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageBounds, setImageBounds] = useState(null);

  // Update stage size on window resize
  useEffect(() => {
    const updateSize = () => {
      const container = document.querySelector('.canvas-container');
      if (container) {
        setStageSize({
          width: container.offsetWidth,
          height: container.offsetHeight
        });
      }
    };

    // Initial size
    updateSize();

    // Add resize listener
    window.addEventListener('resize', updateSize);

    // Clean up
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate scale and position when image loads
  useEffect(() => {
    if (image && stageSize.width > 0 && stageSize.height > 0) {
      const scaleX = stageSize.width / image.width;
      const scaleY = stageSize.height / image.height;
      const newScale = Math.min(scaleX, scaleY, 1); // Don't upscale beyond 1.0
      setScale(newScale);

      // Center the image
      const newX = (stageSize.width - image.width * newScale) / 2;
      const newY = (stageSize.height - image.height * newScale) / 2;

      setImagePosition({ x: newX, y: newY });

      // Set image boundaries for click detection
      setImageBounds({
        x: newX,
        y: newY,
        width: image.width * newScale,
        height: image.height * newScale
      });
    }
  }, [image, stageSize]);

  // Check if point is inside image bounds
  const isPointInImage = (x, y) => {
    if (!imageBounds) return false;

    return (
      x >= imageBounds.x &&
      x <= imageBounds.x + imageBounds.width &&
      y >= imageBounds.y &&
      y <= imageBounds.y + imageBounds.height
    );
  };

  const handleStageClick = (e) => {
    // Get click position
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    const x = pointerPosition.x;
    const y = pointerPosition.y;

    // Only process clicks on image
    if (e.target !== stage && e.target.name() !== 'floor-plan-image') {
      return;
    }

    // Check if click is within image bounds
    if (isPointInImage(x, y)) {
      onCanvasClick(x, y);
    }
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();

    // Update cursor based on whether mouse is over image
    const overImage = isPointInImage(pointerPosition.x, pointerPosition.y);
    stage.container().style.cursor = overImage ? 'crosshair' : 'default';
  };

  return (
    <Stage
      width={stageSize.width}
      height={stageSize.height}
      onClick={handleStageClick}
      onTap={handleStageClick}
      onMouseMove={handleMouseMove}
      ref={stageRef}
    >
      <Layer>
        <Rect
          x={0}
          y={0}
          width={stageSize.width}
          height={stageSize.height}
          fill="#f0f0f0"
        />

        {status === 'loaded' && image && (
          <Image
            image={image}
            width={image.width * scale}
            height={image.height * scale}
            x={imagePosition.x}
            y={imagePosition.y}
            name="floor-plan-image"
            listening={true}
          />
        )}

        {measurements.map(point => (
          <MeasurementPoint
            key={point.id}
            point={point}
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default FloorPlan;
