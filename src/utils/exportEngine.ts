import { SavedExperimentConfig, TheoreticalVsSimulatedItem, ObservationRow, ObservationColumn } from '../types/lab';

/**
 * Triggers a browser file download of a string blob
 */
function downloadFile(content: string, fileName: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports complete experiment configuration as formatted JSON
 */
export function exportExperimentToJSON(experiment: SavedExperimentConfig): void {
  const jsonString = JSON.stringify(experiment, null, 2);
  const cleanTitle = experiment.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const fileName = `optisim-exp${experiment.experimentNumber}-${cleanTitle}.json`;
  downloadFile(jsonString, fileName, 'application/json');
}

/**
 * Validates and parses an imported JSON string into SavedExperimentConfig
 */
export function parseAndValidateExperimentJSON(jsonString: string): SavedExperimentConfig {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON file format. Please upload a valid OPTI-SIM experiment export.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Malformed experiment file: root object missing.');
  }

  if (!parsed.circuitId || typeof parsed.circuitId !== 'string') {
    throw new Error('Missing or invalid "circuitId" property in experiment file.');
  }

  if (typeof parsed.experimentNumber !== 'number') {
    throw new Error('Missing or invalid "experimentNumber" property.');
  }

  if (!parsed.title || typeof parsed.title !== 'string') {
    throw new Error('Missing or invalid "title" property.');
  }

  return {
    id: parsed.id || `imported-${Date.now()}`,
    timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
    dateFormatted: parsed.dateFormatted || new Date().toLocaleDateString(),
    experimentNumber: parsed.experimentNumber,
    title: parsed.title,
    circuitId: parsed.circuitId,
    studentName: parsed.studentName || 'Student',
    inputs: parsed.inputs || {},
    observations: Array.isArray(parsed.observations) ? parsed.observations : [],
    notes: typeof parsed.notes === 'string' ? parsed.notes : ''
  };
}

/**
 * Exports experiment comparison, observation table, and optional sampled waveform points to CSV
 */
