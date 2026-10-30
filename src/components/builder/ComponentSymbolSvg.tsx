import React from 'react';
import { BuilderComponent } from '../../types/circuitBuilder';

interface ComponentSymbolSvgProps {
  component: BuilderComponent;
  isSelected: boolean;
  onSelect?: () => void;
  activeTerminalId?: string | null;
  onTerminalClick?: (terminalId: string, e: React.MouseEvent) => void;
  onTerminalHover?: (terminalId: string | null) => void;
}

export const ComponentSymbolSvg: React.FC<ComponentSymbolSvgProps> = ({
  component,
  isSelected,
}) => {
  const { type, label, params, rotation } = component;

  // Render individual component graphical symbols centered at (0, 0)
  // Bench instrument aesthetic: Silkscreen line art (#EDF1E8), mask deep fill (#0A2B24), pad gold values (#C9A24B)
  const renderSymbol = () => {
    switch (type) {
      case 'op-amp': {
        const model = params.model || 'LM741';
        return (
          <g>
            {/* Op-amp triangle body */}
            <path
              d="M -40 -35 L 40 0 L -40 35 Z"
              fill="#0A2B24"
              stroke="#EDF1E8"
              strokeWidth="2.0"
              strokeLinejoin="round"
            />
            {/* Input polarity markers */}
            <text x="-28" y="-10" fill="#EDF1E8" fontSize="13" fontWeight="bold" textAnchor="middle">-</text>
            <text x="-28" y="20" fill="#EDF1E8" fontSize="13" fontWeight="bold" textAnchor="middle">+</text>

            {/* Model text in pad gold */}
            <text x="-8" y="4" fill="#C9A24B" fontSize="9" fontFamily="Spline Sans Mono, monospace" fontWeight="600" textAnchor="middle">
              {model}
            </text>

            {/* Terminal lead stubs */}
            <line x1="-40" y1="-15" x2="-40" y2="-15" stroke="#EDF1E8" strokeWidth="2" />
            <line x1="-40" y1="15" x2="-40" y2="15" stroke="#EDF1E8" strokeWidth="2" />
            <line x1="40" y1="0" x2="40" y2="0" stroke="#EDF1E8" strokeWidth="2" />

            {/* Supply leads */}
            <line x1="0" y1="-18" x2="0" y2="-30" stroke="#9EAF9B" strokeWidth="1.2" strokeDasharray="2 2" />
            <text x="6" y="-22" fill="#9EAF9B" fontSize="7.5" fontFamily="Spline Sans Mono, monospace">+V</text>
            <line x1="0" y1="18" x2="0" y2="30" stroke="#9EAF9B" strokeWidth="1.2" strokeDasharray="2 2" />
            <text x="6" y="26" fill="#9EAF9B" fontSize="7.5" fontFamily="Spline Sans Mono, monospace">-V</text>
          </g>
        );
      }

      case 'resistor': {
        const valStr = `${params.value || 10} ${params.unit || 'kΩ'}`;
        return (
          <g>
            {/* Lead wires */}
            <line x1="-35" y1="0" x2="-20" y2="0" stroke="#EDF1E8" strokeWidth="2" />
            <line x1="20" y1="0" x2="35" y2="0" stroke="#EDF1E8" strokeWidth="2" />
            {/* Zigzag body */}
            <path
              d="M -20 0 L -15 -8 L -7 8 L 0 -8 L 7 8 L 15 -8 L 20 0"
              fill="none"
              stroke="#EDF1E8"
              strokeWidth="2.0"
              strokeLinejoin="round"
            />
            {/* Value display */}
            <text x="0" y="-13" fill="#EDF1E8" fontSize="9.5" fontWeight="500" textAnchor="middle">
              {label}
            </text>
            <text x="0" y="20" fill="#C9A24B" fontSize="8.5" fontFamily="Spline Sans Mono, monospace" fontWeight="600" textAnchor="middle">
              {valStr}
            </text>
          </g>
        );
      }

      case 'capacitor': {
        const valStr = `${params.value || 0.01} ${params.unit || 'µF'}`;
        return (
          <g>
            {/* Lead wires */}
            <line x1="-25" y1="0" x2="-6" y2="0" stroke="#EDF1E8" strokeWidth="2" />
            <line x1="6" y1="0" x2="25" y2="0" stroke="#EDF1E8" strokeWidth="2" />
            {/* Parallel plates */}
            <line x1="-6" y1="-16" x2="-6" y2="16" stroke="#EDF1E8" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="6" y1="-16" x2="6" y2="16" stroke="#EDF1E8" strokeWidth="2.4" strokeLinecap="round" />
            {/* Labels */}
            <text x="0" y="-19" fill="#EDF1E8" fontSize="9.5" fontWeight="500" textAnchor="middle">
              {label}
            </text>
            <text x="0" y="26" fill="#C9A24B" fontSize="8.5" fontFamily="Spline Sans Mono, monospace" fontWeight="600" textAnchor="middle">
              {valStr}
            </text>
          </g>
        );
      }

      case 'diode': {
        const model = params.model || '1N4148';
        return (
          <g>
            {/* Lead wires */}
            <line x1="-25" y1="0" x2="-10" y2="0" stroke="#EDF1E8" strokeWidth="2" />
            <line x1="10" y1="0" x2="25" y2="0" stroke="#EDF1E8" strokeWidth="2" />
            {/* Triangle anode */}
            <path d="M -10 -12 L 10 0 L -10 12 Z" fill="#0A2B24" stroke="#EDF1E8" strokeWidth="2" strokeLinejoin="round" />
            {/* Vertical cathode bar */}
            <line x1="10" y1="-13" x2="10" y2="13" stroke="#EDF1E8" strokeWidth="2.4" strokeLinecap="round" />
            {/* Label */}
            <text x="0" y="-16" fill="#EDF1E8" fontSize="9.5" fontWeight="500" textAnchor="middle">
              {label}
            </text>
            <text x="0" y="24" fill="#C9A24B" fontSize="8" fontFamily="Spline Sans Mono, monospace" textAnchor="middle">
              {model}
            </text>
          </g>
        );
      }

      case 'ac-source': {
        const amp = params.amplitude ?? 1.0;
        const freq = params.frequency ?? 1000;
        return (
          <g>
            {/* Circle body */}
            <circle cx="0" cy="0" r="18" fill="#0A2B24" stroke="#EDF1E8" strokeWidth="2.0" />
            {/* Sine wave inside */}
            <path
              d="M -10 0 Q -5 -8 0 0 T 10 0"
              fill="none"
              stroke="#EDF1E8"
              strokeWidth="2.0"
              strokeLinecap="round"
            />
            {/* Leads */}
            <line x1="0" y1="-18" x2="0" y2="-25" stroke="#EDF1E8" strokeWidth="2" />
            <line x1="0" y1="18" x2="0" y2="25" stroke="#EDF1E8" strokeWidth="2" />
            {/* Polarity markers */}
            <text x="8" y="-18" fill="#EDF1E8" fontSize="9" fontWeight="bold">+</text>
            <text x="8" y="24" fill="#9EAF9B" fontSize="9" fontWeight="bold">-</text>
            {/* Label */}
            <text x="24" y="-2" fill="#EDF1E8" fontSize="9.5" fontWeight="500" textAnchor="start">
              {label}
            </text>
            <text x="24" y="12" fill="#C9A24B" fontSize="8" fontFamily="Spline Sans Mono, monospace" textAnchor="start">
              {amp}V, {freq}Hz
            </text>
          </g>
        );
      }

      case 'dc-source': {
        const v = params.voltage ?? 2.5;
        return (
          <g>
            {/* Positive long plate */}
            <line x1="-16" y1="-6" x2="16" y2="-6" stroke="#EDF1E8" strokeWidth="2.4" strokeLinecap="round" />
            {/* Negative short plate */}
            <line x1="-10" y1="6" x2="10" y2="6" stroke="#EDF1E8" strokeWidth="3.0" strokeLinecap="round" />
            {/* Leads */}
            <line x1="0" y1="-6" x2="0" y2="-25" stroke="#EDF1E8" strokeWidth="2" />
            <line x1="0" y1="6" x2="0" y2="25" stroke="#EDF1E8" strokeWidth="2" />
            {/* Polarity */}
            <text x="14" y="-10" fill="#EDF1E8" fontSize="9" fontWeight="bold">+</text>
            <text x="14" y="16" fill="#9EAF9B" fontSize="9" fontWeight="bold">-</text>
            {/* Label */}
            <text x="22" y="2" fill="#EDF1E8" fontSize="9.5" fontWeight="500" textAnchor="start">
              {label} ({v}V)
            </text>
          </g>
        );
      }

      case 'vcc': {
        const v = params.voltage ?? 15;
        return (
          <g>
            <path d="M 0 0 L 0 20" stroke="#EDF1E8" strokeWidth="2" />
            <polygon points="-8,4 8,4 0,-8" fill="#C2412D" stroke="#EDF1E8" strokeWidth="1" />
            <text x="12" y="0" fill="#EDF1E8" fontSize="9" fontFamily="Spline Sans Mono, monospace" fontWeight="600">
              +{v}V VCC
            </text>
          </g>
        );
      }

      case 'vee': {
        const v = params.voltage ?? -15;
        return (
          <g>
            <path d="M 0 0 L 0 -20" stroke="#EDF1E8" strokeWidth="2" />
            <polygon points="-8,-4 8,-4 0,8" fill="#174E42" stroke="#EDF1E8" strokeWidth="1" />
            <text x="12" y="4" fill="#EDF1E8" fontSize="9" fontFamily="Spline Sans Mono, monospace" fontWeight="600">
              {v}V VEE
            </text>
          </g>
        );
      }

      case 'ground': {
        return (
          <g>
            {/* Lead down */}
            <line x1="0" y1="-15" x2="0" y2="0" stroke="#EDF1E8" strokeWidth="2" />
            {/* 3 descending ground bars */}
            <line x1="-16" y1="0" x2="16" y2="0" stroke="#EDF1E8" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="-10" y1="5" x2="10" y2="5" stroke="#EDF1E8" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="-4" y1="10" x2="4" y2="10" stroke="#EDF1E8" strokeWidth="2.0" strokeLinecap="round" />
            <text x="0" y="22" fill="#9EAF9B" fontSize="8" fontFamily="Spline Sans Mono, monospace" fontWeight="bold" textAnchor="middle">
              GND
            </text>
          </g>
        );
      }

      default:
        return null;
    }
  };

  return (
    <g
      id={`comp-${component.id}`}
      transform={`translate(${component.x}, ${component.y}) rotate(${rotation})`}
      className="cursor-move select-none"
    >
      {/* Selection Halo in Pad Gold */}
      {isSelected && (
        <rect
          x="-50"
          y="-45"
          width="100"
          height="90"
          rx="3"
          fill="rgba(201, 162, 75, 0.08)"
          stroke="#C9A24B"
          strokeWidth="1.8"
          strokeDasharray="4 3"
        />
      )}

      {/* Render component SVG body */}
      {renderSymbol()}
    </g>
  );
};
