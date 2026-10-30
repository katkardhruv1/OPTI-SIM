import { cleanFloat, formatCapacitance, formatFrequency, formatResistance, formatVoltage } from './formatters';
import {
  simulateLinearOpAmp,
  simulateSummingOpAmp,
  simulateDifferentialOpAmp,
  simulateCalculusWaveform,
  simulateRectifierWaveform,
  generateTimeArray,
  evaluateWaveformAtTime,
  SignalWaveformType
} from './waveformEngine';
import { calculateCutoffFrequency } from '../calculations/activeFilter';

/**
 * ============================================================================
 * OPTI-SIM PDF ASSET RENDERER
 * High-Resolution, Print-Friendly Vector SVG Schematics & Simulation Graphs
 * Designed for professional electronics engineering laboratory practical records.
 * ============================================================================
 */

// Helper to sanitize strings inside SVG XML
function escapeXml(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Renders an IEEE/IEC zigzag resistor symbol between (x1, y1) and (x2, y2)
 */
function renderResistorZigzag(x1: number, y1: number, x2: number, y2: number, stroke: string = '#0f172a', strokeWidth: number = 2): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 10) return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;

  const ux = dx / len;
  const uy = dy / len;
  const perpX = -uy;
  const perpY = ux;

  // Resistor geometry: 15% lead, 70% zigzag (6 peaks), 15% lead
  const lead = len * 0.15;
  const bodyLen = len - 2 * lead;
  const segs = 6;
  const segStep = bodyLen / segs;
  const amp = 8; // peak displacement

  let path = `M ${x1} ${y1} L ${x1 + ux * lead} ${y1 + uy * lead}`;
  for (let i = 0; i < segs; i++) {
    const frac = lead + (i + 0.5) * segStep;
    const sign = i % 2 === 0 ? 1 : -1;
    const px = x1 + ux * frac + perpX * amp * sign;
    const py = y1 + uy * frac + perpY * amp * sign;
    path += ` L ${px} ${py}`;
  }
  path += ` L ${x2 - ux * lead} ${y2 - uy * lead} L ${x2} ${y2}`;

  return `<path d="${path}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" />`;
}

/**
 * Renders standard ground symbol at (x, y) pointing downwards
 */
function renderGround(x: number, y: number, stroke: string = '#0f172a'): string {
  return `
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y + 12}" stroke="${stroke}" stroke-width="2" />
    <line x1="${x - 12}" y1="${y + 12}" x2="${x + 12}" y2="${y + 12}" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" />
    <line x1="${x - 8}" y1="${y + 17}" x2="${x + 8}" y2="${y + 17}" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" />
    <line x1="${x - 4}" y1="${y + 22}" x2="${x + 4}" y2="${y + 22}" stroke="${stroke}" stroke-width="1.4" stroke-linecap="round" />
  `;
}

/**
 * Renders standard capacitor symbol between (x1, y1) and (x2, y2)
 */
function renderCapacitor(x1: number, y1: number, x2: number, y2: number, stroke: string = '#0f172a', strokeWidth: number = 2): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  const perpX = -uy;
  const perpY = ux;

  const mid = len / 2;
  const gap = 3.5;
  const plateLen = 14;

  const p1x = x1 + ux * (mid - gap);
  const p1y = y1 + uy * (mid - gap);
  const p2x = x1 + ux * (mid + gap);
  const p2y = y1 + uy * (mid + gap);

  return `
    <line x1="${x1}" y1="${y1}" x2="${p1x}" y2="${p1y}" stroke="${stroke}" stroke-width="${strokeWidth}" />
    <line x1="${p1x - perpX * plateLen}" y1="${p1y - perpY * plateLen}" x2="${p1x + perpX * plateLen}" y2="${p1y + perpY * plateLen}" stroke="${stroke}" stroke-width="${strokeWidth + 0.5}" stroke-linecap="round" />
    <line x1="${p2x - perpX * plateLen}" y1="${p2y - perpY * plateLen}" x2="${p2x + perpX * plateLen}" y2="${p2y + perpY * plateLen}" stroke="${stroke}" stroke-width="${strokeWidth + 0.5}" stroke-linecap="round" />
    <line x1="${p2x}" y1="${p2y}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" />
  `;
}

/**
 * Renders standard diode symbol pointing from (x1, y1) to (x2, y2)
 */
function renderDiode(x1: number, y1: number, x2: number, y2: number, stroke: string = '#0f172a', strokeWidth: number = 2): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  const perpX = -uy;
  const perpY = ux;

  const mid = len / 2;
  const halfTri = 8;
  const barLen = 10;

  const ax = x1 + ux * (mid - halfTri);
  const ay = y1 + uy * (mid - halfTri);
  const cx = x1 + ux * (mid + halfTri);
  const cy = y1 + uy * (mid + halfTri);

  return `
    <line x1="${x1}" y1="${y1}" x2="${ax}" y2="${ay}" stroke="${stroke}" stroke-width="${strokeWidth}" />
    <polygon points="${ax - perpX * barLen},${ay - perpY * barLen} ${ax + perpX * barLen},${ay + perpY * barLen} ${cx},${cy}" fill="#f1f5f9" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
    <line x1="${cx - perpX * barLen}" y1="${cy - perpY * barLen}" x2="${cx + perpX * barLen}" y2="${cy + perpY * barLen}" stroke="${stroke}" stroke-width="${strokeWidth + 0.5}" stroke-linecap="round" />
    <line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" />
  `;
}

/**
 * Standard op-amp triangle body with terminals
 */
function renderOpAmpBody({
  cx = 440,
  cy = 200,
  w = 120,
  h = 130,
  invertingY = 160,
  nonInvertingY = 240,
  label = 'IC 741 / TL081',
  posVsat = 15,
  negVsat = -15,
  showPowerPins = true
}: {
  cx?: number;
  cy?: number;
  w?: number;
  h?: number;
  invertingY?: number;
  nonInvertingY?: number;
  label?: string;
  posVsat?: number;
  negVsat?: number;
  showPowerPins?: boolean;
}): string {
  const xLeft = cx - w / 2;
  const xApex = cx + w / 2;
  const yTop = cy - h / 2;
  const yBottom = cy + h / 2;

  let powerPins = '';
  if (showPowerPins) {
    powerPins = `
      <!-- +Vsat Supply Pin -->
      <line x1="${cx}" y1="${yTop + 15}" x2="${cx}" y2="${yTop - 25}" stroke="#0f172a" stroke-width="1.8" />
      <text x="${cx}" y="${yTop - 30}" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#047857" text-anchor="middle">+Vsat (+${posVsat}V)</text>
      
      <!-- -Vsat Supply Pin -->
      <line x1="${cx}" y1="${yBottom - 15}" x2="${cx}" y2="${yBottom + 25}" stroke="#0f172a" stroke-width="1.8" />
      <text x="${cx}" y="${yBottom + 38}" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#b91c1c" text-anchor="middle">-Vsat (${negVsat}V)</text>
    `;
  }

  return `
    <!-- Op-Amp Triangle -->
    <polygon points="${xLeft},${yTop} ${xLeft},${yBottom} ${xApex},${cy}" fill="#ffffff" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
    
    <!-- Inverting Terminal (-) -->
    <text x="${xLeft + 14}" y="${invertingY + 5}" font-family="'Courier New', monospace" font-size="20" font-weight="bold" fill="#dc2626">−</text>
    
    <!-- Non-Inverting Terminal (+) -->
    <text x="${xLeft + 14}" y="${nonInvertingY + 5}" font-family="'Courier New', monospace" font-size="18" font-weight="bold" fill="#059669">+</text>
    
    <!-- IC Designator Label -->
    <text x="${cx - 8}" y="${cy + 4}" font-family="Arial, sans-serif" font-size="10.5" font-weight="bold" fill="#475569" text-anchor="middle">${escapeXml(label)}</text>
    
    ${powerPins}
  `;
}

/**
 * ============================================================================
 * 1. CIRCUIT SCHEMATICS (Standalone Print Vector SVG Generator)
 * ============================================================================
 */
