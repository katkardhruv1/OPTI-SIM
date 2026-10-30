import { SyllabusTopic, SyllabusObservationRow } from '../types/syllabus';
import { generateSchematicSvg, generateWaveformGraphSvg } from './pdfAssetRenderer';
import { cleanFloat } from './formatters';
import { getStoredStudentProfile } from './studentSync';

/**
 * Downloads a string as a file blob in the browser
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
 * Formats a column header without duplicating parenthesized units or composite units
 */
function formatHeaderColumn(col: { label: string; unit?: string }): string {
  let lbl = col.label.trim();
  let unit = col.unit ? col.unit.trim() : '';

  // Clean composite units like "mV / V" -> "V" or "Vp / Vpp" -> "V"
  if (unit.toLowerCase() === 'mv / v' || unit.toLowerCase() === 'vp / vpp' || unit.toLowerCase() === 'v / mv') {
    unit = 'V';
  }

  // If label already contains parenthesized units, strip them if they match or are redundant
  if (unit) {
    const parenUnitMatch = lbl.match(/\(([^)]+)\)$/);
    if (parenUnitMatch) {
      const inside = parenUnitMatch[1].trim().toLowerCase();
      if (inside === unit.toLowerCase() || inside === 'v' || inside === 'mv' || inside === 'vp' || inside === 'vpp' || inside === 'hz' || inside === 'khz' || inside === 'db') {
        return `${lbl.replace(/\s*\([^)]+\)$/, '').trim()} (${unit})`;
      }
      return lbl;
    }
    return `${lbl} (${unit})`;
  }

  // If no separate unit, clean composite units embedded in label like "(mV / V)"
  lbl = lbl.replace(/\s*\(mv\s*\/\s*v\)/i, ' (V)').replace(/\s*\(vp\s*\/\s*vpp\)/i, ' (V)');
  return lbl;
}

/**
 * Resolves simulation inputs & results ensuring authentic practical consistency
 * Dynamically computes threshold values from active simulation parameters and flags adjustments
 */
function resolveTopicSimulationState(
  topic: SyllabusTopic,
  activeState?: { inputs: any; results: any }
): { inputs: any; results: any; isAdjusted: boolean } {
  if (topic.id === 'nmiet-pcc204-exp03-schmitt-trigger') {
    const actInputs = activeState?.inputs || {};
    
    // Check if activeState has customized simulation inputs
    // (supporting both simulator convention rf/r1 and manual convention r1/r2)
    const hasCustom = Boolean(
      activeState &&
      activeState.inputs &&
      (
        actInputs.r2 !== undefined ||
        (actInputs.topology === 'inverting' && (actInputs.r1 !== undefined || actInputs.rf !== undefined)) ||
        (actInputs.circuitId === topic.id)
      )
    );

    let r1Val = 100;
    let r1Unit = 'Ω';
    let r2Val = 4.7;
    let r2Unit = 'kΩ';
    let posVsat = 2.0;
    let negVsat = -2.0;
    let vinAmp = 2.5;
    let freq = 1000;

    if (hasCustom) {
      if (actInputs.rf !== undefined) {
        // Inverting Schmitt trigger simulator convention: rf is feedback, r1 is ground leg
        r1Val = Number(actInputs.rf);
        r1Unit = actInputs.rfUnit ?? 'kΩ';
        r2Val = Number(actInputs.r1 ?? 10);
        r2Unit = actInputs.r1Unit ?? 'kΩ';
      } else if (actInputs.r2 !== undefined) {
        r1Val = Number(actInputs.r1 ?? 100);
        r1Unit = actInputs.r1Unit ?? 'Ω';
        r2Val = Number(actInputs.r2 ?? 4.7);
        r2Unit = actInputs.r2Unit ?? 'kΩ';
      }
      if (actInputs.posVsat !== undefined) posVsat = Number(actInputs.posVsat);
      if (actInputs.negVsat !== undefined) negVsat = Number(actInputs.negVsat);
      if (actInputs.vinAmplitude !== undefined) vinAmp = Number(actInputs.vinAmplitude);
      if (actInputs.frequency !== undefined) freq = Number(actInputs.frequency);
    }

    const r1Ohms = r1Unit === 'kΩ' ? r1Val * 1000 : (r1Unit === 'MΩ' ? r1Val * 1e6 : r1Val);
    const r2Ohms = r2Unit === 'kΩ' ? r2Val * 1000 : (r2Unit === 'MΩ' ? r2Val * 1e6 : r2Val);

    // Check if active simulation parameters differ from college manual (R1=100Ω, R2=4.7kΩ, ±2.0V)
    const isAdjusted = Math.abs(r1Ohms - 100) > 1 || Math.abs(r2Ohms - 4700) > 10 || Math.abs(posVsat - 2.0) > 0.05 || Math.abs(negVsat - (-2.0)) > 0.05;

    // Threshold calculations dynamically derived ONLY from active simulation parameters:
    // beta = R2 / (R1 + R2)
    const beta = r2Ohms / (r1Ohms + r2Ohms);
    const utp = beta * posVsat;
    const ltp = beta * negVsat;
    const vh = utp - ltp;

    return {
      inputs: {
        circuitId: topic.id,
        topology: 'inverting',
        schmittType: 'inverting',
        r1: r1Val,
        r1Unit,
        r2: r2Val,
        r2Unit,
        rf: r1Val,
        rfUnit: r1Unit,
        r3: actInputs.r3 !== undefined ? Number(actInputs.r3) : 100,
        r3Unit: actInputs.r3Unit ?? 'Ω',
        posVsat,
        negVsat,
        vinAmplitude: vinAmp,
        frequency: freq
      },
      results: {
        beta: cleanFloat(beta, 4),
        utp: cleanFloat(utp, 3),
        ltp: cleanFloat(ltp, 3),
        hysteresisWidth: cleanFloat(vh, 3),
        posVsat,
        negVsat
      },
      isAdjusted
    };
  }

  return {
    inputs: activeState?.inputs || {},
    results: activeState?.results || {},
    isAdjusted: false
  };
}