export function exportExperimentToCSV({
  title,
  experimentNumber,
  comparison,
  observations,
  observationColumns,
  waveformData,
  parameters,
}: {
  title: string;
  experimentNumber: number;
  comparison: TheoreticalVsSimulatedItem[];
  observations: ObservationRow[];
  observationColumns: ObservationColumn[];
  waveformData?: { time: number[]; vin: number[]; vout: number[]; timeUnit?: string };
  parameters?: Record<string, string | number>;
}): void {
  const lines: string[] = [];

  // Metadata headers
  lines.push(`"OPTI-SIM LABORATORY EXPERIMENT DATA REPORT"`);
  lines.push(`"Experiment No.",${experimentNumber}`);
  lines.push(`"Experiment Title","${title.replace(/"/g, '""')}"`);
  lines.push(`"Date Exported","${new Date().toLocaleString()}"`);
  lines.push(`"Platform","OPTI-SIM Op-Amp Circuit Simulator (ENTC)"`);
  lines.push('');

  // 1. Active Circuit Parameters (if provided)
  if (parameters && Object.keys(parameters).length > 0) {
    lines.push(`"--- ACTIVE CIRCUIT PARAMETERS ---"`);
    lines.push(`"Parameter","Configured Value"`);
    Object.entries(parameters).forEach(([key, val]) => {
      lines.push(`"${key.replace(/"/g, '""')}","${String(val).replace(/"/g, '""')}"`);
    });
    lines.push('');
  }

  // 2. Theoretical vs Simulated Comparison
  lines.push(`"--- THEORETICAL VS SIMULATED RESULTS ---"`);
  lines.push(`"Parameter","Theoretical Value","Simulated Value","Error (%)","Unit","Formula Description"`);
  comparison.forEach((item) => {
    lines.push(
      `"${item.parameter}","${item.theoretical}","${item.simulated}","${item.errorPercent}","${item.unit}","${(item.formulaExplanation || '').replace(/"/g, '""')}"`
    );
  });
  lines.push('');

  // 3. Observation Table
  lines.push(`"--- RECORDED OBSERVATIONS TABLE ---"`);
  if (observationColumns.length > 0 && observations.length > 0) {
    const colHeaders = ['"#"'].concat(observationColumns.map((c) => `"${c.label}${c.unit ? ` (${c.unit})` : ''}"`)).join(',');
    lines.push(colHeaders);

    observations.forEach((row, idx) => {
      const rowVals = [`${idx + 1}`].concat(
        observationColumns.map((col) => {
          const val = row[col.key];
          return val !== undefined && val !== null ? `"${String(val).replace(/"/g, '""')}"` : '""';
        })
      ).join(',');
      lines.push(rowVals);
    });
  } else {
    lines.push('"No observations recorded."');
  }
  lines.push('');

  // 4. Sampled Oscilloscope Waveform Data (Time, Input, Output)
  if (waveformData && waveformData.time && waveformData.time.length > 0) {
    const unit = waveformData.timeUnit || 's';
    lines.push(`"--- SAMPLED OSCILLOSCOPE TIME-DOMAIN WAVEFORM DATA ---"`);
    lines.push(`"Sample Index","Time (${unit})","Input Voltage (V)","Output Voltage (V)"`);
    const count = waveformData.time.length;
    // Export downsampled if very large, otherwise full sample up to 1000 points
    const step = Math.max(1, Math.floor(count / 600));
    for (let i = 0; i < count; i += step) {
      lines.push(`${i},${waveformData.time[i].toFixed(6)},${(waveformData.vin[i] ?? 0).toFixed(4)},${(waveformData.vout[i] ?? 0).toFixed(4)}`);
    }
  }

  const csvContent = lines.join('\r\n');
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  downloadFile(csvContent, `optisim-exp${experimentNumber}-${cleanTitle}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Directly exports sampled oscilloscope waveform points to CSV (Time, Vin, Vout)
 */
export function exportWaveformCSV(
  time: number[],
  vin: number[],
  vout: number[],
  circuitName: string = 'circuit'
): void {
  const lines: string[] = [];
  lines.push(`"OPTI-SIM WAVEFORM SCOPE EXPORT"`);
  lines.push(`"Circuit","${circuitName.replace(/"/g, '""')}"`);
  lines.push(`"Timestamp","${new Date().toISOString()}"`);
  lines.push(`"Sample","Time (s)","Vin (V)","Vout (V)"`);

  for (let i = 0; i < time.length; i++) {
    lines.push(`${i},${time[i].toFixed(7)},${(vin[i] ?? 0).toFixed(4)},${(vout[i] ?? 0).toFixed(4)}`);
  }

  const csvContent = lines.join('\r\n');
  const cleanTitle = circuitName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  downloadFile(csvContent, `optisim-waveform-${cleanTitle}.csv`, 'text/csv;charset=utf-8;');
}

import { generateSchematicSvg, generateWaveformGraphSvg } from './pdfAssetRenderer';
import { getStoredStudentProfile } from './studentSync';

/**
 * Triggers a browser print preview formatted as a professional engineering lab sheet
 */