export function generateSchematicSvg(circuitId: string, inputs: any = {}, results: any = {}): string {
  const width = 760;
  const height = 380;

  // Background and canvas container
  const headerHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="auto" style="display:block; background:#ffffff; border:1px solid #cbd5e1; border-radius:4px; font-family:Arial, sans-serif;">
      <defs>
        <pattern id="print-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.75" fill="#e2e8f0" />
        </pattern>
      </defs>
      <rect width="${width}" height="${height}" fill="#ffffff" />
      <rect width="${width}" height="${height}" fill="url(#print-grid)" />
  `;
  const footerHtml = `</svg>`;

  const resolvedId = (circuitId === 'nmiet-pcc204-exp02-integrator' || circuitId === 'pes-mcoe-exp03-integrator') ? 'integrator'
                   : (circuitId === 'pes-mcoe-exp03-differentiator') ? 'differentiator'
                   : (circuitId === 'nmiet-ica-exp06-precision-rectifier') ? 'precision-rectifier'
                   : (circuitId === 'nmiet-ica-exp07-active-filters') ? 'low-pass-filter'
                   : (circuitId === 'nmiet-pcc204-exp05-r2r-dac') ? 'dac'
                   : (circuitId === 'nmiet-pcc204-exp06-waveform-generator') ? 'square-wave-generator'
                   : (circuitId === 'pes-mcoe-exp01-inverting-non-inverting') ? 'inverting-amplifier'
                   : (circuitId === 'pes-mcoe-exp02-summing-subtractor') ? 'summing-amplifier'
                   : (circuitId === 'nmiet-pcc204-exp04-voltage-series-feedback') ? 'non-inverting-amplifier'
                   : circuitId;

  switch (resolvedId) {
    case 'inverting-amplifier': {
      const vin = inputs.vin ?? 2;
      const vinUnit = inputs.vinUnit ?? 'V';
      const rin = inputs.rin ?? 10;
      const rinUnit = inputs.rinUnit ?? 'kΩ';
      const rf = inputs.rf ?? 50;
      const rfUnit = inputs.rfUnit ?? 'kΩ';
      const av = results.av !== undefined ? cleanFloat(results.av, 2) : cleanFloat(-(rf / rin), 2);
      const vout = results.vout !== undefined ? cleanFloat(results.vout, 2) : cleanFloat(-(rf / rin) * vin, 2);

      return `
        ${headerHtml}
        <!-- Title Banner -->
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">INVERTING OP-AMP AMPLIFIER SCHEMATIC</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">Topology: Closed-Loop Negative Feedback • Governing Equation: Vout = -(Rf / Rin) × Vin</text>

        <!-- Op-Amp Body -->
        ${renderOpAmpBody({ cx: 450, cy: 200, invertingY: 160, nonInvertingY: 240 })}

        <!-- Input Source Vin -->
        <circle cx="80" cy="160" r="16" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <path d="M 72 160 Q 76 153 80 160 T 88 160" fill="none" stroke="#0f172a" stroke-width="1.8" />
        <line x1="80" y1="176" x2="80" y2="210" stroke="#0f172a" stroke-width="2" />
        ${renderGround(80, 210)}
        <text x="80" y="136" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">Vin (${vin} ${vinUnit})</text>

        <!-- Vin wire to Rin -->
        <line x1="96" y1="160" x2="160" y2="160" stroke="#0f172a" stroke-width="2" />

        <!-- Input Resistor Rin -->
        ${renderResistorZigzag(160, 160, 260, 160)}
        <text x="210" y="142" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Rin = ${rin} ${rinUnit}</text>

        <!-- Wire to inverting input & Summing Junction Node V- -->
        <line x1="260" y1="160" x2="390" y2="160" stroke="#0f172a" stroke-width="2" />
        <circle cx="310" cy="160" r="4" fill="#0f172a" />
        <text x="310" y="148" font-size="9.5" fill="#64748b" text-anchor="middle">Virtual Ground (0V)</text>

        <!-- Feedback Loop Rf -->
        <line x1="310" y1="160" x2="310" y2="90" stroke="#0f172a" stroke-width="2" />
        <line x1="310" y1="90" x2="380" y2="90" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(380, 90, 480, 90)}
        <text x="430" y="75" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Rf = ${rf} ${rfUnit}</text>
        <line x1="480" y1="90" x2="550" y2="90" stroke="#0f172a" stroke-width="2" />
        <line x1="550" y1="90" x2="550" y2="200" stroke="#0f172a" stroke-width="2" />

        <!-- Non-Inverting Terminal Grounded -->
        <line x1="390" y1="240" x2="350" y2="240" stroke="#0f172a" stroke-width="2" />
        <line x1="350" y1="240" x2="350" y2="270" stroke="#0f172a" stroke-width="2" />
        ${renderGround(350, 270)}
        <text x="350" y="232" font-size="9.5" fill="#047857" text-anchor="middle">V+ = 0V</text>

        <!-- Output Output Node Vout -->
        <line x1="510" y1="200" x2="650" y2="200" stroke="#0f172a" stroke-width="2" />
        <circle cx="550" cy="200" r="4" fill="#0f172a" />
        <circle cx="650" cy="200" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="650" y="180" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Vout = ${vout} V</text>

        <!-- Parameter Status Box -->
        <rect x="520" y="295" width="210" height="65" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
        <text x="532" y="315" font-size="10.5" font-weight="bold" fill="#0f172a">Active Calculated Gain:</text>
        <text x="532" y="332" font-size="12" font-weight="bold" fill="#0369a1">Av = -(Rf / Rin) = ${av}</text>
        <text x="532" y="348" font-size="10" fill="#64748b">Phase Shift: 180° Inversion</text>
        ${footerHtml}
      `;
    }

    case 'non-inverting-amplifier': {
      const vin = inputs.vin ?? 1;
      const vinUnit = inputs.vinUnit ?? 'V';
      const r1 = inputs.r1 ?? 10;
      const r1Unit = inputs.r1Unit ?? 'kΩ';
      const rf = inputs.rf ?? 90;
      const rfUnit = inputs.rfUnit ?? 'kΩ';
      const av = results.av !== undefined ? cleanFloat(results.av, 2) : cleanFloat(1 + rf / r1, 2);
      const vout = results.vout !== undefined ? cleanFloat(results.vout, 2) : cleanFloat((1 + rf / r1) * vin, 2);

      return `
        ${headerHtml}
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">NON-INVERTING OP-AMP AMPLIFIER SCHEMATIC</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">Topology: Non-Inverting Voltage Follower / Gain Stage • Governing Equation: Vout = (1 + Rf / R1) × Vin</text>

        ${renderOpAmpBody({ cx: 450, cy: 200, invertingY: 160, nonInvertingY: 240 })}

        <!-- Input Source Vin to Non-Inverting Pin (+) -->
        <circle cx="80" cy="240" r="16" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <path d="M 72 240 Q 76 233 80 240 T 88 240" fill="none" stroke="#0f172a" stroke-width="1.8" />
        <line x1="80" y1="256" x2="80" y2="285" stroke="#0f172a" stroke-width="2" />
        ${renderGround(80, 285)}
        <text x="80" y="215" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">Vin (${vin} ${vinUnit})</text>
        <line x1="96" y1="240" x2="390" y2="240" stroke="#0f172a" stroke-width="2" />
        <circle cx="390" cy="240" r="3.5" fill="#0f172a" />

        <!-- Inverting Node Junction & R1 to Ground -->
        <line x1="390" y1="160" x2="300" y2="160" stroke="#0f172a" stroke-width="2" />
        <circle cx="300" cy="160" r="4" fill="#0f172a" />
        <line x1="300" y1="160" x2="300" y2="200" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(300, 200, 300, 280)}
        <text x="245" y="245" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="end">R1 = ${r1} ${r1Unit}</text>
        <line x1="300" y1="280" x2="300" y2="300" stroke="#0f172a" stroke-width="2" />
        ${renderGround(300, 300)}

        <!-- Feedback Loop Rf -->
        <line x1="300" y1="160" x2="300" y2="90" stroke="#0f172a" stroke-width="2" />
        <line x1="300" y1="90" x2="370" y2="90" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(370, 90, 470, 90)}
        <text x="420" y="75" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Rf = ${rf} ${rfUnit}</text>
        <line x1="470" y1="90" x2="550" y2="90" stroke="#0f172a" stroke-width="2" />
        <line x1="550" y1="90" x2="550" y2="200" stroke="#0f172a" stroke-width="2" />

        <!-- Output Vout -->
        <line x1="510" y1="200" x2="650" y2="200" stroke="#0f172a" stroke-width="2" />
        <circle cx="550" cy="200" r="4" fill="#0f172a" />
        <circle cx="650" cy="200" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="650" y="180" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Vout = ${vout} V</text>

        <!-- Status Card -->
        <rect x="520" y="295" width="210" height="65" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
        <text x="532" y="315" font-size="10.5" font-weight="bold" fill="#0f172a">Closed-Loop Non-Inverting Gain:</text>
        <text x="532" y="332" font-size="12" font-weight="bold" fill="#047857">Av = 1 + (Rf / R1) = ${av}</text>
        <text x="532" y="348" font-size="10" fill="#64748b">Phase Shift: 0° (In Phase)</text>
        ${footerHtml}
      `;
    }

    case 'voltage-follower': {
      const vin = inputs.vin ?? 5;
      const vinUnit = inputs.vinUnit ?? 'V';
      const vout = results.vout !== undefined ? cleanFloat(results.vout, 2) : cleanFloat(vin, 2);

      return `
        ${headerHtml}
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">VOLTAGE FOLLOWER (UNITY-GAIN BUFFER) SCHEMATIC</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">Topology: Direct 100% Negative Feedback • Governing Equation: Vout = Vin (Av = 1.0)</text>

        ${renderOpAmpBody({ cx: 450, cy: 200, invertingY: 160, nonInvertingY: 240 })}

        <!-- Input Vin -->
        <circle cx="100" cy="240" r="16" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <path d="M 92 240 Q 96 233 100 240 T 108 240" fill="none" stroke="#0f172a" stroke-width="1.8" />
        <line x1="100" y1="256" x2="100" y2="285" stroke="#0f172a" stroke-width="2" />
        ${renderGround(100, 285)}
        <text x="100" y="215" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">Vin (${vin} ${vinUnit})</text>
        <line x1="116" y1="240" x2="390" y2="240" stroke="#0f172a" stroke-width="2" />

        <!-- 100% Negative Feedback Direct Loop -->
        <line x1="390" y1="160" x2="320" y2="160" stroke="#0f172a" stroke-width="2" />
        <line x1="320" y1="160" x2="320" y2="100" stroke="#0f172a" stroke-width="2" />
        <line x1="320" y1="100" x2="550" y2="100" stroke="#0f172a" stroke-width="2" />
        <line x1="550" y1="100" x2="550" y2="200" stroke="#0f172a" stroke-width="2" />
        <text x="435" y="88" font-size="10.5" font-weight="bold" fill="#047857" text-anchor="middle">Direct Feedback Wire (Rf = 0 Ω)</text>

        <!-- Output Vout -->
        <line x1="510" y1="200" x2="650" y2="200" stroke="#0f172a" stroke-width="2" />
        <circle cx="550" cy="200" r="4" fill="#0f172a" />
        <circle cx="650" cy="200" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="650" y="180" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Vout = ${vout} V</text>

        <!-- Status Card -->
        <rect x="490" y="285" width="240" height="70" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
        <text x="502" y="305" font-size="10.5" font-weight="bold" fill="#0f172a">Buffer Performance Characteristics:</text>
        <text x="502" y="322" font-size="11" font-weight="bold" fill="#047857">Av = 1.00 • Zin → ∞ • Zout → 0 Ω</text>
        <text x="502" y="340" font-size="10" fill="#64748b">Ideal Impedance Isolation &amp; Loading Protection</text>
        ${footerHtml}
      `;
    }

    case 'summing-amplifier': {
      const rf = inputs.rf ?? 10;
      const rfUnit = inputs.rfUnit ?? 'kΩ';
      const ch1 = inputs.channels?.[0]?.voltage ?? 1;
      const ch2 = inputs.channels?.[1]?.voltage ?? 2;
      const r1 = inputs.channels?.[0]?.resistance ?? 10;
      const r2 = inputs.channels?.[1]?.resistance ?? 10;
      const vout = results.vout !== undefined ? cleanFloat(results.vout, 2) : cleanFloat(-(ch1 + ch2), 2);

      return `
        ${headerHtml}
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">SUMMING AMPLIFIER (INVERTING ADDER) SCHEMATIC</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">Governing Equation: Vout = -Rf × [ (V1 / R1) + (V2 / R2) + ... ]</text>

        ${renderOpAmpBody({ cx: 470, cy: 210, invertingY: 170, nonInvertingY: 250 })}

        <!-- Channel 1 Input -->
        <text x="40" y="125" font-size="11" font-weight="bold" fill="#0369a1">V1 = ${ch1} V</text>
        <circle cx="100" cy="120" r="14" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <path d="M 94 120 Q 97 114 100 120 T 106 120" fill="none" stroke="#0f172a" stroke-width="1.8" />
        <line x1="114" y1="120" x2="160" y2="120" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(160, 120, 260, 120)}
        <text x="210" y="105" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">R1 = ${r1} kΩ</text>
        <line x1="260" y1="120" x2="340" y2="120" stroke="#0f172a" stroke-width="2" />

        <!-- Channel 2 Input -->
        <text x="40" y="195" font-size="11" font-weight="bold" fill="#0369a1">V2 = ${ch2} V</text>
        <circle cx="100" cy="190" r="14" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <path d="M 94 190 Q 97 184 100 190 T 106 190" fill="none" stroke="#0f172a" stroke-width="1.8" />
        <line x1="114" y1="190" x2="160" y2="190" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(160, 190, 260, 190)}
        <text x="210" y="175" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">R2 = ${r2} kΩ</text>
        <line x1="260" y1="190" x2="340" y2="190" stroke="#0f172a" stroke-width="2" />

        <!-- Summing Node -->
        <line x1="340" y1="120" x2="340" y2="190" stroke="#0f172a" stroke-width="2" />
        <circle cx="340" cy="170" r="4.5" fill="#0f172a" />
        <line x1="340" y1="170" x2="410" y2="170" stroke="#0f172a" stroke-width="2" />
        <text x="340" y="210" font-size="9" fill="#64748b" text-anchor="middle">Virtual Ground Node</text>

        <!-- Feedback Rf -->
        <line x1="340" y1="170" x2="340" y2="65" stroke="#0f172a" stroke-width="2" />
        <line x1="340" y1="65" x2="400" y2="65" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(400, 65, 500, 65)}
        <text x="450" y="50" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Rf = ${rf} ${rfUnit}</text>
        <line x1="500" y1="65" x2="570" y2="65" stroke="#0f172a" stroke-width="2" />
        <line x1="570" y1="65" x2="570" y2="210" stroke="#0f172a" stroke-width="2" />

        <!-- Non-inverting Grounded -->
        <line x1="410" y1="250" x2="370" y2="250" stroke="#0f172a" stroke-width="2" />
        <line x1="370" y1="250" x2="370" y2="280" stroke="#0f172a" stroke-width="2" />
        ${renderGround(370, 280)}

        <!-- Output Vout -->
        <line x1="530" y1="210" x2="660" y2="210" stroke="#0f172a" stroke-width="2" />
        <circle cx="570" cy="210" r="4" fill="#0f172a" />
        <circle cx="660" cy="210" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="660" y="190" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Vout = ${vout} V</text>
        ${footerHtml}
      `;
    }

    case 'differential-amplifier': {
      const v1 = inputs.v1 ?? 2;
      const v2 = inputs.v2 ?? 1;
      const r1 = inputs.r1 ?? 10;
      const r2 = inputs.r2 ?? 10;
      const rf = inputs.rf ?? 20;
      const rg = inputs.rg ?? 20;
      const vout = results.vout !== undefined ? cleanFloat(results.vout, 2) : cleanFloat((rf / r1) * (v2 - v1), 2);

      return `
        ${headerHtml}
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">DIFFERENTIAL AMPLIFIER (SUBTRACTOR) SCHEMATIC</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">Balanced Resistor Bridge • Governing Equation: Vout = (Rf / R1) × (V2 - V1)</text>

        ${renderOpAmpBody({ cx: 470, cy: 210, invertingY: 170, nonInvertingY: 250 })}

        <!-- Input V1 (Inverting Input Side) -->
        <text x="40" y="145" font-size="11" font-weight="bold" fill="#0369a1">V1 = ${v1} V</text>
        <circle cx="100" cy="140" r="14" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <line x1="114" y1="140" x2="160" y2="140" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(160, 140, 260, 140)}
        <text x="210" y="125" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">R1 = ${r1} kΩ</text>
        <line x1="260" y1="140" x2="410" y2="170" stroke="#0f172a" stroke-width="2" />
        <circle cx="340" cy="155" r="4" fill="#0f172a" />

        <!-- Feedback Rf across Inverting Terminal -->
        <line x1="340" y1="155" x2="340" y2="80" stroke="#0f172a" stroke-width="2" />
        <line x1="340" y1="80" x2="400" y2="80" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(400, 80, 500, 80)}
        <text x="450" y="65" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Rf = ${rf} kΩ</text>
        <line x1="500" y1="80" x2="570" y2="80" stroke="#0f172a" stroke-width="2" />
        <line x1="570" y1="80" x2="570" y2="210" stroke="#0f172a" stroke-width="2" />

        <!-- Input V2 (Non-Inverting Input Side) -->
        <text x="40" y="275" font-size="11" font-weight="bold" fill="#0369a1">V2 = ${v2} V</text>
        <circle cx="100" cy="270" r="14" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <line x1="114" y1="270" x2="160" y2="270" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(160, 270, 260, 270)}
        <text x="210" y="255" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">R2 = ${r2} kΩ</text>
        <line x1="260" y1="270" x2="410" y2="250" stroke="#0f172a" stroke-width="2" />
        <circle cx="340" cy="260" r="4" fill="#0f172a" />

        <!-- Ground Resistor Rg on Non-Inverting Terminal -->
        <line x1="340" y1="260" x2="340" y2="290" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(340, 290, 340, 340)}
        <text x="385" y="315" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Rg = ${rg} kΩ</text>
        <line x1="340" y1="340" x2="340" y2="350" stroke="#0f172a" stroke-width="2" />
        ${renderGround(340, 350)}

        <!-- Output Vout -->
        <line x1="530" y1="210" x2="660" y2="210" stroke="#0f172a" stroke-width="2" />
        <circle cx="570" cy="210" r="4" fill="#0f172a" />
        <circle cx="660" cy="210" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="660" y="190" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Vout = ${vout} V</text>
        ${footerHtml}
      `;
    }

    case 'integrator': {
      const vin = inputs.vin ?? 1;
      const vinUnit = inputs.vinUnit ?? 'V';
      const r = inputs.r ?? 10;
      const rUnit = inputs.rUnit ?? 'kΩ';
      const c = inputs.c ?? 0.01;
      const cUnit = inputs.cUnit ?? 'µF';

      return `
        ${headerHtml}
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">PRACTICAL OP-AMP INTEGRATOR SCHEMATIC</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">Governing Equation: Vout(t) = -(1 / RC) ∫ Vin(t) dt + Vout(0)</text>

        ${renderOpAmpBody({ cx: 450, cy: 200, invertingY: 160, nonInvertingY: 240 })}

        <!-- Input Vin -->
        <circle cx="80" cy="160" r="16" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <text x="80" y="164" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">Vin</text>
        <line x1="80" y1="176" x2="80" y2="210" stroke="#0f172a" stroke-width="2" />
        ${renderGround(80, 210)}
        <text x="80" y="136" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">${vin} ${vinUnit}</text>
        <line x1="96" y1="160" x2="160" y2="160" stroke="#0f172a" stroke-width="2" />

        <!-- Input Resistor R -->
        ${renderResistorZigzag(160, 160, 260, 160)}
        <text x="210" y="142" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">R = ${r} ${rUnit}</text>

        <!-- Node to inverting pin -->
        <line x1="260" y1="160" x2="390" y2="160" stroke="#0f172a" stroke-width="2" />
        <circle cx="310" cy="160" r="4" fill="#0f172a" />

        <!-- Feedback Capacitor C -->
        <line x1="310" y1="160" x2="310" y2="90" stroke="#0f172a" stroke-width="2" />
        <line x1="310" y1="90" x2="385" y2="90" stroke="#0f172a" stroke-width="2" />
        ${renderCapacitor(385, 90, 475, 90)}
        <text x="430" y="70" font-size="11" font-weight="bold" fill="#b45309" text-anchor="middle">C = ${c} ${cUnit}</text>
        <line x1="475" y1="90" x2="550" y2="90" stroke="#0f172a" stroke-width="2" />
        <line x1="550" y1="90" x2="550" y2="200" stroke="#0f172a" stroke-width="2" />

        <!-- Grounded Non-Inverting Terminal -->
        <line x1="390" y1="240" x2="350" y2="240" stroke="#0f172a" stroke-width="2" />
        <line x1="350" y1="240" x2="350" y2="270" stroke="#0f172a" stroke-width="2" />
        ${renderGround(350, 270)}

        <!-- Output Vout -->
        <line x1="510" y1="200" x2="650" y2="200" stroke="#0f172a" stroke-width="2" />
        <circle cx="550" cy="200" r="4" fill="#0f172a" />
        <circle cx="650" cy="200" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="650" y="180" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Integrated Vout(t)</text>

        <!-- Info Box -->
        <rect x="490" y="285" width="240" height="70" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
        <text x="502" y="305" font-size="10.5" font-weight="bold" fill="#0f172a">Integration Time Constant:</text>
        <text x="502" y="322" font-size="11" font-weight="bold" fill="#0369a1">τ = RC = ${cleanFloat(r * 1e3 * c * 1e-6, 5)} s</text>
        <text x="502" y="340" font-size="10" fill="#64748b">Square Wave in → Triangular Wave out</text>
        ${footerHtml}
      `;
    }

    case 'differentiator': {
      const vin = inputs.vin ?? 1;
      const vinUnit = inputs.vinUnit ?? 'V';
      const r = inputs.r ?? 10;
      const rUnit = inputs.rUnit ?? 'kΩ';
      const c = inputs.c ?? 0.01;
      const cUnit = inputs.cUnit ?? 'µF';

      return `
        ${headerHtml}
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">PRACTICAL OP-AMP DIFFERENTIATOR SCHEMATIC</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">Governing Equation: Vout(t) = -Rf × C × (dVin / dt)</text>

        ${renderOpAmpBody({ cx: 450, cy: 200, invertingY: 160, nonInvertingY: 240 })}

        <!-- Input Vin -->
        <circle cx="80" cy="160" r="16" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <text x="80" y="164" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">Vin</text>
        <line x1="80" y1="176" x2="80" y2="210" stroke="#0f172a" stroke-width="2" />
        ${renderGround(80, 210)}
        <text x="80" y="136" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">${vin} ${vinUnit}</text>
        <line x1="96" y1="160" x2="160" y2="160" stroke="#0f172a" stroke-width="2" />

        <!-- Input Series Capacitor C -->
        ${renderCapacitor(160, 160, 260, 160)}
        <text x="210" y="140" font-size="11" font-weight="bold" fill="#b45309" text-anchor="middle">C = ${c} ${cUnit}</text>

        <!-- Node to inverting pin -->
        <line x1="260" y1="160" x2="390" y2="160" stroke="#0f172a" stroke-width="2" />
        <circle cx="310" cy="160" r="4" fill="#0f172a" />

        <!-- Feedback Resistor Rf -->
        <line x1="310" y1="160" x2="310" y2="90" stroke="#0f172a" stroke-width="2" />
        <line x1="310" y1="90" x2="380" y2="90" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(380, 90, 480, 90)}
        <text x="430" y="75" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Rf = ${r} ${rUnit}</text>
        <line x1="480" y1="90" x2="550" y2="90" stroke="#0f172a" stroke-width="2" />
        <line x1="550" y1="90" x2="550" y2="200" stroke="#0f172a" stroke-width="2" />

        <!-- Non-Inverting Grounded -->
        <line x1="390" y1="240" x2="350" y2="240" stroke="#0f172a" stroke-width="2" />
        <line x1="350" y1="240" x2="350" y2="270" stroke="#0f172a" stroke-width="2" />
        ${renderGround(350, 270)}

        <!-- Output Vout -->
        <line x1="510" y1="200" x2="650" y2="200" stroke="#0f172a" stroke-width="2" />
        <circle cx="550" cy="200" r="4" fill="#0f172a" />
        <circle cx="650" cy="200" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="650" y="180" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Differentiated Vout(t)</text>
        ${footerHtml}
      `;
    }

    case 'low-pass-filter': {
      const r = inputs.r ?? 10;
      const rUnit = inputs.rUnit ?? 'kΩ';
      const c = inputs.c ?? 0.01;
      const cUnit = inputs.cUnit ?? 'µF';
      const fc = results.fc !== undefined ? cleanFloat(results.fc, 2) : cleanFloat(1 / (2 * Math.PI * r * 1e3 * c * 1e-6), 2);

      return `
        ${headerHtml}
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">FIRST-ORDER ACTIVE LOW-PASS FILTER SCHEMATIC</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">RC Low-Pass Filter Network + Voltage Follower Buffer • fc = 1 / (2πRC)</text>

        ${renderOpAmpBody({ cx: 470, cy: 200, invertingY: 160, nonInvertingY: 240 })}

        <!-- Input Vin -->
        <circle cx="80" cy="240" r="16" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <text x="80" y="244" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">Vin</text>
        <line x1="80" y1="256" x2="80" y2="285" stroke="#0f172a" stroke-width="2" />
        ${renderGround(80, 285)}
        <line x1="96" y1="240" x2="160" y2="240" stroke="#0f172a" stroke-width="2" />

        <!-- Series Resistor R -->
        ${renderResistorZigzag(160, 240, 260, 240)}
        <text x="210" y="222" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">R = ${r} ${rUnit}</text>
        <line x1="260" y1="240" x2="410" y2="240" stroke="#0f172a" stroke-width="2" />
        <circle cx="310" cy="240" r="4" fill="#0f172a" />

        <!-- Shunt Capacitor C to GND -->
        <line x1="310" y1="240" x2="310" y2="280" stroke="#0f172a" stroke-width="2" />
        ${renderCapacitor(310, 280, 310, 330)}
        <text x="360" y="310" font-size="11" font-weight="bold" fill="#b45309" text-anchor="middle">C = ${c} ${cUnit}</text>
        <line x1="310" y1="330" x2="310" y2="345" stroke="#0f172a" stroke-width="2" />
        ${renderGround(310, 345)}

        <!-- Op-Amp Unity Feedback Buffer Loop -->
        <line x1="410" y1="160" x2="360" y2="160" stroke="#0f172a" stroke-width="2" />
        <line x1="360" y1="160" x2="360" y2="100" stroke="#0f172a" stroke-width="2" />
        <line x1="360" y1="100" x2="570" y2="100" stroke="#0f172a" stroke-width="2" />
        <line x1="570" y1="100" x2="570" y2="200" stroke="#0f172a" stroke-width="2" />

        <!-- Output Vout -->
        <line x1="530" y1="200" x2="660" y2="200" stroke="#0f172a" stroke-width="2" />
        <circle cx="570" cy="200" r="4" fill="#0f172a" />
        <circle cx="660" cy="200" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="660" y="180" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Filtered Vout</text>

        <!-- Parameter Box -->
        <rect x="490" y="285" width="240" height="70" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
        <text x="502" y="305" font-size="10.5" font-weight="bold" fill="#0f172a">Cutoff Frequency (fc):</text>
        <text x="502" y="322" font-size="12" font-weight="bold" fill="#047857">fc = 1 / (2πRC) = ${fc} Hz</text>
        <text x="502" y="340" font-size="10" fill="#64748b">Roll-off Rate: -20 dB/decade (-6 dB/octave)</text>
        ${footerHtml}
      `;
    }

    case 'high-pass-filter': {
      const r = inputs.r ?? 10;
      const rUnit = inputs.rUnit ?? 'kΩ';
      const c = inputs.c ?? 0.01;
      const cUnit = inputs.cUnit ?? 'µF';
      const fc = results.fc !== undefined ? cleanFloat(results.fc, 2) : cleanFloat(1 / (2 * Math.PI * r * 1e3 * c * 1e-6), 2);

      return `
        ${headerHtml}
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">FIRST-ORDER ACTIVE HIGH-PASS FILTER SCHEMATIC</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">CR High-Pass Filter Network + Voltage Follower Buffer • fc = 1 / (2πRC)</text>

        ${renderOpAmpBody({ cx: 470, cy: 200, invertingY: 160, nonInvertingY: 240 })}

        <!-- Input Vin -->
        <circle cx="80" cy="240" r="16" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <text x="80" y="244" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">Vin</text>
        <line x1="80" y1="256" x2="80" y2="285" stroke="#0f172a" stroke-width="2" />
        ${renderGround(80, 285)}
        <line x1="96" y1="240" x2="160" y2="240" stroke="#0f172a" stroke-width="2" />

        <!-- Series Capacitor C -->
        ${renderCapacitor(160, 240, 260, 240)}
        <text x="210" y="220" font-size="11" font-weight="bold" fill="#b45309" text-anchor="middle">C = ${c} ${cUnit}</text>
        <line x1="260" y1="240" x2="410" y2="240" stroke="#0f172a" stroke-width="2" />
        <circle cx="310" cy="240" r="4" fill="#0f172a" />

        <!-- Shunt Resistor R to GND -->
        <line x1="310" y1="240" x2="310" y2="280" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(310, 280, 310, 330)}
        <text x="360" y="310" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">R = ${r} ${rUnit}</text>
        <line x1="310" y1="330" x2="310" y2="345" stroke="#0f172a" stroke-width="2" />
        ${renderGround(310, 345)}

        <!-- Op-Amp Unity Feedback Buffer Loop -->
        <line x1="410" y1="160" x2="360" y2="160" stroke="#0f172a" stroke-width="2" />
        <line x1="360" y1="160" x2="360" y2="100" stroke="#0f172a" stroke-width="2" />
        <line x1="360" y1="100" x2="570" y2="100" stroke="#0f172a" stroke-width="2" />
        <line x1="570" y1="100" x2="570" y2="200" stroke="#0f172a" stroke-width="2" />

        <!-- Output Vout -->
        <line x1="530" y1="200" x2="660" y2="200" stroke="#0f172a" stroke-width="2" />
        <circle cx="570" cy="200" r="4" fill="#0f172a" />
        <circle cx="660" cy="200" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="660" y="180" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Filtered Vout</text>

        <!-- Parameter Box -->
        <rect x="490" y="285" width="240" height="70" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
        <text x="502" y="305" font-size="10.5" font-weight="bold" fill="#0f172a">High-Pass Cutoff (fc):</text>
        <text x="502" y="322" font-size="12" font-weight="bold" fill="#047857">fc = 1 / (2πRC) = ${fc} Hz</text>
        <text x="502" y="340" font-size="10" fill="#64748b">Rejects DC/Low Frequencies • Passes High Frequencies</text>
        ${footerHtml}
      `;
    }

    case 'precision-rectifier': {
      return `
        ${headerHtml}
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">PRECISION HALF-WAVE RECTIFIER (SUPERDIODE) SCHEMATIC</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">Eliminates 0.7V Diode Knee Voltage via High Op-Amp Open-Loop Gain</text>

        ${renderOpAmpBody({ cx: 400, cy: 200, invertingY: 160, nonInvertingY: 240 })}

        <!-- Input Vin to Non-Inverting (+) -->
        <circle cx="100" cy="240" r="16" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <text x="100" y="244" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">Vin</text>
        <line x1="100" y1="256" x2="100" y2="285" stroke="#0f172a" stroke-width="2" />
        ${renderGround(100, 285)}
        <line x1="116" y1="240" x2="340" y2="240" stroke="#0f172a" stroke-width="2" />

        <!-- Op-Amp output through Diode D1 -->
        <line x1="460" y1="200" x2="490" y2="200" stroke="#0f172a" stroke-width="2" />
        ${renderDiode(490, 200, 560, 200)}
        <text x="525" y="180" font-size="11" font-weight="bold" fill="#b45309" text-anchor="middle">D1 (1N4148)</text>

        <!-- Feedback from cathode back to inverting pin (-) -->
        <circle cx="560" cy="200" r="4" fill="#0f172a" />
        <line x1="560" y1="200" x2="560" y2="100" stroke="#0f172a" stroke-width="2" />
        <line x1="560" y1="100" x2="280" y2="100" stroke="#0f172a" stroke-width="2" />
        <line x1="280" y1="100" x2="280" y2="160" stroke="#0f172a" stroke-width="2" />
        <line x1="280" y1="160" x2="340" y2="160" stroke="#0f172a" stroke-width="2" />

        <!-- Load Resistor RL to GND -->
        <line x1="560" y1="200" x2="560" y2="240" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(560, 240, 560, 310)}
        <text x="610" y="275" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">RL = 10 kΩ</text>
        <line x1="560" y1="310" x2="560" y2="330" stroke="#0f172a" stroke-width="2" />
        ${renderGround(560, 330)}

        <!-- Output Terminal -->
        <line x1="560" y1="200" x2="670" y2="200" stroke="#0f172a" stroke-width="2" />
        <circle cx="670" cy="200" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="670" y="180" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Vout = max(Vin, 0)</text>
        ${footerHtml}
      `;
    }

    case 'comparator': {
      const vref = inputs.vref ?? 1;
      const vrefUnit = inputs.vrefUnit ?? 'V';
      const type = inputs.comparatorType ?? 'non-inverting';

      return `
        ${headerHtml}
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">OPEN-LOOP OP-AMP VOLTAGE COMPARATOR SCHEMATIC</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">Mode: ${type === 'inverting' ? 'Inverting' : 'Non-Inverting'} Voltage Comparator • Infinite Open-Loop Gain Switching</text>

        ${renderOpAmpBody({ cx: 450, cy: 200, invertingY: 160, nonInvertingY: 240 })}

        <!-- Inverting and Non-inverting Inputs based on Mode -->
        ${type === 'non-inverting' ? `
          <!-- Vin on Non-Inverting (+) -->
          <circle cx="100" cy="240" r="16" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
          <text x="100" y="244" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">Vin</text>
          <line x1="116" y1="240" x2="390" y2="240" stroke="#0f172a" stroke-width="2" />
          <text x="100" y="215" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">Analog Signal Vin</text>

          <!-- Vref on Inverting (-) -->
          <circle cx="100" cy="160" r="16" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
          <text x="100" y="164" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">Vref</text>
          <line x1="116" y1="160" x2="390" y2="160" stroke="#0f172a" stroke-width="2" />
          <text x="100" y="135" font-size="11" font-weight="bold" fill="#b45309" text-anchor="middle">Threshold Vref = ${vref} ${vrefUnit}</text>
        ` : `
          <!-- Vin on Inverting (-) -->
          <circle cx="100" cy="160" r="16" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
          <text x="100" y="164" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">Vin</text>
          <line x1="116" y1="160" x2="390" y2="160" stroke="#0f172a" stroke-width="2" />
          <text x="100" y="135" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">Analog Signal Vin</text>

          <!-- Vref on Non-Inverting (+) -->
          <circle cx="100" cy="240" r="16" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
          <text x="100" y="244" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">Vref</text>
          <line x1="116" y1="240" x2="390" y2="240" stroke="#0f172a" stroke-width="2" />
          <text x="100" y="215" font-size="11" font-weight="bold" fill="#b45309" text-anchor="middle">Threshold Vref = ${vref} ${vrefUnit}</text>
        `}

        <!-- Output Vout -->
        <line x1="510" y1="200" x2="650" y2="200" stroke="#0f172a" stroke-width="2" />
        <circle cx="650" cy="200" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="650" y="180" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Switched Vout (±Vsat)</text>
        ${footerHtml}
      `;
    }

    case 'nmiet-pcc204-exp03-schmitt-trigger': {
      // Inverting Op-Amp Schmitt Trigger Practical (NMIET PCC-204 Lab Manual Exp 03)
      // Extracts active simulation parameters (supporting both r1/r2 from manual and r1/rf from simulator).
      let r1Val: number;
      let r1Unit: string;
      let r2Val: number;
      let r2Unit: string;

      if (inputs.rf !== undefined) {
        // OPTI-SIM Simulator parameter convention: rf is feedback, r1 is ground leg
        r1Val = Number(inputs.rf);
        r1Unit = inputs.rfUnit ?? 'kΩ';
        r2Val = Number(inputs.r1 ?? 10);
        r2Unit = inputs.r1Unit ?? 'kΩ';
      } else if (inputs.r2 !== undefined) {
        // College Manual convention: r1 is feedback, r2 is ground leg
        r1Val = Number(inputs.r1 ?? 100);
        r1Unit = inputs.r1Unit ?? 'Ω';
        r2Val = Number(inputs.r2 ?? 4.7);
        r2Unit = inputs.r2Unit ?? 'kΩ';
      } else {
        r1Val = 100;
        r1Unit = 'Ω';
        r2Val = 4.7;
        r2Unit = 'kΩ';
      }

      const r1Ohms = r1Unit === 'kΩ' ? r1Val * 1000 : (r1Unit === 'MΩ' ? r1Val * 1e6 : r1Val);
      const r2Ohms = r2Unit === 'kΩ' ? r2Val * 1000 : (r2Unit === 'MΩ' ? r2Val * 1e6 : r2Val);
      const posVsat = inputs.posVsat !== undefined ? Number(inputs.posVsat) : 2.0;
      const negVsat = inputs.negVsat !== undefined ? Number(inputs.negVsat) : -2.0;
      const vinAmp = inputs.vinAmplitude !== undefined ? Number(inputs.vinAmplitude) : 2.5;
      const r3 = inputs.r3 !== undefined ? Number(inputs.r3) : 100;
      const r3Unit = inputs.r3Unit ?? 'Ω';

      // Check whether active simulation parameters differ from the source manual (R1=100Ω, R2=4.7kΩ, ±2.0V)
      const isAdjustedFromSource = Math.abs(r1Ohms - 100) > 1 || Math.abs(r2Ohms - 4700) > 10 || Math.abs(posVsat - 2.0) > 0.05 || Math.abs(negVsat - (-2.0)) > 0.05;

      // Threshold calculations dynamically derived ONLY from active simulation parameters:
      // Feedback factor beta = R2 / (R1 + R2)
      const beta = r2Ohms / (r1Ohms + r2Ohms);
      const calcUtp = beta * posVsat;
      const calcLtp = beta * negVsat;
      const calcVh = calcUtp - calcLtp;

      const utp = cleanFloat(calcUtp, 3);
      const ltp = cleanFloat(calcLtp, 3);
      const vh = cleanFloat(calcVh, 3);

      return `
        ${headerHtml}
        <!-- Title Banner -->
        <text x="30" y="30" font-size="13" font-weight="bold" fill="#0f172a">INVERTING OP-AMP SCHMITT TRIGGER SCHEMATIC (NMIET EXP 03)</text>
        <text x="30" y="46" font-size="10.5" fill="#64748b">Inverting Configuration • Positive Feedback Voltage Divider R1 &amp; R2 to Pin 3 (+) • Noise Margin V_H = ${vh} V</text>

        <!-- Op-Amp Body (IC 741 / UA741) -->
        ${renderOpAmpBody({ cx: 450, cy: 195, invertingY: 155, nonInvertingY: 235, label: 'IC 741 / UA741', posVsat, negVsat })}

        <!-- Input Source Vin (Pin 2 Inverting Terminal) -->
        <circle cx="80" cy="155" r="16" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <path d="M 72 155 Q 76 148 80 155 T 88 155" fill="none" stroke="#0f172a" stroke-width="1.8" />
        <line x1="80" y1="171" x2="80" y2="200" stroke="#0f172a" stroke-width="2" />
        ${renderGround(80, 200)}
        <text x="80" y="132" font-size="10.5" font-weight="bold" fill="#0369a1" text-anchor="middle">Vin (${vinAmp} V, 1 kHz)</text>

        <!-- Wire from Vin to R3 -->
        <line x1="96" y1="155" x2="150" y2="155" stroke="#0f172a" stroke-width="2" />

        <!-- Input Resistor R3 = 100 Ω -->
        ${renderResistorZigzag(150, 155, 250, 155)}
        <text x="200" y="138" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">R3 = ${r3} ${r3Unit}</text>
        <text x="200" y="174" font-size="9" fill="#64748b" text-anchor="middle">(Input Protection)</text>

        <!-- Wire from R3 to Inverting Terminal Pin 2 (-) -->
        <line x1="250" y1="155" x2="390" y2="155" stroke="#0f172a" stroke-width="2" />
        <text x="375" y="148" font-size="9" fill="#dc2626" font-weight="bold">Pin 2 (-)</text>

        <!-- Positive Feedback Network from Pin 6 to Pin 3 (+) -->
        <!-- Output Tap Node at Pin 6 -->
        <line x1="510" y1="195" x2="650" y2="195" stroke="#0f172a" stroke-width="2" />
        <circle cx="560" cy="195" r="4" fill="#0f172a" />
        <circle cx="650" cy="195" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="650" y="175" font-size="11.5" font-weight="bold" fill="#0369a1" text-anchor="middle">Vout (±${posVsat}V)</text>
        <text x="515" y="188" font-size="9" fill="#047857" font-weight="bold">Pin 6</text>

        <!-- Feedback Loop Wire down from Pin 6 to y = 295 -->
        <line x1="560" y1="195" x2="560" y2="295" stroke="#0f172a" stroke-width="2" />
        <line x1="560" y1="295" x2="480" y2="295" stroke="#0f172a" stroke-width="2" />

        <!-- Feedback Resistor R1 (between Pin 6 and Pin 3) -->
        ${renderResistorZigzag(480, 295, 380, 295)}
        <text x="430" y="280" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">R1 = ${r1Val} ${r1Unit}</text>
        <text x="430" y="315" font-size="9" fill="#64748b" text-anchor="middle">(Feedback Leg)</text>

        <!-- Line from R1 to Summing Node at (300, 295) -->
        <line x1="380" y1="295" x2="300" y2="295" stroke="#0f172a" stroke-width="2" />
        <circle cx="300" cy="295" r="4" fill="#0f172a" />

        <!-- Line up to Non-Inverting Terminal Pin 3 (+) -->
        <line x1="300" y1="295" x2="300" y2="235" stroke="#0f172a" stroke-width="2" />
        <line x1="300" y1="235" x2="390" y2="235" stroke="#0f172a" stroke-width="2" />
        <text x="375" y="248" font-size="9" fill="#059669" font-weight="bold">Pin 3 (+)</text>

        <!-- Resistor R2 to Ground (from node 300, 295 downwards) -->
        <line x1="300" y1="295" x2="300" y2="315" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(300, 315, 300, 355)}
        <text x="245" y="338" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="end">R2 = ${r2Val} ${r2Unit}</text>
        <line x1="300" y1="355" x2="300" y2="362" stroke="#0f172a" stroke-width="2" />
        ${renderGround(300, 362)}

        <!-- Thresholds & Specification Card -->
        <rect x="495" y="42" width="248" height="${isAdjustedFromSource ? 112 : 94}" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
        <text x="507" y="60" font-size="10.5" font-weight="bold" fill="#0f172a">Threshold Calculations (Inverting Topology):</text>
        <text x="507" y="77" font-size="10" fill="#475569">β = R2 / (R1 + R2) = ${cleanFloat(beta, 4)}</text>
        <text x="507" y="94" font-size="11" font-weight="bold" fill="#047857">V_UTP = β × (+Vsat) = +${utp} V</text>
        <text x="507" y="110" font-size="11" font-weight="bold" fill="#b91c1c">V_LTP = β × (-Vsat) = ${ltp} V</text>
        <text x="507" y="124" font-size="9.5" fill="#64748b">VH = V_UTP - V_LTP = ${vh} V (R1=${r1Val} ${r1Unit}, R2=${r2Val} ${r2Unit})</text>
        ${isAdjustedFromSource ? `
          <text x="507" y="142" font-size="8.2" font-weight="bold" fill="#b45309">Note: Simulation parameters adjusted from source manual for ideal modeling.</text>
        ` : ''}
        ${footerHtml}
      `;
    }

    case 'schmitt-trigger': {
      const isInverting = inputs.topology === 'inverting' || inputs.schmittType === 'inverting';
      if (isInverting) {
        // Redirect to authentic inverting Schmitt schematic
        return generateSchematicSvg('nmiet-pcc204-exp03-schmitt-trigger', inputs, results);
      }

      // Standard Non-Inverting Schmitt Trigger using active simulator inputs
      const r1 = inputs.r1 ?? 10;
      const r1Unit = inputs.r1Unit ?? 'kΩ';
      const rf = inputs.rf ?? 20;
      const rfUnit = inputs.rfUnit ?? 'kΩ';
      const posVsat = inputs.posVsat ?? 12;
      const negVsat = inputs.negVsat ?? -12;
      const beta = results.beta !== undefined ? results.beta : (r1 / (r1 + rf));
      const utp = results.utp !== undefined ? cleanFloat(results.utp, 2) : cleanFloat(beta * posVsat, 2);
      const ltp = results.ltp !== undefined ? cleanFloat(results.ltp, 2) : cleanFloat(beta * negVsat, 2);
      const vh = cleanFloat(Number(utp) - Number(ltp), 2);

      return `
        ${headerHtml}
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">NON-INVERTING OP-AMP SCHMITT TRIGGER SCHEMATIC</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">Non-Inverting Configuration • Positive Feedback Loop • V_UTP = +β · (+Vsat), V_LTP = +β · (-Vsat)</text>

        ${renderOpAmpBody({ cx: 450, cy: 200, invertingY: 160, nonInvertingY: 240, posVsat, negVsat })}

        <!-- Inverting Pin (-) Grounded / Reference -->
        <line x1="390" y1="160" x2="320" y2="160" stroke="#0f172a" stroke-width="2" />
        <line x1="320" y1="160" x2="320" y2="190" stroke="#0f172a" stroke-width="2" />
        ${renderGround(320, 190)}
        <text x="320" y="148" font-size="10" fill="#64748b" text-anchor="middle">Reference GND (0V)</text>

        <!-- Input Vin to R1 on Non-Inverting (+) -->
        <circle cx="80" cy="240" r="16" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <text x="80" y="244" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">Vin</text>
        <line x1="96" y1="240" x2="160" y2="240" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(160, 240, 260, 240)}
        <text x="210" y="222" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">R1 = ${r1} ${r1Unit}</text>
        <line x1="260" y1="240" x2="390" y2="240" stroke="#0f172a" stroke-width="2" />
        <circle cx="310" cy="240" r="4" fill="#0f172a" />

        <!-- Positive Feedback Rf from Vout to Non-Inverting Terminal -->
        <line x1="310" y1="240" x2="310" y2="310" stroke="#0f172a" stroke-width="2" />
        <line x1="310" y1="310" x2="380" y2="310" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(380, 310, 480, 310)}
        <text x="430" y="295" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Rf = ${rf} ${rfUnit}</text>
        <line x1="480" y1="310" x2="560" y2="310" stroke="#0f172a" stroke-width="2" />
        <line x1="560" y1="310" x2="560" y2="200" stroke="#0f172a" stroke-width="2" />

        <!-- Output Vout -->
        <line x1="510" y1="200" x2="650" y2="200" stroke="#0f172a" stroke-width="2" />
        <circle cx="560" cy="200" r="4" fill="#0f172a" />
        <circle cx="650" cy="200" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="650" y="180" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Vout (±${posVsat}V)</text>

        <!-- Thresholds Box -->
        <rect x="500" y="45" width="235" height="85" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
        <text x="512" y="65" font-size="10.5" font-weight="bold" fill="#0f172a">Active Simulator Configuration:</text>
        <text x="512" y="82" font-size="10" fill="#475569">β = R1 / (R1 + Rf) = ${cleanFloat(beta, 3)}</text>
        <text x="512" y="99" font-size="11" font-weight="bold" fill="#047857">V_UTP = +${utp} V</text>
        <text x="512" y="114" font-size="11" font-weight="bold" fill="#b91c1c">V_LTP = ${ltp} V</text>
        <text x="512" y="126" font-size="9.5" fill="#64748b">VH = ${vh} V (Noise Margin)</text>
        ${footerHtml}
      `;
    }

    case 'square-wave-generator': {
      const r = inputs.r ?? 10;
      const c = inputs.c ?? 0.01;
      const r1 = inputs.r1 ?? 10;
      const r2 = inputs.r2 ?? 10;
      const posVsat = inputs.posVsat ?? 12;
      const negVsat = inputs.negVsat ?? -12;

      return `
        ${headerHtml}
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">OP-AMP ASTABLE MULTIVIBRATOR (SQUARE WAVE GENERATOR) SCHEMATIC</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">Relaxation Oscillator • Frequency: f = 1 / [ 2RC × ln(1 + 2R1/R2) ]</text>

        ${renderOpAmpBody({ cx: 450, cy: 200, invertingY: 160, nonInvertingY: 240, posVsat, negVsat })}

        <!-- Upper RC timing loop to inverting (-) pin -->
        <line x1="390" y1="160" x2="310" y2="160" stroke="#0f172a" stroke-width="2" />
        <circle cx="310" cy="160" r="4" fill="#0f172a" />
        <line x1="310" y1="160" x2="310" y2="90" stroke="#0f172a" stroke-width="2" />
        <line x1="310" y1="90" x2="380" y2="90" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(380, 90, 480, 90)}
        <text x="430" y="75" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">R = ${r} kΩ</text>
        <line x1="480" y1="90" x2="560" y2="90" stroke="#0f172a" stroke-width="2" />
        <line x1="560" y1="90" x2="560" y2="200" stroke="#0f172a" stroke-width="2" />

        <!-- Timing Capacitor C to GND -->
        <line x1="310" y1="160" x2="250" y2="160" stroke="#0f172a" stroke-width="2" />
        ${renderCapacitor(250, 160, 200, 160)}
        <text x="225" y="140" font-size="11" font-weight="bold" fill="#b45309" text-anchor="middle">C = ${c} µF</text>
        <line x1="200" y1="160" x2="170" y2="160" stroke="#0f172a" stroke-width="2" />
        ${renderGround(170, 160)}

        <!-- Lower Positive Feedback Voltage Divider to (+) Pin -->
        <line x1="390" y1="240" x2="340" y2="240" stroke="#0f172a" stroke-width="2" />
        <circle cx="340" cy="240" r="4" fill="#0f172a" />
        <line x1="340" y1="240" x2="340" y2="290" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(340, 290, 340, 340)}
        <text x="385" y="315" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">R1 = ${r1} kΩ</text>
        <line x1="340" y1="340" x2="340" y2="350" stroke="#0f172a" stroke-width="2" />
        ${renderGround(340, 350)}

        <!-- Feedback R2 from Vout -->
        <line x1="340" y1="240" x2="390" y2="240" stroke="#0f172a" stroke-width="2" />
        <line x1="340" y1="240" x2="340" y2="270" stroke="#0f172a" stroke-width="2" />
        <line x1="340" y1="270" x2="410" y2="270" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(410, 270, 500, 270)}
        <text x="455" y="258" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">R2 = ${r2} kΩ</text>
        <line x1="500" y1="270" x2="560" y2="270" stroke="#0f172a" stroke-width="2" />

        <!-- Output Terminal -->
        <line x1="510" y1="200" x2="650" y2="200" stroke="#0f172a" stroke-width="2" />
        <circle cx="560" cy="200" r="4" fill="#0f172a" />
        <circle cx="650" cy="200" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="650" y="180" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Square Wave Vout</text>
        ${footerHtml}
      `;
    }

    case 'triangular-wave-generator': {
      return `
        ${headerHtml}
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">TRIANGULAR WAVE GENERATOR SCHEMATIC</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">Cascaded Architecture: Stage 1 Schmitt Trigger / Square Wave Generator → Stage 2 Op-Amp Integrator</text>

        <!-- Stage 1 Block -->
        <rect x="70" y="110" width="240" height="180" rx="4" fill="#f8fafc" stroke="#0f172a" stroke-width="1.8" />
        <text x="190" y="135" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Stage 1: Astable Square Generator</text>
        <polygon points="150,165 150,255 230,210" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="190" y="275" font-size="10" fill="#64748b" text-anchor="middle">Square Wave Output</text>

        <!-- Inter-stage Coupling -->
        <line x1="310" y1="210" x2="390" y2="210" stroke="#0f172a" stroke-width="2" />
        <text x="350" y="195" font-size="10" font-weight="bold" fill="#0369a1" text-anchor="middle">Square</text>

        <!-- Stage 2 Integrator -->
        <rect x="390" y="110" width="280" height="180" rx="4" fill="#f8fafc" stroke="#0f172a" stroke-width="1.8" />
        <text x="530" y="135" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Stage 2: Op-Amp Integrator</text>
        ${renderOpAmpBody({ cx: 520, cy: 215, w: 90, h: 90, invertingY: 185, nonInvertingY: 245, showPowerPins: false })}
        ${renderResistorZigzag(400, 185, 470, 185)}
        ${renderCapacitor(470, 150, 560, 150)}
        <line x1="470" y1="185" x2="470" y2="150" stroke="#0f172a" stroke-width="2" />
        <line x1="560" y1="150" x2="560" y2="215" stroke="#0f172a" stroke-width="2" />

        <!-- Output -->
        <line x1="670" y1="210" x2="720" y2="210" stroke="#0f172a" stroke-width="2" />
        <circle cx="720" cy="210" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="690" y="240" font-size="11" font-weight="bold" fill="#0369a1">Triangular Out</text>
        ${footerHtml}
      `;
    }

    case 'pwm-generator': {
      const carrierFreq = inputs.carrierFreq ?? 1000;
      const vControl = inputs.vControl ?? 2.5;
      const duty = results.dutyCycle !== undefined ? cleanFloat(results.dutyCycle, 1) : 50;

      return `
        ${headerHtml}
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">COMPARATOR-BASED PULSE WIDTH MODULATOR (PWM) SCHEMATIC</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">Modulation Principle: Carrier Wave (Triangular) vs DC Control Voltage Level</text>

        ${renderOpAmpBody({ cx: 470, cy: 200, invertingY: 160, nonInvertingY: 240, label: 'LM311 / 741' })}

        <!-- Carrier Generator Stage -->
        <rect x="70" y="110" width="180" height="90" rx="4" fill="#f8fafc" stroke="#0f172a" stroke-width="1.8" />
        <text x="160" y="132" font-size="11" font-weight="bold" fill="#b45309" text-anchor="middle">Triangular Carrier Gen</text>
        <path d="M 100 170 L 120 145 L 140 170 L 160 145 L 180 170 L 200 145" fill="none" stroke="#b45309" stroke-width="2" />
        <text x="160" y="190" font-size="10" fill="#64748b" text-anchor="middle">${formatFrequency(carrierFreq)} (0–5V)</text>
        <line x1="250" y1="160" x2="410" y2="160" stroke="#0f172a" stroke-width="2" />

        <!-- Control Voltage Vcontrol on (+) -->
        <circle cx="160" cy="240" r="16" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <text x="160" y="244" font-size="9.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Vctrl</text>
        <line x1="176" y1="240" x2="410" y2="240" stroke="#0f172a" stroke-width="2" />
        <text x="280" y="230" font-size="11" font-weight="bold" fill="#047857">Control Level = ${vControl} V</text>

        <!-- PWM Output -->
        <line x1="530" y1="200" x2="660" y2="200" stroke="#0f172a" stroke-width="2" />
        <circle cx="660" cy="200" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="660" y="180" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">PWM Output Pulse</text>

        <!-- Duty Cycle Box -->
        <rect x="510" y="285" width="220" height="65" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
        <text x="522" y="305" font-size="10.5" font-weight="bold" fill="#0f172a">Modulated Pulse Parameters:</text>
        <text x="522" y="323" font-size="12" font-weight="bold" fill="#047857">Duty Cycle: ${duty}%</text>
        <text x="522" y="340" font-size="10" fill="#64748b">Switching Frequency: ${formatFrequency(carrierFreq)}</text>
        ${footerHtml}
      `;
    }

    case 'dac': {
      const vref = inputs.vref ?? 5;
      const bin = inputs.digitalBinary ?? '1010';
      const dec = inputs.digitalDecimal ?? 10;
      const vout = results.vout !== undefined ? cleanFloat(results.vout, 3) : cleanFloat((dec / 15) * vref, 3);

      return `
        ${headerHtml}
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">4-BIT R-2R LADDER DIGITAL-TO-ANALOG CONVERTER (DAC) SCHEMATIC</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">Precision Binary Weighted Ladder Network + Op-Amp Current-to-Voltage Converter</text>

        <!-- R-2R Ladder Network Diagram -->
        <rect x="60" y="80" width="370" height="250" rx="4" fill="#f8fafc" stroke="#0f172a" stroke-width="1.8" />
        <text x="245" y="105" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">4-Bit R-2R Precision Resistor Ladder Network</text>
        
        <!-- Binary Input Pins -->
        <text x="95" y="150" font-size="10.5" font-weight="bold" fill="${bin[0] === '1' ? '#047857' : '#64748b'}">D3 (MSB): ${bin[0]}</text>
        <text x="180" y="150" font-size="10.5" font-weight="bold" fill="${bin[1] === '1' ? '#047857' : '#64748b'}">D2: ${bin[1]}</text>
        <text x="265" y="150" font-size="10.5" font-weight="bold" fill="${bin[2] === '1' ? '#047857' : '#64748b'}">D1: ${bin[2]}</text>
        <text x="350" y="150" font-size="10.5" font-weight="bold" fill="${bin[3] === '1' ? '#047857' : '#64748b'}">D0 (LSB): ${bin[3]}</text>
        
        <!-- Summing Resistors representation -->
        ${renderResistorZigzag(110, 165, 110, 235)}
        ${renderResistorZigzag(195, 165, 195, 235)}
        ${renderResistorZigzag(280, 165, 280, 235)}
        ${renderResistorZigzag(365, 165, 365, 235)}
        <line x1="110" y1="235" x2="410" y2="235" stroke="#0f172a" stroke-width="2.5" />
        <text x="245" y="260" font-size="10" fill="#475569" text-anchor="middle">R-2R Ladder Summing Bus</text>

        <!-- Summing Op-Amp -->
        ${renderOpAmpBody({ cx: 550, cy: 220, invertingY: 180, nonInvertingY: 260 })}
        <line x1="410" y1="235" x2="490" y2="180" stroke="#0f172a" stroke-width="2" />
        
        <!-- Non-inverting Grounded -->
        <line x1="490" y1="260" x2="450" y2="260" stroke="#0f172a" stroke-width="2" />
        ${renderGround(450, 260)}

        <!-- Feedback Resistor Rf -->
        <line x1="470" y1="180" x2="470" y2="110" stroke="#0f172a" stroke-width="2" />
        <line x1="470" y1="110" x2="520" y2="110" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(520, 110, 600, 110)}
        <text x="560" y="95" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Rf = R</text>
        <line x1="600" y1="110" x2="650" y2="110" stroke="#0f172a" stroke-width="2" />
        <line x1="650" y1="110" x2="650" y2="220" stroke="#0f172a" stroke-width="2" />

        <!-- Output Vout -->
        <line x1="610" y1="220" x2="710" y2="220" stroke="#0f172a" stroke-width="2" />
        <circle cx="710" cy="220" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="710" y="200" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Vout = ${vout} V</text>
        ${footerHtml}
      `;
    }

    case 'adc': {
      const vref = inputs.vref ?? 5;
      const vin = inputs.vin ?? 2.5;
      const bin = results.digitalBinary ?? '100';

      return `
        ${headerHtml}
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">PARALLEL COMPARATOR FLASH ANALOG-TO-DIGITAL CONVERTER (ADC) SCHEMATIC</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">Resistor Divider Reference Ladder + High-Speed Parallel Comparators + Priority Encoder</text>

        <!-- Resistor Reference Ladder on Left -->
        <rect x="50" y="70" width="80" height="270" rx="4" fill="#f8fafc" stroke="#0f172a" stroke-width="1.8" />
        <text x="90" y="90" font-size="10.5" font-weight="bold" fill="#047857" text-anchor="middle">+Vref (${vref}V)</text>
        ${renderResistorZigzag(90, 100, 90, 150)}
        ${renderResistorZigzag(90, 160, 90, 210)}
        ${renderResistorZigzag(90, 220, 90, 270)}
        ${renderGround(90, 315)}
        <text x="90" y="305" font-size="9" fill="#64748b" text-anchor="middle">GND</text>

        <!-- Analog Input Vin Bus -->
        <line x1="170" y1="80" x2="170" y2="310" stroke="#0369a1" stroke-width="2.5" />
        <text x="170" y="70" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">Vin (${vin}V)</text>

        <!-- Parallel Comparator Bank -->
        <rect x="230" y="70" width="180" height="270" rx="4" fill="#f8fafc" stroke="#0f172a" stroke-width="1.8" />
        <text x="320" y="95" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Comparator Array</text>
        <polygon points="270,120 270,160 320,140" fill="#ffffff" stroke="#0f172a" stroke-width="1.8" />
        <polygon points="270,185 270,225 320,205" fill="#ffffff" stroke="#0f172a" stroke-width="1.8" />
        <polygon points="270,250 270,290 320,270" fill="#ffffff" stroke="#0f172a" stroke-width="1.8" />
        
        <!-- Connecting taps -->
        <line x1="90" y1="130" x2="270" y2="130" stroke="#0f172a" stroke-width="1.5" />
        <line x1="90" y1="195" x2="270" y2="195" stroke="#0f172a" stroke-width="1.5" />
        <line x1="90" y1="260" x2="270" y2="260" stroke="#0f172a" stroke-width="1.5" />
        <line x1="170" y1="150" x2="270" y2="150" stroke="#0369a1" stroke-width="1.5" />
        <line x1="170" y1="215" x2="270" y2="215" stroke="#0369a1" stroke-width="1.5" />
        <line x1="170" y1="280" x2="270" y2="280" stroke="#0369a1" stroke-width="1.5" />

        <!-- Priority Encoder Block -->
        <rect x="470" y="90" width="160" height="230" rx="4" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <text x="550" y="125" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">Priority Encoder</text>
        <text x="550" y="145" font-size="10" fill="#64748b" text-anchor="middle">(7-to-3 Line Logic)</text>

        <!-- Lines from comparators to encoder -->
        <line x1="320" y1="140" x2="470" y2="140" stroke="#0f172a" stroke-width="1.5" />
        <line x1="320" y1="205" x2="470" y2="205" stroke="#0f172a" stroke-width="1.5" />
        <line x1="320" y1="270" x2="470" y2="270" stroke="#0f172a" stroke-width="1.5" />

        <!-- Digital Output Word -->
        <line x1="630" y1="160" x2="710" y2="160" stroke="#047857" stroke-width="2.5" />
        <line x1="630" y1="205" x2="710" y2="205" stroke="#047857" stroke-width="2.5" />
        <line x1="630" y1="250" x2="710" y2="250" stroke="#047857" stroke-width="2.5" />
        <text x="680" y="130" font-size="12" font-weight="bold" fill="#047857">Digital Word: ${bin}₂</text>
        ${footerHtml}
      `;
    }

    case 'pcc-cs-204-exp04': {
      // Discrete JFET Common-Source Amplifier
      return `
        ${headerHtml}
        <text x="30" y="32" font-size="13" font-weight="bold" fill="#0f172a">DISCRETE JFET COMMON-SOURCE AMPLIFIER SCHEMATIC (EXP 04)</text>
        <text x="30" y="48" font-size="10.5" fill="#64748b">Multisim / Breadboard Laboratory Topic • N-Channel JFET (BFW10 / 2N3819) CS Amplifier</text>

        <!-- VDD Rail -->
        <line x1="150" y1="80" x2="550" y2="80" stroke="#0f172a" stroke-width="2" />
        <text x="150" y="68" font-size="11" font-weight="bold" fill="#b91c1c">+VDD (+12V Supply)</text>

        <!-- Input Coupling Capacitor C1 & RG -->
        <circle cx="80" cy="200" r="14" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <text x="80" y="204" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">Vin</text>
        ${renderCapacitor(94, 200, 180, 200)}
        <text x="135" y="185" font-size="10.5" font-weight="bold" fill="#b45309" text-anchor="middle">C1 = 0.1 µF</text>
        <circle cx="220" cy="200" r="4" fill="#0f172a" />
        
        <!-- Gate Resistor RG to GND -->
        <line x1="220" y1="200" x2="220" y2="240" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(220, 240, 220, 310)}
        <text x="260" y="275" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">RG = 1 MΩ</text>
        <line x1="220" y1="310" x2="220" y2="330" stroke="#0f172a" stroke-width="2" />
        ${renderGround(220, 330)}

        <!-- JFET Transistor Symbol -->
        <circle cx="340" cy="200" r="30" fill="#f8fafc" stroke="#0f172a" stroke-width="2" />
        <line x1="220" y1="200" x2="320" y2="200" stroke="#0f172a" stroke-width="2" />
        <!-- Gate arrow -->
        <line x1="320" y1="180" x2="320" y2="220" stroke="#0f172a" stroke-width="3" />
        <line x1="320" y1="185" x2="350" y2="185" stroke="#0f172a" stroke-width="2" />
        <line x1="320" y1="215" x2="350" y2="215" stroke="#0f172a" stroke-width="2" />
        <polygon points="330,196 340,200 330,204" fill="#0f172a" />
        <text x="340" y="160" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">JFET BFW10</text>

        <!-- Drain Resistor RD -->
        <line x1="350" y1="185" x2="350" y2="150" stroke="#0f172a" stroke-width="2" />
        ${renderResistorZigzag(350, 150, 350, 80)}
        <text x="390" y="115" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">RD = 2.2 kΩ</text>

        <!-- Source Resistor RS & Bypass CS -->
        <line x1="350" y1="215" x2="350" y2="250" stroke="#0f172a" stroke-width="2" />
        <circle cx="350" cy="250" r="4" fill="#0f172a" />
        ${renderResistorZigzag(350, 250, 350, 320)}
        <text x="390" y="285" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">RS = 1 kΩ</text>
        <line x1="350" y1="320" x2="350" y2="340" stroke="#0f172a" stroke-width="2" />
        ${renderGround(350, 340)}

        <!-- Output Coupling C2 & RL -->
        <line x1="350" y1="185" x2="430" y2="185" stroke="#0f172a" stroke-width="2" />
        ${renderCapacitor(430, 185, 520, 185)}
        <text x="475" y="170" font-size="10.5" font-weight="bold" fill="#b45309" text-anchor="middle">C2 = 0.1 µF</text>
        <line x1="520" y1="185" x2="620" y2="185" stroke="#0f172a" stroke-width="2" />
        <circle cx="620" cy="185" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <text x="620" y="165" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Vout (Amplified)</text>

        <!-- Multisim Discrete Note -->
        <rect x="440" y="250" width="290" height="90" rx="4" fill="#fef3c7" stroke="#d97706" stroke-width="1" />
        <text x="452" y="272" font-size="11" font-weight="bold" fill="#92400e">Discrete Transistor Practical Note:</text>
        <text x="452" y="292" font-size="10" fill="#78350f">This practical is tested via Multisim simulation &amp;</text>
        <text x="452" y="308" font-size="10" fill="#78350f">physical breadboard testing. Op-Amp simulator is</text>
        <text x="452" y="324" font-size="10" font-weight="bold" fill="#92400e">bypassed to maintain authentic syllabus fidelity.</text>
        ${footerHtml}
      `;
    }

    default: {
      return `
        ${headerHtml}
        <text x="380" y="180" font-size="14" font-weight="bold" fill="#475569" text-anchor="middle">Schematic diagram not available for this module (${escapeXml(circuitId)}).</text>
        <text x="380" y="205" font-size="11" fill="#94a3b8" text-anchor="middle">Please refer to the laboratory reference manual for circuit topology details.</text>
        ${footerHtml}
      `;
    }
  }
}

/**
 * ============================================================================
 * 2. WAVEFORM GRAPHS (Print Vector SVG Generator from Actual Simulation Data)
 * ============================================================================
 */
export function generateWaveformGraphSvg(circuitId: string, inputs: any = {}, results: any = {}): string {
  const resolvedId = (circuitId === 'nmiet-pcc204-exp02-integrator' || circuitId === 'pes-mcoe-exp03-integrator') ? 'integrator'
                   : (circuitId === 'pes-mcoe-exp03-differentiator') ? 'differentiator'
                   : (circuitId === 'nmiet-ica-exp06-precision-rectifier') ? 'precision-rectifier'
                   : (circuitId === 'nmiet-ica-exp07-active-filters') ? 'low-pass-filter'
                   : (circuitId === 'nmiet-pcc204-exp05-r2r-dac') ? 'dac'
                   : (circuitId === 'nmiet-pcc204-exp06-waveform-generator') ? 'square-wave-generator'
                   : (circuitId === 'pes-mcoe-exp01-inverting-non-inverting') ? 'inverting-amplifier'
                   : (circuitId === 'pes-mcoe-exp02-summing-subtractor') ? 'summing-amplifier'
                   : (circuitId === 'nmiet-pcc204-exp04-voltage-series-feedback') ? 'non-inverting-amplifier'
                   : circuitId;

  const isSchmittOrComp = resolvedId === 'comparator' || resolvedId === 'schmitt-trigger' || resolvedId === 'nmiet-pcc204-exp03-schmitt-trigger';
  const width = 760;
  const height = isSchmittOrComp ? 560 : 340;
  const margin = { top: 40, right: 30, bottom: 50, left: 65 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const headerHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="auto" style="display:block; background:#ffffff; border:1px solid #cbd5e1; border-radius:4px; font-family:Arial, sans-serif;">
  `;
  const footerHtml = `</svg>`;

  // Helper to draw oscilloscope graticule grid
  const renderGraticule = (yLabels: { val: number; y: number }[], xLabels: { val: string; x: number }[]) => {
    let lines = '';
    // Horizontal grid lines
    yLabels.forEach(({ y, val }) => {
      lines += `<line x1="${margin.left}" y1="${y}" x2="${margin.left + plotW}" y2="${y}" stroke="${Math.abs(val) < 1e-4 ? '#475569' : '#e2e8f0'}" stroke-width="${Math.abs(val) < 1e-4 ? '1.5' : '1'}" stroke-dasharray="${Math.abs(val) < 1e-4 ? 'none' : '3 3'}" />`;
      lines += `<text x="${margin.left - 8}" y="${y + 4}" font-size="9.5" fill="#475569" text-anchor="end">${cleanFloat(val, 2)}</text>`;
    });
    // Vertical grid lines
    xLabels.forEach(({ x, val }) => {
      lines += `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + plotH}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3 3" />`;
      lines += `<text x="${x}" y="${margin.top + plotH + 18}" font-size="9.5" fill="#475569" text-anchor="middle">${val}</text>`;
    });
    // Border box
    lines += `<rect x="${margin.left}" y="${margin.top}" width="${plotW}" height="${plotH}" fill="none" stroke="#334155" stroke-width="1.5" />`;
    return lines;
  };

  // 1. ACTIVE FILTERS: BODE PLOT (Magnitude & Phase Response)
  if (resolvedId === 'low-pass-filter' || resolvedId === 'high-pass-filter') {
    const isLpf = resolvedId === 'low-pass-filter';
    const r = inputs.r ?? 10;
    const c = inputs.c ?? 0.01;
    const passbandGain = inputs.passbandGain ?? 1;
    const fc = results.fc ?? calculateCutoffFrequency(r * 1e3, c * 1e-6);

    // Generate log frequency points: 10 Hz to 100 kHz (4 decades)
    const fMin = 10;
    const fMax = 100000;
    const decades = Math.log10(fMax / fMin);
    const numPts = 200;

    const xLog = (f: number) => margin.left + (Math.log10(Math.max(fMin, f) / fMin) / decades) * plotW;
    const yMag = (db: number) => {
      // Mag range: +10 dB down to -40 dB
      const minDb = -40;
      const maxDb = 10;
      return margin.top + plotH - ((db - minDb) / (maxDb - minDb)) * plotH;
    };

    let magPath = '';
    for (let i = 0; i < numPts; i++) {
      const f = fMin * Math.pow(10, (i / (numPts - 1)) * decades);
      const ratio = f / fc;
      let gainMag = 0;
      if (isLpf) {
        gainMag = passbandGain / Math.sqrt(1 + Math.pow(ratio, 2));
      } else {
        gainMag = (passbandGain * ratio) / Math.sqrt(1 + Math.pow(ratio, 2));
      }
      const db = 20 * Math.log10(Math.max(gainMag, 1e-4));
      const px = xLog(f).toFixed(1);
      const py = yMag(Math.max(-40, db)).toFixed(1);
      magPath += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
    }

    const xGrid = [10, 100, 1000, 10000, 100000].map((f) => ({
      x: xLog(f),
      val: f >= 1000 ? `${f / 1000}k` : `${f}`
    }));
    const yGrid = [10, 0, -3, -10, -20, -30, -40].map((db) => ({
      y: yMag(db),
      val: db
    }));

    const xFc = xLog(fc);
    const yFc = yMag(20 * Math.log10(passbandGain) - 3);

    return `
      ${headerHtml}
      <!-- Title & Legend -->
      <text x="${margin.left}" y="24" font-size="12" font-weight="bold" fill="#0f172a">
        BODE MAGNITUDE RESPONSE: ${isLpf ? 'LOW-PASS' : 'HIGH-PASS'} FILTER (Gain dB vs Log Frequency)
      </text>
      <text x="${margin.left + plotW}" y="24" font-size="10.5" fill="#0369a1" font-weight="bold" text-anchor="end">
        — Magnitude Trace | fc = ${cleanFloat(fc, 1)} Hz (-3 dB point)
      </text>

      <!-- Graticule -->
      ${renderGraticule(yGrid, xGrid)}

      <!-- Axis Labels -->
      <text x="${margin.left + plotW / 2}" y="${margin.top + plotH + 38}" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">
        Frequency (Hz) — Logarithmic Scale
      </text>
      <text x="18" y="${margin.top + plotH / 2}" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle" transform="rotate(-90 18 ${margin.top + plotH / 2})">
        Gain (dB)
      </text>

      <!-- Bode Magnitude Curve -->
      <path d="${magPath}" fill="none" stroke="#0284c7" stroke-width="2.6" stroke-linecap="round" />

      <!-- Cutoff Frequency Marker -->
      <line x1="${xFc}" y1="${margin.top}" x2="${xFc}" y2="${margin.top + plotH}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4 3" />
      <circle cx="${xFc}" cy="${yFc}" r="5" fill="#dc2626" />
      <text x="${xFc + 8}" y="${yFc - 8}" font-size="10" font-weight="bold" fill="#dc2626">
        fc = ${cleanFloat(fc, 1)} Hz (-3 dB)
      </text>
      ${footerHtml}
    `;
  }

  // 2. COMPARATOR & SCHMITT TRIGGER: LARGE STACKED 2-PANEL GRAPH (Hysteresis Loop & Time-Domain Waveforms)
  if (isSchmittOrComp) {
    const isTopicExp3 = circuitId === 'nmiet-pcc204-exp03-schmitt-trigger';
    const isSchmitt = circuitId === 'schmitt-trigger' || isTopicExp3;
    const isInverting = isTopicExp3 || inputs.topology === 'inverting' || inputs.schmittType === 'inverting';

    // Parameters: prioritize live simulator inputs and results, fall back to authentic topic manual values
    let posVsat: number;
    let negVsat: number;
    let utp: number;
    let ltp: number;
    let vh: number;

    const vref = inputs.vref !== undefined ? Number(inputs.vref) : 1;

    if (isTopicExp3) {
      // Inverting Op-Amp Schmitt Trigger Practical (NMIET Exp 03):
      // Extracts active simulation parameters (supporting both r1/r2 from manual and r1/rf from simulator).
      let r1Val: number;
      let r1Unit: string;
      let r2Val: number;
      let r2Unit: string;

      if (inputs.rf !== undefined) {
        r1Val = Number(inputs.rf);
        r1Unit = inputs.rfUnit ?? 'kΩ';
        r2Val = Number(inputs.r1 ?? 10);
        r2Unit = inputs.r1Unit ?? 'kΩ';
      } else if (inputs.r2 !== undefined) {
        r1Val = Number(inputs.r1 ?? 100);
        r1Unit = inputs.r1Unit ?? 'Ω';
        r2Val = Number(inputs.r2 ?? 4.7);
        r2Unit = inputs.r2Unit ?? 'kΩ';
      } else {
        r1Val = 100;
        r1Unit = 'Ω';
        r2Val = 4.7;
        r2Unit = 'kΩ';
      }

      posVsat = inputs.posVsat !== undefined ? Number(inputs.posVsat) : 2.0;
      negVsat = inputs.negVsat !== undefined ? Number(inputs.negVsat) : -2.0;

      const r1Ohms = r1Unit === 'kΩ' ? r1Val * 1000 : (r1Unit === 'MΩ' ? r1Val * 1e6 : r1Val);
      const r2Ohms = r2Unit === 'kΩ' ? r2Val * 1000 : (r2Unit === 'MΩ' ? r2Val * 1e6 : r2Val);
      const beta = r2Ohms / (r1Ohms + r2Ohms);
      const calcUtp = beta * posVsat;
      const calcLtp = beta * negVsat;
      const calcVh = calcUtp - calcLtp;
      utp = Number(cleanFloat(calcUtp, 3));
      ltp = Number(cleanFloat(calcLtp, 3));
      vh = Number(cleanFloat(calcVh, 3));
    } else if (isSchmitt) {
      posVsat = inputs.posVsat !== undefined ? Number(inputs.posVsat) : 12;
      negVsat = inputs.negVsat !== undefined ? Number(inputs.negVsat) : -12;
      const r1 = inputs.r1 ?? 10;
      const rf = inputs.rf ?? 20;
      const beta = results.beta !== undefined ? Number(results.beta) : (r1 / (r1 + rf));
      utp = results.utp !== undefined ? Number(results.utp) : Number(cleanFloat(beta * posVsat, 2));
      ltp = results.ltp !== undefined ? Number(results.ltp) : Number(cleanFloat(beta * negVsat, 2));
      vh = results.hysteresisWidth !== undefined ? Number(results.hysteresisWidth) : Number(cleanFloat(utp - ltp, 2));
    } else {
      posVsat = inputs.posVsat !== undefined ? Number(inputs.posVsat) : 15;
      negVsat = inputs.negVsat !== undefined ? Number(inputs.negVsat) : -15;
      utp = vref;
      ltp = vref;
      vh = 0;
    }

    const vinPeak = isTopicExp3
      ? Math.max(Number(inputs.vinAmplitude || 2.5), 2.5)
      : (inputs.vinAmplitude !== undefined ? Number(inputs.vinAmplitude) : Math.max(Math.abs(utp) * 1.5, 6));
    const freq = inputs.frequency !== undefined ? Number(inputs.frequency) : 1000;

    // Stacked Dual Panel Dimensions (calibrated to completely eliminate text collision)
    // Panel A: Transfer Curve / Hysteresis Loop (Top)
    const panelALeft = 75;
    const panelAW = 630;
    const panelATop = 48;
    const panelAH = 145;

    // Panel B: Time-Domain Switching Waveforms (Bottom)
    const panelBLeft = 75;
    const panelBW = 630;
    const panelBTop = 286;
    const panelBH = 145;

    // PANEL A SCALING:
    // Dynamic clean scaling strictly matching simulator parameters
    const vSpanX = Math.max(Math.abs(utp), Math.abs(ltp), vinPeak) * 1.25;
    const vSpanY = Math.max(Math.abs(posVsat), Math.abs(negVsat)) * 1.35;

    const xCoordA = (v: number) => panelALeft + ((v + vSpanX) / (2 * vSpanX)) * panelAW;
    const yCoordA = (v: number) => panelATop + panelAH - ((v + vSpanY) / (2 * vSpanY)) * panelAH;

    // Hysteresis Loop Path (Panel A)
    let loopPath = '';
    let directionArrowsA = '';
    if (isSchmitt) {
      if (isInverting) {
        // INVERTING SCHMITT TRIGGER (Clockwise Trajectory)
        loopPath = `
          M ${xCoordA(-vSpanX).toFixed(1)} ${yCoordA(posVsat).toFixed(1)}
          L ${xCoordA(utp).toFixed(1)} ${yCoordA(posVsat).toFixed(1)}
          L ${xCoordA(utp).toFixed(1)} ${yCoordA(negVsat).toFixed(1)}
          L ${xCoordA(vSpanX).toFixed(1)} ${yCoordA(negVsat).toFixed(1)}
          M ${xCoordA(vSpanX).toFixed(1)} ${yCoordA(negVsat).toFixed(1)}
          L ${xCoordA(ltp).toFixed(1)} ${yCoordA(negVsat).toFixed(1)}
          L ${xCoordA(ltp).toFixed(1)} ${yCoordA(posVsat).toFixed(1)}
          L ${xCoordA(-vSpanX).toFixed(1)} ${yCoordA(posVsat).toFixed(1)}
        `;

        // Clockwise switching direction indicators (placed within plot bounds)
        const topTextY = Math.max(panelATop + 14, yCoordA(posVsat) - 8);
        const botTextY = Math.min(panelATop + panelAH - 6, yCoordA(negVsat) + 14);

        directionArrowsA = `
          <!-- Top branch: Rising Vin (moving right) -->
          <polygon points="${xCoordA(0) - 6},${yCoordA(posVsat) - 5} ${xCoordA(0) + 6},${yCoordA(posVsat)} ${xCoordA(0) - 6},${yCoordA(posVsat) + 5}" fill="#0284c7" />
          <text x="${xCoordA(0)}" y="${topTextY}" font-size="8.5" font-weight="bold" fill="#0284c7" text-anchor="middle">Rising Vin (Vout = +Vsat) →</text>

          <!-- Right transition: Toggle downward to -Vsat at VUTP -->
          <polygon points="${xCoordA(utp) - 5},${yCoordA(0) - 6} ${xCoordA(utp)},${yCoordA(0) + 6} ${xCoordA(utp) + 5},${yCoordA(0) - 6}" fill="#dc2626" />
          <text x="${xCoordA(utp) + 8}" y="${yCoordA(0) + 4}" font-size="8.5" font-weight="bold" fill="#dc2626" text-anchor="start">Toggles to -Vsat ↓</text>

          <!-- Bottom branch: Falling Vin (moving left) -->
          <polygon points="${xCoordA(0) + 6},${yCoordA(negVsat) - 5} ${xCoordA(0) - 6},${yCoordA(negVsat)} ${xCoordA(0) + 6},${yCoordA(negVsat) + 5}" fill="#0284c7" />
          <text x="${xCoordA(0)}" y="${botTextY}" font-size="8.5" font-weight="bold" fill="#0284c7" text-anchor="middle">← Falling Vin (Vout = -Vsat)</text>

          <!-- Left transition: Toggle upward to +Vsat at VLTP -->
          <polygon points="${xCoordA(ltp) - 5},${yCoordA(0) + 6} ${xCoordA(ltp)},${yCoordA(0) - 6} ${xCoordA(ltp) + 5},${yCoordA(0) + 6}" fill="#059669" />
          <text x="${xCoordA(ltp) - 8}" y="${yCoordA(0) + 4}" font-size="8.5" font-weight="bold" fill="#059669" text-anchor="end">↑ Toggles to +Vsat</text>
        `;
      } else {
        // NON-INVERTING SCHMITT TRIGGER (Counter-Clockwise Trajectory)
        loopPath = `
          M ${xCoordA(-vSpanX).toFixed(1)} ${yCoordA(negVsat).toFixed(1)}
          L ${xCoordA(utp).toFixed(1)} ${yCoordA(negVsat).toFixed(1)}
          L ${xCoordA(utp).toFixed(1)} ${yCoordA(posVsat).toFixed(1)}
          L ${xCoordA(vSpanX).toFixed(1)} ${yCoordA(posVsat).toFixed(1)}
          M ${xCoordA(vSpanX).toFixed(1)} ${yCoordA(posVsat).toFixed(1)}
          L ${xCoordA(ltp).toFixed(1)} ${yCoordA(posVsat).toFixed(1)}
          L ${xCoordA(ltp).toFixed(1)} ${yCoordA(negVsat).toFixed(1)}
          L ${xCoordA(-vSpanX).toFixed(1)} ${yCoordA(negVsat).toFixed(1)}
        `;

        directionArrowsA = `
          <polygon points="${xCoordA(0) - 6},${yCoordA(negVsat) - 5} ${xCoordA(0) + 6},${yCoordA(negVsat)} ${xCoordA(0) - 6},${yCoordA(negVsat) + 5}" fill="#0284c7" />
          <polygon points="${xCoordA(utp) - 5},${yCoordA(0) + 6} ${xCoordA(utp)},${yCoordA(0) - 6} ${xCoordA(utp) + 5},${yCoordA(0) + 6}" fill="#059669" />
          <polygon points="${xCoordA(0) + 6},${yCoordA(posVsat) - 5} ${xCoordA(0) - 6},${yCoordA(posVsat)} ${xCoordA(0) + 6},${yCoordA(posVsat) + 5}" fill="#0284c7" />
          <polygon points="${xCoordA(ltp) - 5},${yCoordA(0) - 6} ${xCoordA(ltp)},${yCoordA(0) + 6} ${xCoordA(ltp) + 5},${yCoordA(0) - 6}" fill="#dc2626" />
        `;
      }
    } else {
      // Voltage Comparator
      loopPath = `
        M ${xCoordA(-vSpanX).toFixed(1)} ${yCoordA(posVsat).toFixed(1)}
        L ${xCoordA(vref).toFixed(1)} ${yCoordA(posVsat).toFixed(1)}
        L ${xCoordA(vref).toFixed(1)} ${yCoordA(negVsat).toFixed(1)}
        L ${xCoordA(vSpanX).toFixed(1)} ${yCoordA(negVsat).toFixed(1)}
      `;
    }

    // Grid ticks for Panel A (clean engineering values avoid misleading 1.6V ticks)
    const ticksX_A = Math.abs(posVsat - 2.0) < 0.1 && Math.abs(vSpanX - 3.125) < 0.2
      ? [-2.5, -2.0, -1.0, 0, 1.0, 2.0, 2.5]
      : [-vSpanX, -vSpanX / 2, 0, vSpanX / 2, vSpanX];
    const ticksY_A = Math.abs(posVsat - 2.0) < 0.1
      ? [-2.0, -1.0, 0, 1.0, 2.0]
      : [-posVsat, -posVsat / 2, 0, posVsat / 2, posVsat];

    let gridLinesA = '';
    ticksX_A.forEach((v) => {
      const x = xCoordA(v);
      gridLinesA += `<line x1="${x}" y1="${panelATop}" x2="${x}" y2="${panelATop + panelAH}" stroke="${Math.abs(v) < 1e-4 ? '#64748b' : '#e2e8f0'}" stroke-width="${Math.abs(v) < 1e-4 ? '1.5' : '1'}" stroke-dasharray="${Math.abs(v) < 1e-4 ? 'none' : '3 3'}" />`;
      gridLinesA += `<text x="${x}" y="${panelATop + panelAH + 14}" font-size="9" fill="#475569" text-anchor="middle">${cleanFloat(v, 1)}V</text>`;
    });
    ticksY_A.forEach((v) => {
      const y = yCoordA(v);
      gridLinesA += `<line x1="${panelALeft}" y1="${y}" x2="${panelALeft + panelAW}" y2="${y}" stroke="${Math.abs(v) < 1e-4 ? '#64748b' : '#e2e8f0'}" stroke-width="${Math.abs(v) < 1e-4 ? '1.5' : '1'}" stroke-dasharray="${Math.abs(v) < 1e-4 ? 'none' : '3 3'}" />`;
      gridLinesA += `<text x="${panelALeft - 8}" y="${y + 4}" font-size="9" fill="#475569" text-anchor="end">${cleanFloat(v, 1)}V</text>`;
    });

    // PANEL B: DYNAMIC TIME DOMAIN WAVEFORM SIMULATION
    const nPoints = 800; // High resolution for precise instantaneous switching edges
    const tTotal = 2 / freq; // 2 complete cycles
    const xCoordB = (t: number) => panelBLeft + (t / tTotal) * panelBW;
    const yCoordB = (v: number) => panelBTop + panelBH - ((v + vSpanY) / (2 * vSpanY)) * panelBH;

    let vinPathB = '';
    let voutPathB = '';
    let currState = isInverting ? posVsat : negVsat;
    let prevState = currState;

    for (let i = 0; i < nPoints; i++) {
      const t = (i / (nPoints - 1)) * tTotal;
      const vinVal = vinPeak * Math.sin(2 * Math.PI * freq * t);

      // Switching evaluation
      prevState = currState;
      if (isSchmitt) {
        if (isInverting) {
          if (vinVal >= utp) currState = negVsat;
          else if (vinVal <= ltp) currState = posVsat;
        } else {
          if (vinVal >= utp) currState = posVsat;
          else if (vinVal <= ltp) currState = negVsat;
        }
      } else {
        currState = vinVal > vref ? posVsat : negVsat;
      }

      const px = xCoordB(t).toFixed(1);
      const pyIn = yCoordB(vinVal).toFixed(1);
      const pyOut = yCoordB(currState).toFixed(1);

      vinPathB += i === 0 ? `M ${px} ${pyIn}` : ` L ${px} ${pyIn}`;

      if (i === 0) {
        voutPathB = `M ${px} ${pyOut}`;
      } else if (currState !== prevState) {
        // Draw instantaneous vertical step transition at exact switching threshold crossing
        const pyPrev = yCoordB(prevState).toFixed(1);
        voutPathB += ` L ${px} ${pyPrev} L ${px} ${pyOut}`;
      } else {
        voutPathB += ` L ${px} ${pyOut}`;
      }
    }

    const tTicks = [0, 0.5 / freq, 1 / freq, 1.5 / freq, 2 / freq];
    let gridLinesB = '';
    tTicks.forEach((t) => {
      const x = xCoordB(t);
      const tMs = t * 1000;
      gridLinesB += `<line x1="${x}" y1="${panelBTop}" x2="${x}" y2="${panelBTop + panelBH}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3 3" />`;
      gridLinesB += `<text x="${x}" y="${panelBTop + panelBH + 14}" font-size="9" fill="#475569" text-anchor="middle">${cleanFloat(tMs, 2)} ms</text>`;
    });
    ticksY_A.forEach((v) => {
      const y = yCoordB(v);
      gridLinesB += `<line x1="${panelBLeft}" y1="${y}" x2="${panelBLeft + panelBW}" y2="${y}" stroke="${Math.abs(v) < 1e-4 ? '#64748b' : '#e2e8f0'}" stroke-width="${Math.abs(v) < 1e-4 ? '1.5' : '1'}" stroke-dasharray="${Math.abs(v) < 1e-4 ? 'none' : '3 3'}" />`;
      gridLinesB += `<text x="${panelBLeft - 8}" y="${y + 4}" font-size="9" fill="#475569" text-anchor="end">${cleanFloat(v, 1)}V</text>`;
    });

    return `
      ${headerHtml}
      <!-- ================= PANEL A: HYSTERESIS TRANSFER CURVE ================= -->
      <!-- Title on its own line -->
      <text x="${panelALeft}" y="18" font-size="11.5" font-weight="bold" fill="#0f172a">
        PANEL A: VOLTAGE TRANSFER CHARACTERISTIC &amp; HYSTERESIS CURVE (Vout vs Vin)
      </text>
      <!-- Subtitle on dedicated secondary line avoids text collision -->
      <text x="${panelALeft}" y="34" font-size="9.5" font-weight="bold" fill="#0284c7">
        ${isSchmitt ? `Hysteresis Width V_H = ${cleanFloat(vh, 3)} V • ${isInverting ? 'Inverting' : 'Non-Inverting'} Mode • Dynamic Switching Trajectory` : 'Comparator Transfer Characteristic'}
      </text>

      <!-- Panel A Background & Graticule -->
      <rect x="${panelALeft}" y="${panelATop}" width="${panelAW}" height="${panelAH}" fill="#ffffff" stroke="#334155" stroke-width="1.2" />
      ${gridLinesA}

      <!-- Panel A Hysteresis / Transfer Curve Trace -->
      <path d="${loopPath}" fill="none" stroke="#0284c7" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round" />

      <!-- Panel A Switching Direction Arrows & Trajectory Labels -->
      ${directionArrowsA}

      <!-- Panel A Threshold Markers -->
      <line x1="${xCoordA(utp)}" y1="${panelATop}" x2="${xCoordA(utp)}" y2="${panelATop + panelAH}" stroke="#059669" stroke-width="1.6" stroke-dasharray="4 3" />
      <line x1="${xCoordA(ltp)}" y1="${panelATop}" x2="${xCoordA(ltp)}" y2="${panelATop + panelAH}" stroke="#dc2626" stroke-width="1.6" stroke-dasharray="4 3" />
      
      <!-- Threshold Corner Markers -->
      <circle cx="${xCoordA(utp)}" cy="${yCoordA(posVsat)}" r="4.5" fill="#059669" />
      <circle cx="${xCoordA(utp)}" cy="${yCoordA(negVsat)}" r="4.5" fill="#dc2626" />
      <circle cx="${xCoordA(ltp)}" cy="${yCoordA(negVsat)}" r="4.5" fill="#dc2626" />
      <circle cx="${xCoordA(ltp)}" cy="${yCoordA(posVsat)}" r="4.5" fill="#059669" />

      <!-- Threshold Callout Labels (Ample clearance from plot border) -->
      <rect x="${xCoordA(utp) - 46}" y="${panelATop + 6}" width="92" height="17" rx="3" fill="#ecfdf5" stroke="#059669" stroke-width="1" />
      <text x="${xCoordA(utp)}" y="${panelATop + 18}" font-size="8.5" font-weight="bold" fill="#059669" text-anchor="middle">V_UTP = +${cleanFloat(utp, 3)} V</text>

      <rect x="${xCoordA(ltp) - 46}" y="${panelATop + panelAH - 23}" width="92" height="17" rx="3" fill="#fef2f2" stroke="#dc2626" stroke-width="1" />
      <text x="${xCoordA(ltp)}" y="${panelATop + panelAH - 11}" font-size="8.5" font-weight="bold" fill="#dc2626" text-anchor="middle">V_LTP = ${cleanFloat(ltp, 3)} V</text>

      <!-- Dimension Line for Hysteresis Width VH -->
      ${isSchmitt && Math.abs(utp - ltp) > 0.05 ? `
        <line x1="${xCoordA(ltp)}" y1="${yCoordA(0)}" x2="${xCoordA(utp)}" y2="${yCoordA(0)}" stroke="#475569" stroke-width="1.5" />
        <line x1="${xCoordA(ltp)}" y1="${yCoordA(0) - 6}" x2="${xCoordA(ltp)}" y2="${yCoordA(0) + 6}" stroke="#475569" stroke-width="1.5" />
        <line x1="${xCoordA(utp)}" y1="${yCoordA(0) - 6}" x2="${xCoordA(utp)}" y2="${yCoordA(0) + 6}" stroke="#475569" stroke-width="1.5" />
        <rect x="${xCoordA((utp + ltp) / 2) - 45}" y="${yCoordA(0) - 16}" width="90" height="14" rx="2" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.8" />
        <text x="${xCoordA((utp + ltp) / 2)}" y="${yCoordA(0) - 6}" font-size="8.5" font-weight="bold" fill="#0f172a" text-anchor="middle">V_H = ${cleanFloat(vh, 3)} V</text>
      ` : ''}

      <!-- Panel A Axis Titles (Cleanly Spaced) -->
      <text x="${panelALeft + panelAW / 2}" y="${panelATop + panelAH + 28}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">
        Input Voltage Vin (V)
      </text>
      <text x="20" y="${panelATop + panelAH / 2}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" transform="rotate(-90 20 ${panelATop + panelAH / 2})">
        Output Vout (V)
      </text>


      <!-- ================= PANEL B: TIME DOMAIN WAVEFORMS ================= -->
      <!-- Title on dedicated line -->
      <text x="${panelBLeft}" y="258" font-size="11.5" font-weight="bold" fill="#0f172a">
        PANEL B: DYNAMIC TIME-DOMAIN SWITCHING WAVEFORMS (Vin(t) and Vout(t))
      </text>
      <!-- Legend on dedicated secondary line eliminates title overlap -->
      <g transform="translate(${panelBLeft}, 274)">
        <line x1="0" y1="-3" x2="18" y2="-3" stroke="#0284c7" stroke-width="2.5" />
        <text x="24" y="0" font-size="9" font-weight="bold" fill="#0284c7">Trace 1: Vin (${cleanFloat(freq, 0)} Hz, ±${cleanFloat(vinPeak, 2)}Vp Sine)</text>
        <line x1="240" y1="-3" x2="258" y2="-3" stroke="#059669" stroke-width="2.5" />
        <text x="264" y="0" font-size="9" font-weight="bold" fill="#059669">Trace 2: Vout (±${cleanFloat(posVsat, 1)}V Square)</text>
      </g>

      <!-- Panel B Background & Graticule -->
      <rect x="${panelBLeft}" y="${panelBTop}" width="${panelBW}" height="${panelBH}" fill="#ffffff" stroke="#334155" stroke-width="1.2" />
      ${gridLinesB}

      <!-- Panel B In-Graph Channel Identifiers -->
      <rect x="${panelBLeft + 8}" y="${panelBTop + 8}" width="76" height="16" rx="2" fill="#eff6ff" stroke="#bfdbfe" stroke-width="0.8" />
      <text x="${panelBLeft + 46}" y="${panelBTop + 20}" font-size="8.5" font-weight="bold" fill="#1e40af" text-anchor="middle">Ch 1: Vin(t)</text>
      <rect x="${panelBLeft + 88}" y="${panelBTop + 8}" width="80" height="16" rx="2" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="0.8" />
      <text x="${panelBLeft + 128}" y="${panelBTop + 20}" font-size="8.5" font-weight="bold" fill="#065f46" text-anchor="middle">Ch 2: Vout(t)</text>

      <!-- Panel B Horizontal Threshold Guide Lines -->
      <line x1="${panelBLeft}" y1="${yCoordB(utp)}" x2="${panelBLeft + panelBW}" y2="${yCoordB(utp)}" stroke="#059669" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.85" />
      <text x="${panelBLeft + panelBW - 6}" y="${yCoordB(utp) - 4}" font-size="8.5" font-weight="bold" fill="#059669" text-anchor="end">UTP (+${cleanFloat(utp, 3)} V)</text>

      <line x1="${panelBLeft}" y1="${yCoordB(ltp)}" x2="${panelBLeft + panelBW}" y2="${yCoordB(ltp)}" stroke="#dc2626" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.85" />
      <text x="${panelBLeft + panelBW - 6}" y="${yCoordB(ltp) + 11}" font-size="8.5" font-weight="bold" fill="#dc2626" text-anchor="end">LTP (${cleanFloat(ltp, 3)} V)</text>

      <!-- Panel B Traces -->
      <path d="${vinPathB}" fill="none" stroke="#0284c7" stroke-width="2" stroke-linejoin="round" />
      <path d="${voutPathB}" fill="none" stroke="#059669" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Panel B Axis Titles (Cleanly Spaced) -->
      <text x="${panelBLeft + panelBW / 2}" y="${panelBTop + panelBH + 28}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">
        Time t (ms) — 2 Full Cycles
      </text>
      <text x="20" y="${panelBTop + panelBH / 2}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" transform="rotate(-90 20 ${panelBTop + panelBH / 2})">
        Voltage (V)
      </text>
      ${footerHtml}
    `;
  }

  // 3. PWM GENERATOR: CARRIER + CONTROL + MODULATED SQUARE WAVE
  if (resolvedId === 'pwm-generator') {
    const carrierFreq = inputs.carrierFreq ?? 1000;
    const vControl = inputs.vControl ?? 2.5;
    const vMax = inputs.vMax ?? 5;
    const vMin = inputs.vMin ?? 0;
    const duty = results.dutyCycle !== undefined ? cleanFloat(results.dutyCycle, 1) : 50;

    // Stacked dual trace
    const halfH = (plotH - 25) / 2;
    const nPts = 240;
    const cycles = 3;

    const xCoord = (i: number) => margin.left + (i / (nPts - 1)) * plotW;
    const yTopTrace = (v: number) => margin.top + halfH - ((v - vMin) / (vMax - vMin || 1)) * halfH;
    const yBotTrace = (v: number) => margin.top + halfH + 25 + halfH - ((v - vMin) / (vMax - vMin || 1)) * halfH;

    let carrierPath = '';
    let pwmPath = '';
    for (let i = 0; i < nPts; i++) {
      const frac = ((i / nPts) * cycles) % 1;
      const carrierVal = frac < 0.5 ? vMin + frac * 2 * (vMax - vMin) : vMax - (frac - 0.5) * 2 * (vMax - vMin);
      const pwmVal = vControl >= carrierVal ? vMax : vMin;

      const px = xCoord(i).toFixed(1);
      carrierPath += i === 0 ? `M ${px} ${yTopTrace(carrierVal).toFixed(1)}` : ` L ${px} ${yTopTrace(carrierVal).toFixed(1)}`;
      pwmPath += i === 0 ? `M ${px} ${yBotTrace(pwmVal).toFixed(1)}` : ` L ${px} ${yBotTrace(pwmVal).toFixed(1)}`;
    }

    const yCtrlY = yTopTrace(vControl);

    return `
      ${headerHtml}
      <text x="${margin.left}" y="24" font-size="12" font-weight="bold" fill="#0f172a">
        PWM MODULATION WAVEFORMS: CARRIER, CONTROL LEVEL &amp; MODULATED OUTPUT
      </text>
      <text x="${margin.left + plotW}" y="24" font-size="11" font-weight="bold" fill="#047857" text-anchor="end">
        Measured Duty Cycle: ${duty}%
      </text>

      <!-- Channel 1: Triangular Carrier & Vcontrol -->
      <rect x="${margin.left}" y="${margin.top}" width="${plotW}" height="${halfH}" fill="#ffffff" stroke="#334155" stroke-width="1.2" />
      <path d="${carrierPath}" fill="none" stroke="#b45309" stroke-width="2" />
      <line x1="${margin.left}" y1="${yCtrlY}" x2="${margin.left + plotW}" y2="${yCtrlY}" stroke="#047857" stroke-width="2" stroke-dasharray="4 2" />
      <text x="${margin.left + 8}" y="${margin.top + 16}" font-size="9.5" font-weight="bold" fill="#b45309">Ch 1: Carrier (0–${vMax}V) &amp; Vctrl (${vControl}V)</text>

      <!-- Channel 2: PWM Output -->
      <rect x="${margin.left}" y="${margin.top + halfH + 25}" width="${plotW}" height="${halfH}" fill="#ffffff" stroke="#334155" stroke-width="1.2" />
      <path d="${pwmPath}" fill="none" stroke="#0284c7" stroke-width="2.2" />
      <text x="${margin.left + 8}" y="${margin.top + halfH + 40}" font-size="9.5" font-weight="bold" fill="#0284c7">Ch 2: Modulated PWM Output Pulse Train (${duty}% Duty)</text>
      <text x="${margin.left + plotW / 2}" y="${margin.top + plotH + 22}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">Time (t)</text>
      ${footerHtml}
    `;
  }

  // 4. DATA CONVERTERS: DAC & ADC STAIRCASE TRANSFER CURVES
  if (resolvedId === 'dac' || resolvedId === 'adc') {
    const isDac = resolvedId === 'dac';
    const vref = inputs.vref ?? 5;
    const maxCode = isDac ? Math.pow(2, inputs.resolution ?? 4) - 1 : Math.pow(2, inputs.resolution ?? 3) - 1;

    let staircasePath = '';
    for (let c = 0; c <= maxCode; c++) {
      if (isDac) {
        const v = (c / maxCode) * vref;
        const x1 = margin.left + (c / maxCode) * plotW;
        const x2 = margin.left + (Math.min(maxCode, c + 1) / maxCode) * plotW;
        const y = margin.top + plotH - (v / vref) * plotH;
        staircasePath += c === 0 ? `M ${x1} ${y} H ${x2}` : ` V ${y} H ${x2}`;
      } else {
        const vStart = (c / maxCode) * vref;
        const vEnd = ((c + 1) / maxCode) * vref;
        const x1 = margin.left + (vStart / vref) * plotW;
        const x2 = margin.left + (Math.min(vref, vEnd) / vref) * plotW;
        const y = margin.top + plotH - (c / maxCode) * plotH;
        staircasePath += c === 0 ? `M ${x1} ${y} H ${x2}` : ` V ${y} H ${x2}`;
      }
    }

    return `
      ${headerHtml}
      <text x="${margin.left}" y="24" font-size="12" font-weight="bold" fill="#0f172a">
        ${isDac ? 'DAC QUANTIZATION STAIRCASE TRANSFER CURVE (Vout vs Digital Code)' : 'ADC CONVERSION CHARACTERISTIC (Digital Code vs Analog Vin)'}
      </text>

      <rect x="${margin.left}" y="${margin.top}" width="${plotW}" height="${plotH}" fill="#ffffff" stroke="#334155" stroke-width="1.2" />
      <path d="${staircasePath}" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linejoin="round" />
      <text x="${margin.left + plotW / 2}" y="${margin.top + plotH + 32}" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">
        ${isDac ? 'Digital Input Code (Decimal Value 0 to ' + maxCode + ')' : 'Analog Input Voltage Vin (0 to ' + vref + ' V)'}
      </text>
      <text x="20" y="${margin.top + plotH / 2}" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle" transform="rotate(-90 20 ${margin.top + plotH / 2})">
        ${isDac ? 'Analog Output Vout (0 to ' + vref + ' V)' : 'Digital Output Code (0 to ' + maxCode + ')'}
      </text>
      ${footerHtml}
    `;
  }

  // 5. STANDARD OSCILLOSCOPE TIME-DOMAIN SIMULATION (Linear Op-Amps, Calculus, Rectifier, Oscillators)
  // We run the actual simulation engine from waveformEngine.ts!
  let simResult: any = null;

  try {
    if (resolvedId === 'inverting-amplifier' || resolvedId === 'non-inverting-amplifier' || resolvedId === 'voltage-follower') {
      const vin = inputs.vin ?? 2;
      const freq = inputs.frequency ?? 1000;
      const gain = results.av ?? (resolvedId === 'inverting-amplifier' ? -5 : resolvedId === 'non-inverting-amplifier' ? 10 : 1);
      simResult = simulateLinearOpAmp({
        inputParams: { waveform: 'sine', amplitude: vin, frequency: freq, phaseDeg: 0, dcOffset: 0 },
        gain: Math.abs(gain),
        phaseInvert: gain < 0,
        posVsat: 15,
        negVsat: -15,
        sampleCount: 600
      });
    } else if (resolvedId === 'integrator' || resolvedId === 'differentiator') {
      const mode = resolvedId === 'integrator' ? 'integrator' : 'differentiator';
      const vin = inputs.vin ?? 1;
      const freq = inputs.frequency ?? 1000;
      const r = (inputs.r ?? 10) * 1e3;
      const c = (inputs.c ?? 0.01) * 1e-6;
      simResult = simulateCalculusWaveform({
        mode,
        waveform: inputs.waveform ?? (mode === 'integrator' ? 'square' : 'triangle'),
        vinPeak: vin,
        frequency: freq,
        rc: r * c,
        sampleCount: 600
      });
    } else if (resolvedId === 'precision-rectifier') {
      const vin = inputs.vin ?? 2;
      const freq = inputs.frequency ?? 1000;
      simResult = simulateRectifierWaveform({
        waveform: 'sine',
        vinPeak: vin,
        frequency: freq,
        sampleCount: 600
      });
    } else if (resolvedId === 'summing-amplifier') {
      const ch1 = inputs.channels?.[0]?.voltage ?? 1;
      const ch2 = inputs.channels?.[1]?.voltage ?? 2;
      const rf = (inputs.rf ?? 10) * 1e3;
      simResult = simulateSummingOpAmp({
        channels: [
          { waveform: 'sine', amplitude: ch1, frequency: 1000, phaseDeg: 0, dcOffset: 0, resistance: 10e3 },
          { waveform: 'sine', amplitude: ch2, frequency: 1000, phaseDeg: 0, dcOffset: 0, resistance: 10e3 },
        ],
        rf,
        sampleCount: 600
      });
    } else if (resolvedId === 'differential-amplifier') {
      const v1 = inputs.v1 ?? 2;
      const v2 = inputs.v2 ?? 1;
      simResult = simulateDifferentialOpAmp({
        v1Params: { waveform: 'sine', amplitude: v1, frequency: 1000, phaseDeg: 0, dcOffset: 0 },
        v2Params: { waveform: 'sine', amplitude: v2, frequency: 1000, phaseDeg: 0, dcOffset: 0 },
        r1: (inputs.r1 ?? 10) * 1e3,
        r2: (inputs.r2 ?? 10) * 1e3,
        rf: (inputs.rf ?? 20) * 1e3,
        rg: (inputs.rg ?? 20) * 1e3,
        sampleCount: 600
      });
    } else if (resolvedId === 'square-wave-generator' || resolvedId === 'triangular-wave-generator') {
      // Astable relaxation wave
      const posVsat = inputs.posVsat ?? 12;
      const negVsat = inputs.negVsat ?? -12;
      const freq = 1000;
      const timeArr = generateTimeArray(freq, 3, 600);
      const vinArr: number[] = [];
      const voutArr: number[] = [];
      for (let i = 0; i < timeArr.time.length; i++) {
        const cycle = (timeArr.time[i] / timeArr.period) % 1;
        if (resolvedId === 'square-wave-generator') {
          vinArr.push(cycle < 0.5 ? posVsat * 0.5 : negVsat * 0.5); // capacitor charging
          voutArr.push(cycle < 0.5 ? posVsat : negVsat);
        } else {
          vinArr.push(cycle < 0.5 ? posVsat : negVsat);
          voutArr.push(cycle < 0.5 ? -10 + 40 * cycle : 10 - 40 * (cycle - 0.5));
        }
      }
      simResult = {
        time: timeArr.time,
        vin: vinArr,
        vout: voutArr,
        timeUnit: timeArr.timeUnit,
        inMetrics: { vPeak: posVsat * 0.5, frequency: freq },
        outMetrics: { vPeak: posVsat, frequency: freq }
      };
    }
  } catch (err) {
    console.warn('Simulation failed in PDF asset renderer:', err);
  }

  // If simulation produced data, render the waveform graph
  if (simResult && simResult.time && simResult.vin && simResult.vout) {
    const time = simResult.time;
    const vin = simResult.vin;
    const vout = simResult.vout;
    const timeUnit = simResult.timeUnit || 'ms';

    // Compute max amplitude for symmetrical Y-axis
    let maxV = 2;
    for (let i = 0; i < time.length; i++) {
      if (Math.abs(vin[i]) > maxV) maxV = Math.abs(vin[i]);
      if (Math.abs(vout[i]) > maxV) maxV = Math.abs(vout[i]);
    }
    maxV = Math.ceil(maxV * 1.25); // headroom

    const tTotal = time[time.length - 1];
    const xCoord = (t: number) => margin.left + (t / (tTotal || 1e-4)) * plotW;
    const yCoord = (v: number) => margin.top + plotH - ((v + maxV) / (2 * maxV)) * plotH;

    let pathVin = '';
    let pathVout = '';
    for (let i = 0; i < time.length; i++) {
      const px = xCoord(time[i]).toFixed(1);
      const pyIn = yCoord(vin[i]).toFixed(1);
      const pyOut = yCoord(vout[i]).toFixed(1);
      pathVin += i === 0 ? `M ${px} ${pyIn}` : ` L ${px} ${pyIn}`;
      pathVout += i === 0 ? `M ${px} ${pyOut}` : ` L ${px} ${pyOut}`;
    }

    const yGrid = [maxV, maxV / 2, 0, -maxV / 2, -maxV].map((v) => ({
      y: yCoord(v),
      val: v
    }));
    const xGrid = [0, 0.25, 0.5, 0.75, 1.0].map((frac) => ({
      x: margin.left + frac * plotW,
      val: cleanFloat(frac * tTotal * (timeUnit === 'ms' ? 1000 : 1), 2)
    }));

    return `
      ${headerHtml}
      <!-- Header Legend & Metrics -->
      <text x="${margin.left}" y="24" font-size="12" font-weight="bold" fill="#0f172a">
        TIME-DOMAIN OSCILLOSCOPE WAVEFORMS (SIMULATED DUAL TRACE)
      </text>
      <g transform="translate(${margin.left + plotW}, 15)">
        <line x1="-200" y1="5" x2="-180" y2="5" stroke="#1d4ed8" stroke-width="2.5" />
        <text x="-174" y="9" font-size="9.5" font-weight="bold" fill="#1d4ed8">Vin (Input Peak: ${cleanFloat(simResult.inMetrics?.vPeak ?? 0, 2)}V)</text>
        <line x1="-50" y1="5" x2="-30" y2="5" stroke="#047857" stroke-width="2.5" />
        <text x="-24" y="9" font-size="9.5" font-weight="bold" fill="#047857">Vout (Peak: ${cleanFloat(simResult.outMetrics?.vPeak ?? 0, 2)}V)</text>
      </g>

      <!-- Graticule -->
      ${renderGraticule(yGrid, xGrid)}

      <!-- Traces -->
      <path d="${pathVin}" fill="none" stroke="#1d4ed8" stroke-width="2" stroke-linejoin="round" />
      <path d="${pathVout}" fill="none" stroke="#047857" stroke-width="2.2" stroke-linejoin="round" />

      <!-- Labels -->
      <text x="${margin.left + plotW / 2}" y="${margin.top + plotH + 34}" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">
        Time (${timeUnit})
      </text>
      <text x="18" y="${margin.top + plotH / 2}" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle" transform="rotate(-90 18 ${margin.top + plotH / 2})">
        Voltage (V)
      </text>
      ${footerHtml}
    `;
  }

  // Fallback for topics with no active simulation (e.g. PCC-CS-204 Exp 04)
  return `
    ${headerHtml}
    <text x="380" y="160" font-size="13" font-weight="bold" fill="#475569" text-anchor="middle">
      Waveform graph not simulated in browser runtime for module: ${escapeXml(circuitId)}
    </text>
    <text x="380" y="185" font-size="11" fill="#94a3b8" text-anchor="middle">
      Physical laboratory / Multisim oscilloscope verification record applies.
    </text>
    ${footerHtml}
  `;
}
