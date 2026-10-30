import React, { useState, useEffect, useRef } from 'react';

export interface DynamicSchematicTextProps extends React.SVGProps<SVGTextElement> {
  value: string | number;
  children?: React.ReactNode;
  activeColor?: string;
  defaultColor?: string;
}

/**
 * DynamicSchematicText renders an SVG <text> element that flashes a subtle
 * luminous Neon Cyan accent glow whenever its value changes, visually confirming
 * to the user that their parameter change has been registered in the schematic diagram.
 */
export const DynamicSchematicText: React.FC<DynamicSchematicTextProps> = ({
  value,
  children,
  activeColor = '#00F0FF',
  defaultColor = '#e2e8f0',
  className = '',
  style = {},
  ...props
}) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const prevValue = useRef(value);
  const isFirstRender = useRef(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Avoid initial mount flash
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (prevValue.current !== value) {
      prevValue.current = value;
      setIsFlashing(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setIsFlashing(false);
      }, 750);
    }

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [value]);

  const dynamicStyle: React.CSSProperties = {
    ...style,
    transition: 'all 0.25s ease-out',
    fill: isFlashing ? activeColor : (props.fill || defaultColor),
    filter: isFlashing ? `drop-shadow(0 0 6px ${activeColor})` : undefined,
  };

  return (
    <text {...props} style={dynamicStyle} className={className}>
      {children !== undefined ? children : value}
    </text>
  );
};