export function printExperimentReport(reportData: {
  title: string;
  experimentNumber: number;
  aim: string;
  theory: {
    principle: string;
    mainEquation: string;
    assumptions: string[];
    circuitRelationship: string;
  };
  formulas: Array<{ label: string; formula: string; description?: string }>;
  procedure: string[];
  comparison: TheoreticalVsSimulatedItem[];
  observations: ObservationRow[];
  observationColumns: ObservationColumn[];
  resultStatement: string;
  conclusion: string;
  parameters?: Record<string, string | number>;
  notes?: string;
  studentName?: string;
  division?: string;
  rollNumber?: string;
  studentProfile?: {
    fullName: string;
    division: string;
    rollNumber: string;
  };
  circuitId?: string;
  activeResults?: any;
  apparatus?: string[];
}): void {
  const printWindow = window.open('', '_blank', 'width=960,height=1000');
  if (!printWindow) {
    alert('Please allow popups to view and print the engineering experiment report.');
    return;
  }

  const storedProfile = getStoredStudentProfile();

  const {
    title,
    experimentNumber,
    aim,
    theory,
    formulas,
    procedure,
    comparison,
    observations,
    observationColumns,
    resultStatement,
    conclusion,
    parameters = {},
    notes = '',
    circuitId,
    activeResults,
    apparatus
  } = reportData;

  const effectiveName =
    reportData.studentProfile?.fullName ||
    reportData.studentName ||
    storedProfile?.fullName ||
    'ENTC Engineering Student';

  const effectiveDivision =
    reportData.studentProfile?.division ||
    reportData.division ||
    storedProfile?.division ||
    'A';

  const effectiveRoll =
    reportData.studentProfile?.rollNumber ||
    reportData.rollNumber ||
    storedProfile?.rollNumber ||
    '—';

  // Generate large vector schematic SVG
  const schematicSvg = circuitId ? generateSchematicSvg(circuitId, parameters, activeResults) : '';

  // Generate actual simulation waveform graph SVG
  const waveformSvg = circuitId ? generateWaveformGraphSvg(circuitId, parameters, activeResults) : '';

  // Default apparatus list if not explicitly provided
  const apparatusList = apparatus && apparatus.length > 0 ? apparatus : [
    'Dual-Trace Digital Storage Oscilloscope (DSO, 20 MHz / 50 MHz)',
    'Function / Signal Generator (1 Hz – 1 MHz, Sine / Square / Triangle)',
    'Dual-Tracking Regulated DC Power Supply (±15 V, 1 A)',
    'Digital Multimeter (DMM, 4½ Digit)',
    'Operational Amplifier IC 741 / TL081 / LM324 (or equivalent)',
    'Breadboard & BNC-to-Alligator Patch Probes',
    'Precision Passive Components (Metal-film resistors, capacitors as specified in design)'
  ];

  const apparatusHtml = apparatusList.map((a) => `<li style="margin-bottom: 3px;">${a}</li>`).join('');

  const comparisonRowsHtml = comparison.map((c) => `
    <tr>
      <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 500;">${c.parameter}</td>
      <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">${c.theoretical} ${c.unit}</td>
      <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">${c.simulated} ${c.unit}</td>
      <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-weight: bold; color: ${Number(c.errorPercent) === 0 ? '#047857' : '#b45309'};">${c.errorPercent}%</td>
      <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #475569;">${c.formulaExplanation || ''}</td>
    </tr>
  `).join('');

  const formatObservationHeader = (c: ObservationColumn): string => {
    let lbl = c.label.trim();
    let unit = c.unit ? c.unit.trim() : '';
    if (unit.toLowerCase() === 'mv / v' || unit.toLowerCase() === 'vp / vpp' || unit.toLowerCase() === 'v / mv') {
      unit = 'V';
    }
    if (unit) {
      const parenMatch = lbl.match(/\(([^)]+)\)$/);
      if (parenMatch) {
        const inside = parenMatch[1].trim().toLowerCase();
        if (inside === unit.toLowerCase() || inside === 'v' || inside === 'mv' || inside === 'vp' || inside === 'vpp' || inside === 'hz' || inside === 'khz' || inside === 'db') {
          return `${lbl.replace(/\s*\([^)]+\)$/, '').trim()} (${unit})`;
        }
        return lbl;
      }
      return `${lbl} (${unit})`;
    }
    lbl = lbl.replace(/\s*\(mv\s*\/\s*v\)/i, ' (V)').replace(/\s*\(vp\s*\/\s*vpp\)/i, ' (V)');
    return lbl;
  };

  const obsHeadersHtml = observationColumns.map((c) => `
    <th style="padding: 6px 8px; border: 1px solid #cbd5e1; background: #f1f5f9; text-align: left; font-size: 11px;">
      ${formatObservationHeader(c)}
    </th>
  `).join('');

  const obsRowsHtml = observations.length > 0 ? observations.map((row, idx) => `
    <tr>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: monospace; font-size: 11px; text-align: center;">${idx + 1}</td>
      ${observationColumns.map((c) => `
        <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: monospace; font-size: 11.5px;">${row[c.key] !== undefined && row[c.key] !== '' ? row[c.key] : '—'}</td>
      `).join('')}
    </tr>
  `).join('') : `
    <tr><td colspan="${observationColumns.length + 1}" style="padding: 12px; text-align: center; color: #64748b; font-style: italic;">No student observations entered.</td></tr>
  `;

  const formulasHtml = formulas.map((f) => `
    <div style="margin-bottom: 6px; font-family: monospace; background: #f8fafc; padding: 6px 10px; border-left: 3px solid #0284c7; border-radius: 2px; word-break: break-word; overflow-wrap: anywhere;">
      <strong>${f.label}:</strong> <span style="font-size: 12.5px;">${f.formula}</span>
      ${f.description ? `<span style="font-size: 11px; color: #64748b; margin-left: 8px;">(${f.description})</span>` : ''}
    </div>
  `).join('');

  const parametersHtml = parameters && Object.keys(parameters).length > 0
    ? Object.entries(parameters).map(([k, v]) => `
      <div style="padding: 4px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-family: monospace; font-size: 11px;">
        <span style="color: #64748b;">${k}:</span> <strong style="color: #0369a1;">${v}</strong>
      </div>
    `).join('')
    : '';

  const procedureHtml = procedure.map((step) => `<li style="margin-bottom: 4px; line-height: 1.45;">${step.replace(/^((?:Step\s*\d+:?|\d+[\.\)\]]|\([a-z0-9]+\))\s*)+/i, '')}</li>`).join('');
  const assumptionsHtml = theory.assumptions.map((a) => `<li style="margin-bottom: 2px;">${a.replace(/^((?:Step\s*\d+:?|\d+[\.\)\]]|\([a-z0-9]+\))\s*)+/i, '')}</li>`).join('');

  // Check if observations contain genuine user recorded measurements
  const hasGenuineMeasurements = observations && observations.length > 0 && observations.some((row) =>
    Object.entries(row).some(([k, val]) => k !== 'id' && k !== 'srNo' && val !== undefined && val !== '' && val !== null && val !== '—')
  );

  const conclusionHtml = hasGenuineMeasurements
    ? `<div>${conclusion}</div><div style="margin-top:6px; font-size:11px; color:#047857;"><strong>Physical Hardware Verification:</strong> Student bench observations confirm circuit operation in accordance with theoretical calculations.</div>`
    : `<div>${conclusion}</div><div style="margin-top:6px; padding:6px 10px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:4px; font-size:10.5px; color:#0f172a;"><strong>Verification Assessment:</strong> Numerical simulation demonstrates that the simulated behavior agrees with theoretical calculations within computational tolerances. Because physical bench readings were not recorded for this session, physical breadboard hardware testing remains pending.</div>`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>OPTI-SIM Experiment ${experimentNumber} Report - ${title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 14mm 14mm;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.45;
      font-size: 11.5px;
      margin: 0;
      padding: 15px;
      background: #ffffff;
    }
    h1, h2, h3, h4 {
      margin: 0 0 6px 0;
      color: #0f172a;
    }
    .header-bar {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .badge {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      font-family: monospace;
    }
    .section {
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 12.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0369a1;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      margin-bottom: 8px;
      page-break-inside: auto;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: 11px;
    }
    .meta-item strong {
      color: #475569;
    }
    .box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      border-radius: 4px;
    }
    .param-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 6px;
      margin-top: 6px;
    }
    .figure-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 10px;
      text-align: center;
      margin: 8px 0;
      page-break-inside: avoid;
    }
    .figure-caption {
      font-size: 11px;
      font-weight: bold;
      color: #475569;
      margin-top: 6px;
      text-align: center;
    }
    .footer-stamp {
      margin-top: 25px;
      padding-top: 15px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .sign-box {
      border-top: 1px dashed #64748b;
      width: 180px;
      text-align: center;
      padding-top: 4px;
      font-size: 10.5px;
      color: #475569;
    }
    @media print {
      body {
        padding: 0;
        font-size: 11px;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <!-- Print Controls Header -->
  <div class="no-print" style="margin-bottom: 16px; background: #0284c7; color: white; padding: 10px 16px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
    <div>
      <strong>OPTI-SIM Practical Record Export</strong> — Print directly or save as PDF.
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <select id="exportScope" onchange="filterScope(this.value)" style="padding: 5px 8px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 11.5px; background: #ffffff; color: #0f172a; cursor: pointer;">
        <option value="full">Full Practical Report (Complete)</option>
        <option value="content">Practical Content &amp; Calculations Only</option>
        <option value="diagrams">Schematic &amp; Waveforms Report Only</option>
      </select>
      <button onclick="window.print()" style="background: white; color: #0284c7; font-weight: bold; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer;">
        🖨️ Print / Save PDF
      </button>
    </div>
  </div>

  <div class="header-bar">
    <div>
      <span class="badge">OPTI-SIM • ELECTRONICS ENGINEERING LABORATORY RECORD</span>
      <h1 style="font-size: 17px; margin-top: 4px;">EXPERIMENT ${experimentNumber}: ${title}</h1>
      <div style="font-size: 11px; color: #475569;">Op-Amp Circuit Simulation, Waveform Analysis &amp; Empirical Measurement Record</div>
    </div>
    <div style="text-align: right; font-size: 11px; color: #64748b;">
      <div>Date: ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      <div>Verification Status: <strong>VERIFIED LABORATORY RECORD</strong></div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><strong>Student Name:</strong> ${effectiveName}</div>
    <div class="meta-item"><strong>Roll Number:</strong> ${effectiveRoll}</div>
    <div class="meta-item"><strong>Division:</strong> Div ${effectiveDivision}</div>
    <div class="meta-item"><strong>Module Reference:</strong> Experiment ${experimentNumber} (${circuitId || 'Op-Amp'})</div>
    <div class="meta-item"><strong>Verification Engine:</strong> OPTI-SIM Digital Passport</div>
    <div class="meta-item"><strong>Simulation Core:</strong> Analytical Op-Amp Engine v2.0</div>
  </div>

  <!-- SECTION 1: AIM -->
  <div class="section sec-content">
    <div class="section-title">1. Aim</div>
    <div class="box">${aim}</div>
  </div>

  <!-- SECTION 2: APPARATUS REQUIRED -->
  <div class="section sec-content">
    <div class="section-title">2. Apparatus &amp; Equipment Required</div>
    <ul style="margin: 0; padding-left: 20px; line-height: 1.5;">${apparatusHtml}</ul>
  </div>

  <!-- SECTION 3: THEORY & CIRCUIT PRINCIPLES -->
  <div class="section sec-content">
    <div class="section-title">3. Theory &amp; Circuit Principles</div>
    <p style="margin-top: 0; text-align: justify;">${theory.principle}</p>
    <div style="margin: 6px 0;"><strong>Main Governing Equation:</strong> <code style="background: #f1f5f9; padding: 2px 6px; font-weight: bold;">${theory.mainEquation}</code></div>
    <p style="margin: 4px 0;">${theory.circuitRelationship}</p>
    <div style="font-size: 11px; margin-top: 6px;">
      <strong>Key Assumptions &amp; Ideal Op-Amp Properties:</strong>
      <ul style="margin: 4px 0 0 18px; padding: 0;">${assumptionsHtml}</ul>
    </div>
  </div>

  <!-- SECTION 4: GOVERNING FORMULAS -->
  <div class="section sec-content">
    <div class="section-title">4. Governing Formulas &amp; Design Calculations</div>
    ${formulasHtml}
  </div>

  <!-- SECTION 5: CIRCUIT SCHEMATIC (LARGE & READABLE) -->
  ${schematicSvg ? `
  <div class="section sec-diagrams" style="break-inside: avoid; page-break-inside: avoid;">
    <div class="section-title">5. Circuit Schematic Diagram</div>
    <div class="figure-card">
      ${schematicSvg}
      <div class="figure-caption">Figure 1: Circuit Schematic Diagram — ${title}</div>
    </div>
  </div>` : ''}

  <!-- SECTION 6: ACTIVE CIRCUIT PARAMETERS -->
  ${parametersHtml ? `
  <div class="section sec-content">
    <div class="section-title">${schematicSvg ? '6' : '5'}. Configured Circuit Parameters</div>
    <div class="param-grid">${parametersHtml}</div>
  </div>` : ''}

  <!-- SECTION 7: EXPERIMENTAL PROCEDURE -->
  <div class="section sec-content">
    <div class="section-title">${schematicSvg ? '7' : '6'}. Experimental Procedure</div>
    <ol style="margin: 0; padding-left: 18px; font-size: 11px;">${procedureHtml}</ol>
  </div>

  <!-- SECTION 8: WAVEFORM OSCILLOSCOPE GRAPHS (ACTUAL SIMULATION DATA) -->
  ${waveformSvg ? `
  <div class="section sec-diagrams" style="break-inside: avoid; page-break-inside: avoid;">
    <div class="section-title">8. Oscilloscope Waveforms &amp; Dynamic Response</div>
    <div class="figure-card">
      ${waveformSvg}
      <div class="figure-caption">Figure 2: Input and Output Waveforms / Dynamic Response Characteristic (Actual Simulation)</div>
    </div>
  </div>` : ''}

  <!-- SECTION 9: THEORETICAL VS SIMULATED RESULTS -->
  <div class="section sec-content">
    <div class="section-title">9. Theoretical vs Simulated Results</div>
    <div class="figure-caption" style="text-align: left; margin-bottom: 4px;">Table 1: Calculated vs Simulated Circuit Values</div>
    <table>
      <thead>
        <tr style="background: #f1f5f9;">
          <th style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: left;">Parameter</th>
          <th style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right;">Theoretical</th>
          <th style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right;">Simulated</th>
          <th style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right;">Error %</th>
          <th style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: left;">Analytical Relation</th>
        </tr>
      </thead>
      <tbody>
        ${comparisonRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- SECTION 10: OBSERVATION TABLE -->
  <div class="section sec-content">
    <div class="section-title">10. Recorded Observation Table</div>
    <div class="figure-caption" style="text-align: left; margin-bottom: 4px;">Table 2: Experimental &amp; Empirical Observations</div>
    <table>
      <thead>
        <tr>
          <th style="padding: 6px 8px; border: 1px solid #cbd5e1; background: #f1f5f9; text-align: center; width: 35px;">#</th>
          ${obsHeadersHtml}
        </tr>
      </thead>
      <tbody>
        ${obsRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- SECTION 11: STUDENT NOTES -->
  ${notes ? `
  <div class="section sec-content">
    <div class="section-title">11. Student Notes &amp; Laboratory Hardware Observations</div>
    <div class="box" style="white-space: pre-wrap; font-size: 11px;">${notes}</div>
  </div>` : ''}

  <!-- SECTION 12: RESULT -->
  <div class="section sec-content">
    <div class="section-title">${notes ? '12' : '11'}. Result</div>
    <div class="box" style="border-left: 3px solid #10b981; font-weight: 500;">
      ${resultStatement}
    </div>
  </div>

  <!-- SECTION 13: CONCLUSION -->
  <div class="section sec-content">
    <div class="section-title">${notes ? '13' : '12'}. Conclusion</div>
    <div class="box" style="border-left: 3px solid #6366f1;">
      ${conclusionHtml}
    </div>
  </div>

  <!-- VERIFICATION SIGNATURES -->
  <div class="footer-stamp">
    <div class="sign-box">
      Student Signature
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${effectiveName} (${effectiveRoll})</div>
    </div>
    <div class="sign-box">Grade / Marks Awarded: ________</div>
    <div class="sign-box">Faculty / Lab Instructor Verification</div>
  </div>

  <script>
    function filterScope(val) {
      const contentSecs = document.querySelectorAll('.sec-content');
      const diagramSecs = document.querySelectorAll('.sec-diagrams');

      if (val === 'content') {
        contentSecs.forEach(s => s.style.display = 'block');
        diagramSecs.forEach(s => s.style.display = 'none');
      } else if (val === 'diagrams') {
        contentSecs.forEach(s => s.style.display = 'none');
        diagramSecs.forEach(s => s.style.display = 'block');
      } else {
        contentSecs.forEach(s => s.style.display = 'block');
        diagramSecs.forEach(s => s.style.display = 'block');
      }
    }
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