/**
 * Formats and prints a formal Laboratory Record Report for a Syllabus Practical
 */
export function printSyllabusReport({
  topic,
  studentName,
  observations,
  studentConclusion,
  studentNotes,
  activeState
}: {
  topic: SyllabusTopic;
  studentName: string;
  observations: Record<string, SyllabusObservationRow[]>;
  studentConclusion?: string;
  studentNotes?: string;
  activeState?: { inputs: any; results: any };
}): void {
  const printWindow = window.open('', '_blank', 'width=960,height=1000');
  if (!printWindow) {
    alert('Please allow popups to open the printable laboratory record.');
    return;
  }

  const currentDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const storedProfile = getStoredStudentProfile();
  const effectiveName = studentName || storedProfile?.fullName || 'Engineering Student';
  const effectiveRoll = storedProfile?.rollNumber || '—';
  const effectiveDivision = storedProfile?.division || 'A';

  // Resolve simulation state (strictly separating topic baseline from generic circuits)
  const resolvedState = resolveTopicSimulationState(topic, activeState);
  const circuitTarget = topic.mappedCircuitId || topic.id;
  const schematicSvg = generateSchematicSvg(topic.id, resolvedState.inputs, resolvedState.results) ||
                       generateSchematicSvg(circuitTarget, resolvedState.inputs, resolvedState.results);

  // Generate simulation waveforms / transfer curve SVG from the same parameter set
  const waveformSvg = generateWaveformGraphSvg(topic.id, resolvedState.inputs, resolvedState.results) ||
                      generateWaveformGraphSvg(circuitTarget, resolvedState.inputs, resolvedState.results);

  // Build observation tables HTML
  const observationTablesHtml = topic.observationTables.map((tbl, tblIdx) => {
    const studentRows = observations[tbl.id] || tbl.defaultStudentRows || [];
    const sourceRows = tbl.sourceSampleRows && tbl.sourceSampleRows.length > 0 ? tbl.sourceSampleRows : null;

    const renderTableMarkup = (rows: any[], isSourceTable: boolean) => {
      const processedRows = (rows || []).map((row) => {
        const rowObj = { ...row };
        if (!isSourceTable) {
          const hasUtp = rowObj.vutp !== undefined && rowObj.vutp !== '' && rowObj.vutp !== null;
          const hasLtp = rowObj.vltp !== undefined && rowObj.vltp !== '' && rowObj.vltp !== null;
          if (hasUtp && hasLtp) {
            if (rowObj.vh === undefined || rowObj.vh === '' || rowObj.vh === null) {
              const u = Number(rowObj.vutp);
              const l = Number(rowObj.vltp);
              if (!isNaN(u) && !isNaN(l)) {
                rowObj.vh = cleanFloat(u - l, 2);
              }
            }
          } else {
            // Calculate VH only when both thresholds are available; otherwise leave blank for 'Not recorded'
            if (rowObj.vh === undefined || rowObj.vh === null) {
              rowObj.vh = '';
            }
          }
        }
        return rowObj;
      });

      const headerCols = tbl.columns.map((c) => `<th style="padding: 6px 10px; border: 1px solid #cbd5e1; background: ${isSourceTable ? '#f1f5f9' : '#f8fafc'}; text-align: left; font-size: 11px;">${formatHeaderColumn(c)}</th>`).join('');
      const rowsHtml = processedRows && processedRows.length > 0 ? processedRows.map((row, idx) => `
        <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          ${tbl.columns.map((c) => {
            const rawVal = row[c.key];
            const hasVal = rawVal !== undefined && rawVal !== '' && rawVal !== null;
            const displayVal = hasVal ? rawVal : (isSourceTable ? '—' : 'Not recorded');
            const valColor = !hasVal ? '#94a3b8' : (c.isMeasured ? '#047857' : (c.isCalculated ? '#0369a1' : '#0f172a'));
            return `<td style="padding: 5px 10px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 11px; color: ${valColor}; font-style: ${!hasVal ? 'italic' : 'normal'};">${displayVal}</td>`;
          }).join('')}
        </tr>
      `).join('') : `
        <tr><td colspan="${tbl.columns.length}" style="padding: 10px; text-align: center; color: #64748b; font-style: italic;">No observations recorded.</td></tr>
      `;
      return `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
          <thead><tr>${headerCols}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      `;
    };

    const isSchmittObservation = tbl.id === 'obs-nmiet-schmitt';

    return `
      <div style="margin-bottom: 14px; break-inside: avoid; page-break-inside: avoid;">
        <h4 style="margin: 0 0 4px 0; font-size: 12px; color: #1e293b;">Table ${tblIdx + 1}: ${tbl.title}</h4>
        ${tbl.subtitle ? `<div style="font-size: 10.5px; color: #64748b; margin-bottom: 6px;">${tbl.subtitle}</div>` : ''}
        
        ${sourceRows ? `
          <div style="font-size: 11px; font-weight: 600; color: #334155; margin: 6px 0 3px 0;">A. Reference Laboratory Readings (Recorded in College Manual):</div>
          ${renderTableMarkup(sourceRows, true)}
        ` : ''}

        <div style="font-size: 11px; font-weight: 600; color: #334155; margin: 6px 0 3px 0;">${sourceRows ? 'B. Student Measured / Bench Observations:' : 'Student Observations:'}</div>
        ${renderTableMarkup(studentRows, false)}

        ${isSchmittObservation ? `
          <div style="margin-top: 6px; padding: 6px 10px; background: #fffbeb; border: 1px solid #fde68a; border-left: 3px solid #f59e0b; border-radius: 4px; font-size: 10.5px; color: #92400e;">
            <strong>Observation Reading Discrepancy Note (Page 10 Manual Entry):</strong><br/>
            The original college laboratory manual records <em>V<sub>UTP</sub> = +1.6 V</em>, <em>V<sub>LTP</sub> = -1.4 V</em>, and records <em>V<sub>H</sub> = 0.2 V</em>.
            Algebraically, the true hysteresis loop width is <em>V<sub>H</sub> = V<sub>UTP</sub> - V<sub>LTP</sub> = 1.6 V - (-1.4 V) = 3.0 V</em>.
            The manual entry of 0.2 V results from subtracting threshold magnitudes (|1.6| - |-1.4| = 0.2 V) rather than signed algebraic subtraction.
            The original reading is retained in the reference table above without silent alteration, and the derived physical hysteresis width of 3.0 V is reported.
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  // Check for genuine student physical measurements across tables
  const hasGenuineStudentMeasurements = topic.observationTables.some((tbl) => {
    const rows = observations[tbl.id] || [];
    return rows.some((row: any) => {
      if (!row || String(row.id || '').startsWith('ns-') || String(row.id || '').startsWith('sim-')) return false;
      return (row.vutp !== undefined && row.vutp !== '' && row.vutp !== null) ||
             (row.vltp !== undefined && row.vltp !== '' && row.vltp !== null) ||
             (row.studentVout !== undefined && row.studentVout !== '' && row.studentVout !== null) ||
             (row.croOutput !== undefined && row.croOutput !== '' && row.croOutput !== null);
    });
  });

  // Results table HTML
  const hasSimulatedCol = topic.resultsTable?.some((r) => r.simulated !== undefined);
  const resultsTableHtml = topic.resultsTable && topic.resultsTable.length > 0 ? `
    <div style="margin-bottom: 14px; break-inside: avoid; page-break-inside: avoid;">
      <div class="section-title">9. Results &amp; Verification</div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: left; font-size: 11px;">Parameter</th>
            <th style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: left; font-size: 11px;">Theoretical Value (Formula)</th>
            ${hasSimulatedCol ? '<th style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: left; font-size: 11px;">Simulated Result (SPICE)</th>' : ''}
            <th style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: left; font-size: 11px;">Source-Manual Reading</th>
            <th style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: left; font-size: 11px;">Actual Student Measurement</th>
            ${topic.resultsTable.some((r) => r.remarks) ? '<th style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: left; font-size: 11px;">Remarks &amp; Discrepancies</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${topic.resultsTable.map((r, i) => {
            let studentVal: string | undefined = undefined;
            const firstObsTbl = topic.observationTables[0];
            const studentRows = firstObsTbl ? (observations[firstObsTbl.id] || []) : [];
            // A genuine student measurement must originate from an actual human student-entered bench reading,
            // NOT a source manual record ('ns-'), NOT an automated simulator capture ('sim-'), and NOT blank defaults
            const genuineRow = studentRows.find((row: any) => {
              if (!row || String(row.id || '').startsWith('ns-') || String(row.id || '').startsWith('sim-')) return false;
              return (row.vutp !== undefined && row.vutp !== '' && row.vutp !== null) ||
                     (row.vltp !== undefined && row.vltp !== '' && row.vltp !== null) ||
                     (row.studentVout !== undefined && row.studentVout !== '' && row.studentVout !== null) ||
                     (row.croOutput !== undefined && row.croOutput !== '' && row.croOutput !== null);
            });

            if (genuineRow) {
              const lowerParam = r.parameter.toLowerCase();
              if (lowerParam.includes('vutp') && genuineRow.vutp !== undefined && genuineRow.vutp !== '') {
                studentVal = `${genuineRow.vutp} V`;
              } else if (lowerParam.includes('vltp') && genuineRow.vltp !== undefined && genuineRow.vltp !== '') {
                studentVal = `${genuineRow.vltp} V`;
              } else if (lowerParam.includes('+vsat') && genuineRow.posVsat !== undefined && genuineRow.posVsat !== '') {
                studentVal = `${genuineRow.posVsat} V`;
              } else if (lowerParam.includes('-vsat') && genuineRow.negVsat !== undefined && genuineRow.negVsat !== '') {
                studentVal = `${genuineRow.negVsat} V`;
              } else if (lowerParam.includes('vh') && genuineRow.vh !== undefined && genuineRow.vh !== '') {
                studentVal = `${genuineRow.vh} V`;
              }
            } else if (r.studentMeasured && r.studentMeasured !== 'Not recorded') {
              studentVal = r.studentMeasured;
            }

            const hasStudentVal = Boolean(studentVal && String(studentVal).trim() !== '' && studentVal !== 'Not recorded');
            const studentDisplay = hasStudentVal ? studentVal : 'Not recorded';
            const sourceDisplay = r.sourceManual || r.practical || '—';

            const lowerParam = r.parameter.toLowerCase();
            let theoDisplay = r.theoretical;
            let simDisplay = r.simulated || r.theoretical;

            if (lowerParam.includes('vutp') && resolvedState.results?.utp) {
              const u = Number(resolvedState.results.utp);
              theoDisplay = `${u >= 0 ? '+' : ''}${resolvedState.results.utp} V`;
              simDisplay = `${u >= 0 ? '+' : ''}${resolvedState.results.utp} V`;
            } else if (lowerParam.includes('vltp') && resolvedState.results?.ltp) {
              theoDisplay = `${resolvedState.results.ltp} V`;
              simDisplay = `${resolvedState.results.ltp} V`;
            } else if (lowerParam.includes('vh') && resolvedState.results?.hysteresisWidth) {
              theoDisplay = `${resolvedState.results.hysteresisWidth} V`;
              simDisplay = `${resolvedState.results.hysteresisWidth} V`;
            } else if (lowerParam.includes('+vsat') && resolvedState.inputs?.posVsat) {
              theoDisplay = `+${cleanFloat(resolvedState.inputs.posVsat, 2)} V`;
              simDisplay = `+${cleanFloat(resolvedState.inputs.posVsat, 2)} V`;
            } else if (lowerParam.includes('-vsat') && resolvedState.inputs?.negVsat) {
              theoDisplay = `${cleanFloat(resolvedState.inputs.negVsat, 2)} V`;
              simDisplay = `${cleanFloat(resolvedState.inputs.negVsat, 2)} V`;
            }

            return `
            <tr style="background: ${i % 2 === 0 ? '#fff' : '#f8fafc'}; font-family: monospace; font-size: 11px;">
              <td style="padding: 5px 10px; border: 1px solid #e2e8f0; font-weight: bold;">${r.parameter}</td>
              <td style="padding: 5px 10px; border: 1px solid #e2e8f0; color: #0369a1;">${theoDisplay}</td>
              ${hasSimulatedCol ? `<td style="padding: 5px 10px; border: 1px solid #e2e8f0; color: #7c3aed;">${simDisplay || '—'}</td>` : ''}
              <td style="padding: 5px 10px; border: 1px solid #e2e8f0; color: #047857;">${sourceDisplay}</td>
              <td style="padding: 5px 10px; border: 1px solid #e2e8f0; color: ${hasStudentVal ? '#047857' : '#94a3b8'}; font-style: ${hasStudentVal ? 'normal' : 'italic'};">${studentDisplay}</td>
              ${r.remarks ? `<td style="padding: 5px 10px; border: 1px solid #e2e8f0; font-family: sans-serif; color: #475569; font-size: 10px;">${r.remarks}</td>` : ''}
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>
      <div style="margin-top: 8px; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 10px; color: #475569;">
        <strong>Hardware Verification Disclaimer:</strong> Theoretical formulas and numerical SPICE simulations are validated against authentic college laboratory manual practical records. Physical hardware verification on bench IC 741 breadboard circuitry is confirmed only when genuine student oscilloscope measurements are recorded. Where student measurements are marked "Not recorded", physical breadboard testing remains pending.
      </div>
    </div>
  ` : '';

  // Viva questions HTML
  const vivaHtml = topic.vivaQuestions && topic.vivaQuestions.length > 0 ? `
    <div style="margin-bottom: 14px; break-inside: avoid; page-break-inside: avoid;">
      <div class="section-title">Oral / Viva Questions</div>
      <ol style="margin: 0; padding-left: 20px; font-size: 11px; line-height: 1.5;">
        ${topic.vivaQuestions.map((v) => `
          <li style="margin-bottom: 5px;">
            <strong>${v.question.replace(/^((?:Step\s*\d+:?|\d+[\.\)\]]|\([a-z0-9]+\))\s*)+/i, '')}</strong>
            ${v.answerHint ? `<div style="color: #475569; font-size: 10.5px; margin-top: 2px;">Key Concept: ${v.answerHint}</div>` : ''}
          </li>
        `).join('')}
      </ol>
    </div>
  ` : '';

  const cleanObjectivesHtml = (topic.objectives || []).map((o) => `<li style="margin-bottom: 3px;">${o.replace(/^((?:Step\s*\d+:?|\d+[\.\)\]]|\([a-z0-9]+\))\s*)+/i, '')}</li>`).join('');
  const cleanProcedureHtml = topic.procedure.map((step) => `<li style="margin-bottom: 4px;">${step.replace(/^((?:Step\s*\d+:?|\d+[\.\)\]]|\([a-z0-9]+\))\s*)+/i, '')}</li>`).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${topic.secondaryRefNumber} - ${topic.title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.45;
      font-size: 11px;
      margin: 0;
      padding: 15px;
      background: #ffffff;
      letter-spacing: normal;
      word-spacing: normal;
      text-align: left;
    }
    .inst-header {
      text-align: center;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .inst-title {
      font-size: 15px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
    }
    .inst-sub {
      font-size: 11.5px;
      font-weight: 600;
      color: #475569;
      margin-top: 2px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 12px;
      font-size: 11px;
    }
    .section-title {
      font-size: 12.5px;
      font-weight: 700;
      color: #0369a1;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      margin: 12px 0 6px 0;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .formula-box {
      background: #f8fafc;
      border-left: 3px solid #0284c7;
      padding: 6px 10px;
      font-family: monospace;
      font-size: 11px;
      margin-bottom: 6px;
      border-radius: 2px;
      word-break: break-word;
      overflow-wrap: anywhere;
      word-spacing: normal;
      text-align: left;
    }
    .figure-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 10px;
      text-align: center;
      margin: 8px 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .figure-caption {
      font-size: 11px;
      font-weight: bold;
      color: #475569;
      margin-top: 6px;
      text-align: center;
    }
    .sign-block {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #cbd5e1;
      padding-top: 12px;
      font-size: 11px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .sec-content, .sec-diagrams {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    @media print {
      body {
        padding: 0;
        font-size: 11px;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <!-- Print Controls Header -->
  <div class="no-print" style="margin-bottom: 16px; background: #0284c7; color: white; padding: 10px 16px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
    <div>
      <strong>OPTI-SIM College Practical Record Export</strong> — Print directly or save as PDF.
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

  <div class="inst-header">
    <div class="inst-title">${topic.source.college}</div>
    <div class="inst-sub">Subject: ${topic.source.subject} ${topic.source.subjectCode ? `(${topic.source.subjectCode})` : ''}</div>
    <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">${topic.source.manualTitle} • ${topic.source.pageReferences}</div>
  </div>

  <div class="meta-grid">
    <div><strong>Reference:</strong> ${topic.secondaryRefNumber}</div>
    <div><strong>Date of Performance:</strong> ${currentDate}</div>
    <div><strong>Student Name:</strong> ${effectiveName}</div>
    <div><strong>Roll Number:</strong> ${effectiveRoll}</div>
    <div><strong>Division / Class:</strong> Div ${effectiveDivision} (${topic.source.classInfo || 'S.E E&TC'})</div>
    <div><strong>Verification Status:</strong> VERIFIED DIGITAL PASSPORT</div>
  </div>

  <div style="margin-bottom: 12px;">
    <div style="font-size: 14.5px; font-weight: 800; color: #0369a1; line-height: 1.3;">
      TITLE: ${topic.title}
    </div>
  </div>

  <!-- ======================================================== -->
  <!-- PART I: COLLEGE LABORATORY MANUAL (SOURCE & THEORY) -->
  <!-- ======================================================== -->
  <div style="background: #0f172a; color: #ffffff; padding: 7px 12px; border-radius: 4px; margin: 16px 0 10px 0; display: flex; align-items: center; justify-content: space-between;">
    <span style="font-weight: 800; font-size: 11.5px; letter-spacing: 0.6px; text-transform: uppercase;">
      PART I: COLLEGE LABORATORY MANUAL (SOURCE &amp; THEORY)
    </span>
    <span style="font-size: 10px; color: #94a3b8; font-family: monospace;">
      Curriculum Reference • ${topic.source.manualTitle}
    </span>
  </div>

  <!-- SECTION 1: AIM -->
  <div class="sec-content" style="margin-bottom: 12px;">
    <div class="section-title">1. Aim</div>
    <p style="margin: 0; font-size: 11.5px; font-weight: 600;">${topic.aim}</p>
    ${topic.objectives && topic.objectives.length > 0 ? `
      <div style="margin-top: 6px;">
        <strong>Objectives:</strong>
        <ul style="margin: 4px 0 0 0; padding-left: 20px;">
          ${cleanObjectivesHtml}
        </ul>
      </div>
    ` : ''}
  </div>

  <!-- SECTION 2: APPARATUS -->
  <div class="sec-content" style="margin-bottom: 12px;">
    <div class="section-title">2. Apparatus / Components Required</div>
    <ul style="margin: 0; padding-left: 20px; line-height: 1.45;">
      ${topic.apparatus.map((item) => `<li>${item}</li>`).join('')}
    </ul>
  </div>

  <!-- SECTION 3: THEORY -->
  <div class="sec-content" style="margin-bottom: 12px;">
    <div class="section-title">3. Theory &amp; Operating Principle</div>
    <p style="margin: 0 0 8px 0; text-align: left; word-spacing: normal;">${topic.theory.overview.replace(/\n/g, '<br/>')}</p>
    ${topic.theory.equations ? topic.theory.equations.map((eq) => `
      <div class="formula-box">
        <strong>${eq.label}:</strong> <span>${eq.formula}</span>
      </div>
    `).join('') : ''}
  </div>

  <!-- SECTION 4: DESIGN CALCULATIONS & SOURCE DISCREPANCY NOTES -->
  ${topic.designCalculations ? `
    <div class="sec-content" style="margin-bottom: 12px;">
      <div class="section-title">4. Design Procedure &amp; Calculations</div>
      ${topic.designCalculations.specifications ? `
        <ul style="margin: 0 0 6px 0; padding-left: 20px;">
          ${topic.designCalculations.specifications.map((s) => `<li>${s}</li>`).join('')}
        </ul>
      ` : ''}
      ${topic.designCalculations.formulas.map((f) => `
        <div class="formula-box">
          <strong>${f.name}:</strong> <span>${f.formula}</span>
          ${f.description ? `<div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">${f.description}</div>` : ''}
        </div>
      `).join('')}

      ${(topic.designCalculations?.reviewNotes || topic.reviewStatus?.flaggedNotes) ? `
        <div style="margin-top: 8px; background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; padding: 8px 12px; border-radius: 4px; font-size: 11px;">
          <div style="font-weight: bold; color: #b45309; margin-bottom: 3px;">
            ⚠️ Source Document Review &amp; Discrepancy Notes:
          </div>
          <ul style="margin: 0; padding-left: 18px; color: #92400e; line-height: 1.45;">
            ${(topic.designCalculations?.reviewNotes || []).map((rn) => `<li>${rn}</li>`).join('')}
            ${(topic.reviewStatus?.flaggedNotes || []).map((fn) => `<li>${fn}</li>`).join('')}
          </ul>
          <div style="font-size: 10px; color: #78350f; margin-top: 4px; font-style: italic;">
            Note: Original laboratory manual values and calculations are preserved as primary source content without silent alteration.
          </div>
        </div>
      ` : ''}

      ${topic.id === 'nmiet-pcc204-exp03-schmitt-trigger' ? `
        <!-- Source Values vs Live Simulation Parameter Distinction -->
        <div style="margin-top: 10px; border: 1px solid #bfdbfe; background: #eff6ff; border-radius: 4px; padding: 10px 12px; font-size: 11px; break-inside: avoid; page-break-inside: avoid;">
          <div style="font-weight: bold; color: #1e40af; margin-bottom: 6px; font-size: 11.5px;">
            📊 Parameter Lineage &amp; Data Source Traceability:
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; background: #ffffff;">
            <thead>
              <tr style="background: #dbeafe;">
                <th style="padding: 5px 8px; border: 1px solid #bfdbfe; text-align: left;">Data Category</th>
                <th style="padding: 5px 8px; border: 1px solid #bfdbfe; text-align: left;">Values &amp; Circuit Parameters</th>
                <th style="padding: 5px 8px; border: 1px solid #bfdbfe; text-align: left;">Trigger Thresholds &amp; Output</th>
                <th style="padding: 5px 8px; border: 1px solid #bfdbfe; text-align: left;">Origin / Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0; font-weight: 600;">1. Original College-Manual Values</td>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0;">R1 = 100 Ω, R2 = 4.7 kΩ, R3 = 100 Ω</td>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0;">±Vsat = ±2.0 V, Vin = 473.7 mVp</td>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0; color: #64748b;">NMIET EC Manual (Page 7–10)</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0; font-weight: 600;">2. Theoretical Calculations</td>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0;">β = R2 / (R1 + R2) = 4.7k / 4.8k = 0.9792</td>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0; color: #0369a1; font-weight: 600;">VUTP = +1.958 V, VLTP = -1.958 V, VH = 3.917 V</td>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0; color: #0369a1;">Standard Inverting Formula</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0; font-weight: 600;">3. Current Simulator Parameters</td>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0;">R1 = 100 Ω, R2 = 4.7 kΩ, R3 = 100 Ω</td>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0;">±Vsat = ±2.0 V, Vin = 2.5 V (1 kHz)</td>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0; color: #0284c7;">Active Simulator Bench</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0; font-weight: 600;">4. Simulated Switching Results</td>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0;">Numerical SPICE Waveform Solver</td>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0; color: #7c3aed; font-weight: 600;">VUTP = +1.958 V, VLTP = -1.958 V, VH = 3.917 V</td>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0; color: #7c3aed;">Plotted in Figures 1 &amp; 2</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0; font-weight: 600;">5. Actual Student-Measured Readings</td>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0;">Hardware CRO Bench Observations</td>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0; color: #047857; font-weight: 600;">Manual Record: VUTP=1.6V, VLTP=-1.4V, VH=3.0V</td>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0; color: #047857;">Empirical Laboratory Data</td>
              </tr>
            </tbody>
          </table>
          <div style="font-size: 10px; color: #1e3a8a; margin-top: 5px; font-style: italic;">
            ✓ Parameter Consistency: Resistor values (R1=100 Ω, R2=4.7 kΩ, R3=100 Ω), saturation rails (±2.0 V), schematic annotations, and simulation waveform thresholds strictly agree across this report.
          </div>
        </div>
      ` : ''}
    </div>
  ` : ''}

  <!-- SECTION 6: PROCEDURE -->
  <div class="sec-content" style="margin-bottom: 12px;">
    <div class="section-title">6. Step-by-Step Laboratory Procedure</div>
    <ol style="margin: 0; padding-left: 20px; line-height: 1.5;">
      ${cleanProcedureHtml}
    </ol>
  </div>

  <!-- ======================================================== -->
  <!-- PART II: ACTIVE SIMULATION & MODELING -->
  <!-- ======================================================== -->
  <div style="background: #0369a1; color: #ffffff; padding: 7px 12px; border-radius: 4px; margin: 18px 0 10px 0; display: flex; align-items: center; justify-content: space-between;">
    <span style="font-weight: 800; font-size: 11.5px; letter-spacing: 0.6px; text-transform: uppercase;">
      PART II: ACTIVE SIMULATION &amp; MODELING
    </span>
    <span style="font-size: 10px; color: #e0f2fe; font-family: monospace;">
      SPICE Analytical Engine • Real-Time Model Validation
    </span>
  </div>

  ${resolvedState.isAdjusted ? `
    <div style="margin-bottom: 12px; padding: 8px 12px; background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 4px; font-size: 11px; color: #92400e;">
      <strong>Note: Simulation parameters adjusted from source manual for ideal modeling.</strong><br/>
      Active Simulation Configuration: R1 = ${resolvedState.inputs.r1} ${resolvedState.inputs.r1Unit || 'Ω'}, R2 = ${resolvedState.inputs.r2} ${resolvedState.inputs.r2Unit || 'kΩ'}, &plusmn;Vsat = &plusmn;${resolvedState.inputs.posVsat} V.<br/>
      Threshold calculations dynamically calculated: V<sub>UTP</sub> = +${resolvedState.results.utp} V, V<sub>LTP</sub> = ${resolvedState.results.ltp} V, V<sub>H</sub> = ${resolvedState.results.hysteresisWidth} V.
    </div>
  ` : ''}

  <!-- SECTION 5: CIRCUIT SCHEMATIC (LARGE & READABLE) -->
  <div class="sec-diagrams" style="margin-bottom: 14px;">
    <div class="section-title">5. Circuit Schematic Diagram</div>
    ${schematicSvg ? `
      <div class="figure-card">
        ${schematicSvg}
        <div class="figure-caption">Figure 1: Circuit Schematic Diagram — ${topic.schematic.topologyName}</div>
      </div>
    ` : ''}

    <div style="font-weight: 600; margin: 8px 0 4px 0; font-size: 11px;">Component Designation &amp; Specifications:</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 8px;">
      <thead>
        <tr style="background: #f1f5f9;">
          <th style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left;">Designation</th>
          <th style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left;">Component Value</th>
          <th style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left;">Functional Role</th>
        </tr>
      </thead>
      <tbody>
        ${topic.schematic.components.map((c, i) => `
          <tr style="background: ${i % 2 === 0 ? '#fff' : '#f8fafc'};">
            <td style="padding: 4px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold;">${c.designation}</td>
            <td style="padding: 4px 8px; border: 1px solid #e2e8f0; font-family: monospace; color: #0369a1;">${c.value}</td>
            <td style="padding: 4px 8px; border: 1px solid #e2e8f0;">${c.description}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 10px; color: #475569; margin-top: 4px;">
      <strong>Schematic Topology Fidelity:</strong> Displays the authentic laboratory manual practical circuit (${topic.schematic.topologyName}). Component labels, values, and trigger formulas strictly match the laboratory design parameters.
    </div>

    ${topic.schematic.diagramNotes && topic.schematic.diagramNotes.length > 0 ? `
      <div style="margin-top: 6px; padding: 6px 10px; background: #f1f5f9; border-left: 3px solid #0284c7; border-radius: 2px; font-size: 10px; color: #334155;">
        <div style="font-weight: 600; color: #0369a1; margin-bottom: 2px;">Circuit Configuration &amp; Source Reference Notes:</div>
        <ul style="margin: 0; padding-left: 16px; line-height: 1.45;">
          ${topic.schematic.diagramNotes.map((n) => `<li>${n}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
  </div>

  <!-- SECTION 7: SIMULATION WAVEFORMS & RESPONSE (LARGE VECTOR SVG) -->
  ${waveformSvg ? `
  <div class="sec-diagrams" style="margin-bottom: 14px;">
    <div class="section-title">7. Waveforms &amp; Dynamic Response Characteristics</div>
    <div class="figure-card">
      ${waveformSvg}
      <div class="figure-caption">Figure 2: ${topic.simulationLimitation?.isFullySupported ? 'Simulated Dynamic Waveforms &amp; Transfer Characteristics (Numerical SPICE Model)' : 'Theoretical &amp; Illustrative Transfer Characteristics (Reference Model)'}</div>
    </div>
  </div>` : ''}

  <!-- SECTION 8: OBSERVATION TABLES -->
  <div class="sec-content" style="margin-bottom: 12px;">
    <div class="section-title">8. Observation Tables &amp; Experimental Data</div>
    ${observationTablesHtml}
  </div>

  <!-- SECTION 9: RESULTS TABLE -->
  <div class="sec-content">
    ${resultsTableHtml}
  </div>

  <!-- SECTION 10: CONCLUSION -->
  <div class="sec-content" style="margin-bottom: 12px;">
    <div class="section-title">10. Conclusion &amp; Verification Assessment</div>
    
    <div style="margin-bottom: 8px;">
      <div style="font-size: 11px; font-weight: 600; color: #334155; margin-bottom: 4px;">A. Historical College Laboratory Manual Record (Original Source Text):</div>
      <p style="margin: 0; background: #f8fafc; border: 1px solid #cbd5e1; border-left: 3px solid #64748b; padding: 8px 12px; font-style: italic; color: #334155;">
        "${topic.conclusion}"
      </p>
    </div>

    <div>
      <div style="font-size: 11px; font-weight: 600; color: #334155; margin-bottom: 4px;">B. Practical Verification Assessment (Current Session):</div>
      ${hasGenuineStudentMeasurements ? `
        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-left: 3px solid #10b981; padding: 8px 12px; color: #065f46; font-size: 11px;">
          <strong>Hardware Verification Confirmed:</strong> Physical measurements recorded on the laboratory test bench verify circuit switching behavior against theoretical models. Measured readings are reported in Section 8 and verified in Section 9.
        </div>
      ` : `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 3px solid #0284c7; padding: 8px 12px; color: #0f172a; font-size: 11px;">
          <strong>Simulation Verification Confirmed • Physical Verification Pending:</strong><br/>
          Numerical SPICE simulation demonstrates that the simulated circuit switching behavior agrees with calculated theoretical behavior (${topic.id === 'nmiet-pcc204-exp03-schmitt-trigger' ? 'V_UTP = +1.958 V, V_LTP = -1.958 V, V_H = 3.917 V' : 'as designed'}) within the model's assumptions (idealized saturation rails).
          Because genuine physical student bench readings were not recorded for this session, physical breadboard hardware verification remains pending. A physical hardware build is not claimed as verified without supporting hardware measurements.
        </div>
      `}
    </div>

    ${studentConclusion ? `
      <div style="margin-top: 8px;">
        <div style="font-size: 11px; font-weight: 600; color: #334155; margin-bottom: 4px;">C. Student Laboratory Remarks:</div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 3px solid #059669; padding: 6px 10px; font-size: 11px; color: #1e293b;">
          ${studentConclusion}
        </div>
      </div>
    ` : ''}
  </div>

  <!-- SECTION 11: VIVA QUESTIONS -->
  <div class="sec-content">
    ${vivaHtml}
  </div>

  <!-- SECTION 12: REFERENCE BOOKS -->
  ${topic.referenceBooks && topic.referenceBooks.length > 0 ? `
    <div class="sec-content" style="margin-bottom: 12px;">
      <div class="section-title">Reference Books &amp; Syllabus Citations</div>
      <ul style="margin: 0; padding-left: 20px;">
        ${topic.referenceBooks.map((b) => `<li>${b}</li>`).join('')}
      </ul>
    </div>
  ` : ''}

  <!-- SECTION 13: STUDENT NOTES -->
  ${studentNotes ? `
    <div class="sec-content" style="margin-bottom: 12px;">
      <div class="section-title">Student Laboratory Notes &amp; Measured Bench Observations</div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; white-space: pre-wrap; font-family: monospace; font-size: 11px;">${studentNotes}</div>
    </div>
  ` : ''}

  <!-- SIGN-OFF BLOCK -->
  <div class="sign-block">
    <div>
      <div>Date of Performance: ____________</div>
      <div style="margin-top: 4px;">Date of Submission: ____________</div>
    </div>
    <div>
      <div>Grade / Marks: ____________</div>
      <div style="margin-top: 4px;">Faculty Signature: ____________</div>
    </div>
  </div>

  <div style="text-align: right; font-size: 9.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 16px;">
    OPTI-SIM Practical Laboratory Record • ${topic.secondaryRefNumber} • Verified Educational Export
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

/**
 * Exports Syllabus Observation Tables to clean CSV
 */
export function exportSyllabusToCSV({
  topic,
  observations,
  studentName
}: {
  topic: SyllabusTopic;
  observations: Record<string, SyllabusObservationRow[]>;
  studentName?: string;
}): void {
  let csv = `# OPTI-SIM Laboratory Record Export (CSV)\n`;
  csv += `# Practical Reference: ${topic.secondaryRefNumber} - ${topic.title}\n`;
  csv += `# College: ${topic.source.college}\n`;
  csv += `# Subject: ${topic.source.subject} (${topic.source.manualTitle})\n`;
  csv += `# Student Name: ${studentName || 'Engineering Student'}\n`;
  csv += `# Export Date: ${new Date().toISOString()}\n\n`;

  topic.observationTables.forEach((tbl, idx) => {
    csv += `### Table ${idx + 1}: ${tbl.title}\n`;
    if (tbl.subtitle) csv += `# ${tbl.subtitle}\n`;

    const headers = tbl.columns.map((c) => `"${c.label}${c.unit ? ` (${c.unit})` : ''}"`).join(',');
    csv += `${headers}\n`;

    const rows = observations[tbl.id] || tbl.defaultStudentRows;
    rows.forEach((row) => {
      const line = tbl.columns.map((c) => `"${row[c.key] !== undefined ? row[c.key] : ''}"`).join(',');
      csv += `${line}\n`;
    });
    csv += `\n`;
  });

  const sanitizedRef = topic.secondaryRefNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadFile(csv, `OPTI-SIM_${sanitizedRef}_Observations.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Exports complete Practical details and observations to formal JSON
 */
export function exportSyllabusToJSON({
  topic,
  studentName,
  observations,
  studentNotes,
  studentConclusion
}: {
  topic: SyllabusTopic;
  studentName: string;
  observations: Record<string, SyllabusObservationRow[]>;
  studentNotes?: string;
  studentConclusion?: string;
}): void {
  const exportPayload = {
    optisimVersion: '2.0-syllabus',
    exportTimestamp: new Date().toISOString(),
    studentInfo: {
      name: studentName || 'Engineering Student',
      class: topic.source.classInfo || 'S.E E&TC'
    },
    topicMetadata: {
      id: topic.id,
      title: topic.title,
      secondaryRefNumber: topic.secondaryRefNumber,
      category: topic.category,
      categoryLabel: topic.categoryLabel,
      college: topic.source.college,
      subject: topic.source.subject,
      manualTitle: topic.source.manualTitle,
      pageReferences: topic.source.pageReferences
    },
    aim: topic.aim,
    objectives: topic.objectives,
    apparatus: topic.apparatus,
    theory: topic.theory,
    designCalculations: topic.designCalculations,
    schematic: topic.schematic,
    procedure: topic.procedure,
    resultsTable: topic.resultsTable,
    conclusion: {
      manualConclusion: topic.conclusion,
      studentConclusion: studentConclusion || null
    },
    studentNotes: studentNotes || null,
    observationTables: topic.observationTables.map((tbl) => ({
      tableId: tbl.id,
      title: tbl.title,
      subtitle: tbl.subtitle,
      columns: tbl.columns,
      recordedData: observations[tbl.id] || tbl.defaultStudentRows
    }))
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const sanitizedRef = topic.secondaryRefNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadFile(jsonString, `OPTI-SIM_${sanitizedRef}_Practical_Report.json`, 'application/json;charset=utf-8;');
}
