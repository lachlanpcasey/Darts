import React, { useState } from 'react';
import './Dartboard.css';

interface DartboardProps {
  onSectionClick: (section: string) => void;
  currentThrows: string[];
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  text: string;
}

const Dartboard: React.FC<DartboardProps> = ({ onSectionClick, currentThrows }) => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    text: ''
  });

  // Define the segments and their angles
  const segments = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
  const segmentAngle = 360 / segments.length;

  const handleMouseMove = (e: React.MouseEvent, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTooltip({ visible: true, x, y, text });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  // Helper to check if a section is part of current throws
  const isActiveSection = (section: string): boolean => {
    return currentThrows.includes(section);
  };

  // Generate path for a segment
  const getSegmentPath = (index: number, innerRadius: number, outerRadius: number): string => {
    const startAngle = index * segmentAngle - 90 - segmentAngle / 2;
    const endAngle = startAngle + segmentAngle;
    
    const startRadians = (startAngle * Math.PI) / 180;
    const endRadians = (endAngle * Math.PI) / 180;
    
    const startOuterX = 250 + outerRadius * Math.cos(startRadians);
    const startOuterY = 250 + outerRadius * Math.sin(startRadians);
    const endOuterX = 250 + outerRadius * Math.cos(endRadians);
    const endOuterY = 250 + outerRadius * Math.sin(endRadians);
    
    const startInnerX = 250 + innerRadius * Math.cos(startRadians);
    const startInnerY = 250 + innerRadius * Math.sin(startRadians);
    const endInnerX = 250 + innerRadius * Math.cos(endRadians);
    const endInnerY = 250 + innerRadius * Math.sin(endRadians);

    return `
      M ${startOuterX} ${startOuterY}
      A ${outerRadius} ${outerRadius} 0 0 1 ${endOuterX} ${endOuterY}
      L ${endInnerX} ${endInnerY}
      A ${innerRadius} ${innerRadius} 0 0 0 ${startInnerX} ${startInnerY}
      Z
    `;
  };

  // Helper function to determine text rotation
  const getTextRotation = (angle: number): number => {
    // Normalize the angle to 0-360 range
    let normalizedAngle = angle % 360;
    if (normalizedAngle < 0) normalizedAngle += 360;
    
    // If the angle is in the bottom half of the circle,
    // rotate the text 180 degrees to keep it upright
    if (normalizedAngle > 90 && normalizedAngle < 270) {
      return angle + 180;
    }
    return angle;
  };

  return (
    <div className="dartboard-container">
      <svg viewBox="0 0 500 500" className="dartboard">
        {/* Double ring */}
        {segments.map((number, index) => {
          const section = `D${number}`;
          return (
            <path
              key={`double-${number}`}
              d={getSegmentPath(index, 165, 180)}
              className={`segment double ${index % 2 === 0 ? 'even' : 'odd'} ${isActiveSection(section) ? 'active' : ''}`}
              onClick={() => onSectionClick(section)}
              onMouseMove={(e) => handleMouseMove(e, `Double ${number} (${number * 2})`)}
              onMouseLeave={handleMouseLeave}
            />
          );
        })}

        {/* Outer single */}
        {segments.map((number, index) => {
          const section = `S${number}`;
          return (
            <path
              key={`outer-single-${number}`}
              d={getSegmentPath(index, 130, 165)}
              className={`segment single ${index % 2 === 0 ? 'even' : 'odd'} ${isActiveSection(section) ? 'active' : ''}`}
              onClick={() => onSectionClick(section)}
              onMouseMove={(e) => handleMouseMove(e, `Single ${number}`)}
              onMouseLeave={handleMouseLeave}
            />
          );
        })}

        {/* Triple ring */}
        {segments.map((number, index) => {
          const section = `T${number}`;
          return (
            <path
              key={`triple-${number}`}
              d={getSegmentPath(index, 120, 130)}
              className={`segment triple ${index % 2 === 0 ? 'even' : 'odd'} ${isActiveSection(section) ? 'active' : ''}`}
              onClick={() => onSectionClick(section)}
              onMouseMove={(e) => handleMouseMove(e, `Triple ${number} (${number * 3})`)}
              onMouseLeave={handleMouseLeave}
            />
          );
        })}

        {/* Inner single */}
        {segments.map((number, index) => {
          const section = `S${number}`;
          return (
            <path
              key={`inner-single-${number}`}
              d={getSegmentPath(index, 30, 120)}
              className={`segment single ${index % 2 === 0 ? 'even' : 'odd'} ${isActiveSection(section) ? 'active' : ''}`}
              onClick={() => onSectionClick(section)}
              onMouseMove={(e) => handleMouseMove(e, `Single ${number}`)}
              onMouseLeave={handleMouseLeave}
            />
          );
        })}

        {/* Single bull (outer bull) */}
        <circle
          cx="250"
          cy="250"
          r="32"
          className={`single-bull ${isActiveSection('25') ? 'active' : ''}`}
          onClick={() => onSectionClick('25')}
          onMouseMove={(e) => handleMouseMove(e, '25 (25)')}
          onMouseLeave={handleMouseLeave}
        />

        {/* Double bull (inner bull) */}
        <circle
          cx="250"
          cy="250"
          r="16"
          className={`double-bull ${isActiveSection('BULL') ? 'active' : ''}`}
          onClick={() => onSectionClick('BULL')}
          onMouseMove={(e) => handleMouseMove(e, 'BULL (50)')}
          onMouseLeave={handleMouseLeave}
        />

        {/* Numbers */}
        {segments.map((number, index) => {
          const angle = index * segmentAngle - 90;
          const radius = 195;
          const x = 250 + radius * Math.cos((angle * Math.PI) / 180);
          const y = 250 + radius * Math.sin((angle * Math.PI) / 180);
          const rotation = getTextRotation(angle + 90);
          
          return (
            <text
              key={`number-${number}`}
              x={x}
              y={y}
              className="segment-number"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${rotation}, ${x}, ${y})`}
            >
              {number}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="dartboard-tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default Dartboard; 