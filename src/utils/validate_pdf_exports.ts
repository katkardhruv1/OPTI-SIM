import { generateSchematicSvg, generateWaveformGraphSvg } from './pdfAssetRenderer';
import { SYLLABUS_PRACTICALS_REGISTRY } from '../data/syllabusRegistry';
import { getDefaultInputsForCircuit, computeResultsForCircuit } from './circuitStateBridge';
import { printExperimentReport } from './exportEngine';
import { printSyllabusReport } from './syllabusExport';

const testCircuits = [
  'inverting-amplifier',
  'integrator',
  'differentiator',
  'low-pass-filter',
  'comparator',
  'schmitt-trigger',
  'pwm-generator',
  'dac',
  'adc',
  'pcc-cs-204-exp04'
];

console.log('====================================================');
console.log('PHASE 14B PDF EXPORT & CIRCUIT/GRAPH CONSISTENCY TESTS');
console.log('====================================================');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${msg}`);
  } else {
    console.error(`[FAIL] ${msg}`);
  }
}

// 1. Standard Circuit Modules Verification
for (const circuitId of testCircuits) {
  console.log(`\n--- Testing Circuit: ${circuitId} ---`);
  const inputs = getDefaultInputsForCircuit(circuitId);
  const results = computeResultsForCircuit(circuitId, inputs);

  // Schematic Vector SVG
  const schematicSvg = generateSchematicSvg(circuitId, inputs, results);
  assert(schematicSvg.includes('<svg'), `${circuitId} schematic generates valid root <svg> tag`);
  assert(schematicSvg.includes('viewBox="0 0 760 380"'), `${circuitId} schematic preserves 760x380 viewBox aspect ratio`);
  assert(schematicSvg.includes('</svg>'), `${circuitId} schematic has closing </svg> tag`);
  assert(!schematicSvg.includes('NaN'), `${circuitId} schematic contains no NaN values`);
  assert(!schematicSvg.includes('undefined'), `${circuitId} schematic contains no undefined string values`);

  // Waveform / Characteristic Graph Vector SVG
  const graphSvg = generateWaveformGraphSvg(circuitId, inputs, results);
  assert(graphSvg.includes('<svg'), `${circuitId} graph generates valid root <svg> tag`);
  assert(graphSvg.includes('viewBox="0 0 760 340"') || graphSvg.includes('viewBox="0 0 760 560"'), `${circuitId} graph preserves viewBox aspect ratio`);
  assert(graphSvg.includes('</svg>'), `${circuitId} graph has closing </svg> tag`);
  assert(!graphSvg.includes('NaN'), `${circuitId} graph contains no NaN values`);
  assert(!graphSvg.includes('undefined'), `${circuitId} graph contains no undefined string values`);

  // Check graph content specificity
  if (circuitId === 'low-pass-filter') {
    assert(graphSvg.includes('BODE MAGNITUDE RESPONSE'), 'LPF graph is actual Bode plot with frequency log scale');
    assert(graphSvg.includes('fc ='), 'LPF graph marks cutoff frequency fc');
  } else if (circuitId === 'schmitt-trigger') {
    assert(graphSvg.includes('PANEL A') && graphSvg.includes('PANEL B'), 'Schmitt Trigger contains stacked dual-panel layout');
    assert(graphSvg.includes('VOLTAGE TRANSFER CHARACTERISTIC'), 'Schmitt Trigger Panel A has calibrated Hysteresis curve');
    assert(graphSvg.includes('DYNAMIC TIME-DOMAIN SWITCHING'), 'Schmitt Trigger Panel B has dynamic time-domain waveforms');
  } else if (circuitId === 'pwm-generator') {
    assert(graphSvg.includes('PWM MODULATION WAVEFORMS') && graphSvg.includes('Duty Cycle'), 'PWM graph includes carrier, control level, and modulated pulse');
  } else if (circuitId === 'dac') {
    assert(graphSvg.includes('DAC QUANTIZATION STAIRCASE'), 'DAC graph is staircase quantization characteristic');
  } else if (circuitId === 'adc') {
    assert(graphSvg.includes('ADC CONVERSION CHARACTERISTIC'), 'ADC graph is conversion staircase characteristic');
  } else if (circuitId === 'pcc-cs-204-exp04') {
    assert(graphSvg.includes('Waveform graph not simulated in browser runtime'), 'PCC-CS-204 Exp 04 discrete topic honestly discloses simulation limitation');
    assert(schematicSvg.includes('DISCRETE JFET COMMON-SOURCE AMPLIFIER'), 'PCC-CS-204 Exp 04 contains authentic JFET schematic');
  }
}

// 2. Specific Verification for NMIET Schmitt Trigger Practical (Topic 5)
console.log('\n--- Specific Verification: NMIET Exp 03 Schmitt Trigger Practical ---');
const schmittTopic = SYLLABUS_PRACTICALS_REGISTRY.find((t) => t.id === 'nmiet-pcc204-exp03-schmitt-trigger')!;
assert(!!schmittTopic, 'NMIET Schmitt Trigger practical found in syllabus registry');

const schmittSchematic = generateSchematicSvg(schmittTopic.id);
assert(schmittSchematic.includes('INVERTING OP-AMP SCHMITT TRIGGER SCHEMATIC'), 'Schmitt Trigger practical exports authentic Inverting topology schematic');
assert(schmittSchematic.includes('R1 = 100 Ω'), 'Schmitt Trigger schematic includes authentic R1 = 100 Ω feedback divider');
assert(schmittSchematic.includes('R2 = 4.7 kΩ'), 'Schmitt Trigger schematic includes authentic R2 = 4.7 kΩ ground-leg divider');
assert(schmittSchematic.includes('R3 = 100 Ω'), 'Schmitt Trigger schematic includes authentic R3 = 100 Ω input resistor');
assert(!schmittSchematic.includes('100 Ω (or 1 kΩ)'), 'Active schematic removes ambiguous "100 Ω (or 1 kΩ)" label');
assert(!schmittSchematic.includes('4.7 kΩ (or 56 kΩ)'), 'Active schematic removes ambiguous "4.7 kΩ (or 56 kΩ)" label');
assert(schmittSchematic.includes('V_UTP = β × (+Vsat) = +1.958 V'), 'Schmitt Trigger schematic displays calculated V_UTP = +1.958 V');
assert(schmittSchematic.includes('V_LTP = β × (-Vsat) = -1.958 V'), 'Schmitt Trigger schematic displays calculated V_LTP = -1.958 V');
assert(schmittSchematic.includes('VH = V_UTP - V_LTP = 3.917 V'), 'Schmitt Trigger schematic displays VH = 3.917 V');

const schmittGraph = generateWaveformGraphSvg(schmittTopic.id);
assert(schmittGraph.includes('viewBox="0 0 760 560"'), 'Schmitt Trigger graph uses large 560px high A4-readable canvas');
assert(schmittGraph.includes('PANEL A: VOLTAGE TRANSFER CHARACTERISTIC &amp; HYSTERESIS CURVE'), 'Schmitt Trigger graph exports Panel A Hysteresis loop');
assert(schmittGraph.includes('PANEL B: DYNAMIC TIME-DOMAIN SWITCHING WAVEFORMS'), 'Schmitt Trigger graph exports Panel B Time-Domain switching');
assert(schmittGraph.includes('Trace 1: Vin'), 'Panel B clearly identifies Trace 1: Vin');
assert(schmittGraph.includes('Trace 2: Vout'), 'Panel B clearly identifies Trace 2: Vout');
assert(schmittGraph.includes('Ch 1: Vin(t)') && schmittGraph.includes('Ch 2: Vout(t)'), 'Panel B includes in-graph Ch 1 and Ch 2 tags');
assert(schmittGraph.includes('UTP (+1.958 V)'), 'Panel B clearly marks UTP (+1.958 V) horizontal guide line');
assert(schmittGraph.includes('LTP (-1.958 V)'), 'Panel B clearly marks LTP (-1.958 V) horizontal guide line');
assert(schmittGraph.includes('V_UTP = +1.958 V'), 'Panel A marks +1.958 V threshold');
assert(schmittGraph.includes('V_LTP = -1.958 V'), 'Panel A marks -1.958 V threshold');
assert(schmittGraph.includes('V_H = 3.917 V'), 'Panel A marks V_H = 3.917 V hysteresis width');
assert(schmittGraph.includes('Rising Vin (Vout = +Vsat) →'), 'Panel A contains top-branch rising direction arrow and label');
assert(schmittGraph.includes('Toggles to -Vsat ↓'), 'Panel A contains downward switching toggle arrow at VUTP');
assert(schmittGraph.includes('← Falling Vin (Vout = -Vsat)'), 'Panel A contains bottom-branch falling direction arrow and label');
assert(schmittGraph.includes('↑ Toggles to +Vsat'), 'Panel A contains upward switching toggle arrow at VLTP');
assert(!schmittGraph.includes('>1.6V<') && !schmittGraph.includes('>-1.6V<'), 'Panel A removes misleading ±1.6V grid line ticks');

// 3. College Practicals Coverage across all 8 Topics
console.log('\n--- Testing All 8 College Practicals in Registry ---');
for (const topic of SYLLABUS_PRACTICALS_REGISTRY) {
  const sSvg = generateSchematicSvg(topic.id) || (topic.mappedCircuitId ? generateSchematicSvg(topic.mappedCircuitId) : '');
  const gSvg = generateWaveformGraphSvg(topic.id) || (topic.mappedCircuitId ? generateWaveformGraphSvg(topic.mappedCircuitId) : '');
  assert(sSvg.length > 500, `Topic ${topic.id} (${topic.secondaryRefNumber}) produces substantial schematic SVG (${sSvg.length} bytes)`);
  assert(gSvg.length > 500, `Topic ${topic.id} (${topic.secondaryRefNumber}) produces substantial graph SVG (${gSvg.length} bytes)`);
}

// 4. Test Document HTML Generation & Formatting Quality
console.log('\n--- Testing Full HTML Report Generation & Formatting ---');
let capturedExperimentHtml = '';
let capturedSyllabusHtml = '';

// Setup global mock window for Node test environment
(globalThis as any).window = {
  open: (_url: string, _target: string, _features: string) => {
    return {
      document: {
        open: () => {},
        write: (html: string) => {
          if (html.includes('OPTI-SIM Experiment')) {
            capturedExperimentHtml = html;
          } else {
            capturedSyllabusHtml = html;
          }
        },
        close: () => {}
      }
    };
  }
};

// Re-export Schmitt Trigger practical report to verify all requirements
// Re-export Schmitt Trigger practical report (simulating potential activeState from generic circuit module)
printSyllabusReport({
  topic: schmittTopic,
  studentName: 'Katkar Testing Scholar',
  observations: {},
  studentConclusion: 'Verified switching threshold operation on CRO.',
  studentNotes: 'Measured UTP and LTP trigger voltages.',
  activeState: {
    // Note: passing generic Schmitt inputs to test that practical report is immune to generic ±12V / ±4V leakage
    inputs: { r1: 10, r1Unit: 'kΩ', rf: 20, rfUnit: 'kΩ', posVsat: 12, negVsat: -12 },
    results: { utp: 4.0, ltp: -4.0, hysteresisWidth: 8.0 }
  }
});

// Verify Requirement 1: Parameter Lineage & Distinction
assert(capturedSyllabusHtml.includes('Parameter Lineage &amp; Data Source Traceability'), 'Report contains Parameter Lineage & Data Source Traceability section');
assert(capturedSyllabusHtml.includes('1. Original College-Manual Values'), 'Distinguishes Original College-Manual Values');
assert(capturedSyllabusHtml.includes('2. Theoretical Calculations'), 'Distinguishes Theoretical Calculations');
assert(capturedSyllabusHtml.includes('3. Current Simulator Parameters'), 'Distinguishes Current Simulator Parameters');
assert(capturedSyllabusHtml.includes('4. Simulated Switching Results'), 'Distinguishes Simulated Switching Results');
assert(capturedSyllabusHtml.includes('5. Actual Student-Measured Readings'), 'Distinguishes Actual Student-Measured Readings');

// Verify Requirement 2: Schematic Topology & Parameter Consistency
assert(capturedSyllabusHtml.includes('INVERTING OP-AMP SCHMITT TRIGGER SCHEMATIC (NMIET EXP 03)'), 'Exported report contains authentic Inverting Schmitt Trigger schematic');
assert(capturedSyllabusHtml.includes('R1 = 100 Ω'), 'Schematic includes R1 = 100 Ω');
assert(capturedSyllabusHtml.includes('R2 = 4.7 kΩ'), 'Schematic includes R2 = 4.7 kΩ');
assert(capturedSyllabusHtml.includes('R3 = 100 Ω'), 'Schematic includes R3 = 100 Ω');
assert(!capturedSyllabusHtml.includes('100 Ω (or 1 kΩ)'), 'Active schematic removes ambiguous "100 Ω (or 1 kΩ)" label');
assert(!capturedSyllabusHtml.includes('4.7 kΩ (or 56 kΩ)'), 'Active schematic removes ambiguous "4.7 kΩ (or 56 kΩ)" label');
assert(capturedSyllabusHtml.includes('Circuit Configuration &amp; Source Reference Notes:'), 'Section 5 renders dedicated source reference notes box');
assert(capturedSyllabusHtml.includes('Alternative Manual Reference (Page 9 Multisim): R1 = 1 kΩ, R2 = 56 kΩ'), 'Alternative manual Multisim circuit preserved as source reference material');

// Verify Requirement 3: Threshold Calculations & Formula
assert(capturedSyllabusHtml.includes('β = R2 / (R1 + R2)'), 'Calculations use divider formula β = R2 / (R1 + R2)');
assert(capturedSyllabusHtml.includes('0.9792'), 'Feedback factor β is 0.9792');
assert(!capturedSyllabusHtml.includes('V_UTP = +4.00V') && !capturedSyllabusHtml.includes('V_UTP = +4.00 V'), 'Practical report does NOT display generic ±4 V thresholds');
assert(capturedSyllabusHtml.includes('+1.958 V'), 'Theoretical and simulated threshold is +1.958 V');
assert(capturedSyllabusHtml.includes('-1.958 V'), 'Theoretical and simulated threshold is -1.958 V');
assert(capturedSyllabusHtml.includes('3.917 V'), 'Theoretical and simulated hysteresis width is 3.917 V');

// Verify Requirement 4: Graphs Alignment with Simulator Data
assert(capturedSyllabusHtml.includes('PANEL A: VOLTAGE TRANSFER CHARACTERISTIC'), 'Exported report contains large Panel A Hysteresis Curve');
assert(capturedSyllabusHtml.includes('PANEL B: DYNAMIC TIME-DOMAIN SWITCHING'), 'Exported report contains large Panel B Dynamic Switching Waveforms');
assert(capturedSyllabusHtml.includes('V_UTP = +1.958 V'), 'Panel A threshold marker is calibrated to +1.958 V');
assert(capturedSyllabusHtml.includes('Figure 2: Simulated Dynamic Waveforms &amp; Transfer Characteristics (Numerical SPICE Model)'), 'Figure 2 accurately labeled as Simulated Dynamic Waveforms (Numerical SPICE Model)');

// Verify Requirement 5: Observation Tables, Student Measurements, and Conclusion
assert(!capturedSyllabusHtml.includes('(V) (V)'), 'No duplicate "(V) (V)" in table headings');
assert(!capturedSyllabusHtml.includes('(mV / V) (mV / V)'), 'No duplicate "(mV / V) (mV / V)" in table headings');
assert(!capturedSyllabusHtml.includes('(kΩ) (kΩ)'), 'No duplicate "(kΩ) (kΩ)" in table headings');
assert(capturedSyllabusHtml.includes('Simulated Result (SPICE)'), 'Results table includes dedicated Simulated Result (SPICE) column');
assert(capturedSyllabusHtml.includes('Source-Manual Reading'), 'Results table includes dedicated Source-Manual Reading column');
assert(capturedSyllabusHtml.includes('Actual Student Measurement'), 'Results table includes dedicated Actual Student Measurement column');
assert(capturedSyllabusHtml.includes('Hardware Verification Disclaimer:'), 'Results table includes explicit hardware verification disclaimer');
assert(capturedSyllabusHtml.includes('Reference Laboratory Readings (Recorded in College Manual)'), 'Preserves actual source manual readings in observation table');
assert(capturedSyllabusHtml.includes('Student Measured / Bench Observations'), 'Separates student observations from reference readings');

// Verify student measurements are guarded from simulator parameter leakage (+12V / -12V)
assert(!capturedSyllabusHtml.includes('color: #047857; font-style: normal;">+12 V</td>'), 'Results table does NOT leak +12V simulator rail into student measurement');
assert(!capturedSyllabusHtml.includes('color: #047857; font-style: normal;">-12 V</td>'), 'Results table does NOT leak -12V simulator rail into student measurement');
assert(capturedSyllabusHtml.includes('Not recorded'), 'Unrecorded student measurements marked as "Not recorded" without fabrication');
assert(capturedSyllabusHtml.includes('Observation Reading Discrepancy Note (Page 10 Manual Entry)'), 'Displays discrepancy callout for 0.2 V vs 3.0 V');
assert(capturedSyllabusHtml.includes('0.2 V results from subtracting threshold magnitudes'), 'Discrepancy note explains |1.6| - |-1.4| = 0.2 V magnitude subtraction');

// Verify Conclusion Section Structure & Honesty
assert(capturedSyllabusHtml.includes('A. Historical College Laboratory Manual Record (Original Source Text):'), 'Conclusion presents historical college manual text');
assert(capturedSyllabusHtml.includes('The Schmitt trigger ckt was successfully implemented using OP-Amp 741.'), 'Preserves original historical manual conclusion');
assert(capturedSyllabusHtml.includes('B. Practical Verification Assessment (Current Session):'), 'Conclusion presents current session verification assessment');
assert(capturedSyllabusHtml.includes('Simulation Verification Confirmed • Physical Verification Pending:'), 'Accurately states simulation verified and physical hardware verification pending');
assert(capturedSyllabusHtml.includes('A physical hardware build is not claimed as verified without supporting hardware measurements.'), 'Honest disclosure that physical build is not claimed without measurements');

// Test student observation derivation: VH = VUTP - VLTP only when both thresholds present
let studentTestHtml = '';
(globalThis as any).window.open = () => ({
  document: {
    open: () => {},
    write: (html: string) => { studentTestHtml = html; },
    close: () => {}
  }
});
printSyllabusReport({
  topic: schmittTopic,
  studentName: 'Katkar Student Test',
  observations: {
    'obs-nmiet-schmitt': [
      { id: 'st-complete', param: 'Trial 1 (Complete)', posVsat: 2.0, negVsat: -2.0, vutp: 1.6, vltp: -1.4, vh: '' },
      { id: 'st-incomplete', param: 'Trial 2 (Incomplete)', posVsat: 2.0, negVsat: -2.0, vutp: 1.6, vltp: '', vh: '' }
    ]
  }
});
assert(studentTestHtml.includes('3.0 V') || studentTestHtml.includes('3 V') || studentTestHtml.includes('3.00'), 'Student row with VUTP=1.6 and VLTP=-1.4 derives VH = 3.0 V');
assert(studentTestHtml.includes('Trial 2 (Incomplete)'), 'Incomplete student row is rendered');
assert(studentTestHtml.includes('Actual Student Measurement'), 'Results table shows Actual Student Measurement column');

// Verify Requirement 6: PDF Formatting & Source Discrepancies
assert(capturedSyllabusHtml.includes('Source Document Review &amp; Discrepancy Notes'), 'Exported report displays transparent review notes for source manual discrepancies');
assert(capturedSyllabusHtml.includes('Multisim schematic on Page 9 shows R1 = 1 kΩ, R2 = 56 kΩ'), 'Discrepancy note cites the exact Multisim vs handwritten values');
assert(!capturedSyllabusHtml.includes('1. 1.'), 'No "1. 1." repeated numbering in procedure or objectives');
assert(!capturedSyllabusHtml.includes('2. 2.'), 'No "2. 2." repeated numbering in procedure or objectives');
assert(!capturedSyllabusHtml.includes('3. 3.'), 'No "3. 3." repeated numbering in procedure or objectives');
assert(capturedSyllabusHtml.includes('display: table-header-group'), 'Table headers configured to repeat across pages');
assert(!capturedSyllabusHtml.includes('page-break-before: always'), 'Forced page-breaks removed to avoid blank pages');

// Test one additional College Practical: Integrator (Topic 4: NMIET Exp 02)
console.log('\n--- Testing Additional College Practical: Integrator (NMIET Exp 02) ---');
const integratorTopic = SYLLABUS_PRACTICALS_REGISTRY.find((t) => t.id === 'nmiet-pcc204-exp02-integrator')!;
assert(!!integratorTopic, 'NMIET Integrator practical found in registry');

let integratorHtml = '';
(globalThis as any).window.open = () => ({
  document: {
    open: () => {},
    write: (html: string) => { integratorHtml = html; },
    close: () => {}
  }
});

printSyllabusReport({
  topic: integratorTopic,
  studentName: 'Second College Practical Test',
  observations: {}
});

assert(!integratorHtml.includes('1. 1.'), 'Integrator report has no repeated numbering "1. 1."');
assert(integratorHtml.includes('PRACTICAL OP-AMP INTEGRATOR') || integratorHtml.includes('Practical Inverting Op-Amp Integrator'), 'Integrator report embeds authentic Integrator schematic');
assert(integratorHtml.includes('Table 1:'), 'Integrator report includes observation table');
assert(integratorHtml.includes('Source Document Review &amp; Discrepancy Notes'), 'Integrator report includes discrepancy note for Rf=15.9k vs 1.5k');

// Test one existing OPTI-SIM Circuit: Inverting Amplifier
console.log('\n--- Testing Existing OPTI-SIM Circuit: Inverting Amplifier ---');
let experimentHtml = '';
(globalThis as any).window.open = () => ({
  document: {
    open: () => {},
    write: (html: string) => { experimentHtml = html; },
    close: () => {}
  }
});

printExperimentReport({
  title: 'Inverting Op-Amp Amplifier',
  experimentNumber: 1,
  aim: 'To design, simulate and verify the operation of an inverting op-amp amplifier.',
  theory: {
    principle: 'The inverting amplifier produces an output signal that is 180 degrees out of phase with the input.',
    mainEquation: 'Vout = -(Rf / Rin) * Vin',
    assumptions: ['Infinite open loop gain', 'Infinite input impedance', 'Zero output impedance'],
    circuitRelationship: 'Closed loop gain is determined by feedback resistor ratio.'
  },
  formulas: [{ label: 'Voltage Gain', formula: 'Av = -Rf / Rin', description: 'Closed-loop inverting gain' }],
  procedure: ['1. Connect the dual DC power supply.', '2. Set input frequency to 1 kHz.', '3. Observe input and output on DSO.'],
  comparison: [{ parameter: 'Voltage Gain', theoretical: -5, simulated: -5.02, errorPercent: 0.4, unit: '' }],
  observations: [],
  observationColumns: [
    { key: 'vin', label: 'Vin', unit: 'V' },
    { key: 'rin', label: 'Rin', unit: 'kΩ' },
    { key: 'rf', label: 'Rf', unit: 'kΩ' }
  ],
  resultStatement: 'The inverting amplifier circuit was successfully modeled and verified.',
  conclusion: 'The closed-loop inverting voltage gain closely matches theoretical calculations.',
  parameters: { vin: 2, rin: 10, rf: 50 },
  studentName: 'Existing Circuit Group',
  circuitId: 'inverting-amplifier',
  activeResults: { av: -5, vout: -10 }
});

assert(!experimentHtml.includes('1. 1.'), 'Experiment report has no repeated numbering "1. 1."');
assert(experimentHtml.includes('INVERTING OP-AMP AMPLIFIER SCHEMATIC'), 'Experiment report embeds large Figure 1 schematic');
assert(experimentHtml.includes('TIME-DOMAIN OSCILLOSCOPE WAVEFORMS'), 'Experiment report embeds large Figure 2 actual waveform graph');
assert(experimentHtml.includes('display: table-header-group'), 'Experiment report repeats table headers across pages');
assert(experimentHtml.includes('No student observations entered'), 'Experiment report cleanly notes when no observations are entered');

// 5. PHASE 17 SPECIFIC CHECKS
console.log('\n--- Phase 17 Specific Acceptance Tests ---');

// Check Part I and Part II Explicit Separation
assert(capturedSyllabusHtml.includes('PART I: COLLEGE LABORATORY MANUAL (SOURCE &amp; THEORY)'), 'Report includes explicit Part I: Source & Theory banner');
assert(capturedSyllabusHtml.includes('PART II: ACTIVE SIMULATION &amp; MODELING'), 'Report includes explicit Part II: Active Simulation & Modeling banner');

// Check Clean observation table headers (no composite mV / V or Vp / Vpp)
assert(!capturedSyllabusHtml.includes('(mV / V)'), 'Observation table headers do not have composite "(mV / V)"');
assert(!capturedSyllabusHtml.includes('(Vp / Vpp)'), 'Observation table headers do not have composite "(Vp / Vpp)"');

// Test Adjusted Simulation export (e.g. customized bench parameters)
let adjustedSchmittHtml = '';
(globalThis as any).window.open = () => ({
  document: {
    open: () => {},
    write: (html: string) => { adjustedSchmittHtml = html; },
    close: () => {}
  }
});
printSyllabusReport({
  topic: schmittTopic,
  studentName: 'Adjusted Simulation Test',
  observations: {},
  activeState: {
    inputs: { circuitId: schmittTopic.id, topology: 'inverting', r1: 10, r1Unit: 'kΩ', r2: 4.7, r2Unit: 'kΩ', posVsat: 2.0, negVsat: -2.0 },
    results: { utp: 0.639, ltp: -0.639, hysteresisWidth: 1.278 }
  }
});
assert(adjustedSchmittHtml.includes('Note: Simulation parameters adjusted from source manual for ideal modeling.'), 'Displays automated note when simulation parameters differ from source manual');
assert(adjustedSchmittHtml.includes('R1 = 10 kΩ'), 'Adjusted schematic reflects active simulation R1=10 kΩ');
assert(adjustedSchmittHtml.includes('0.639 V') || adjustedSchmittHtml.includes('0.64 V'), 'Thresholds dynamically calculated from active simulation parameters');

// Test Linear Circuit: Low Pass Filter PDF Export
console.log('\n--- Testing Linear Circuit (Low Pass Filter) PDF Export ---');
let lpfHtml = '';
(globalThis as any).window.open = () => ({
  document: {
    open: () => {},
    write: (html: string) => { lpfHtml = html; },
    close: () => {}
  }
});
printExperimentReport({
  title: 'Active First-Order Low Pass Filter',
  experimentNumber: 4,
  aim: 'To design, simulate and plot the frequency response of a 1st-order active low-pass filter.',
  theory: {
    principle: 'Active filters use op-amps to provide passband gain and frequency selectivity.',
    mainEquation: 'fc = 1 / (2 * pi * R * C)',
    assumptions: ['Ideal op-amp bandwidth', 'No capacitor ESR'],
    circuitRelationship: 'Roll-off of -20 dB/decade above cutoff frequency fc.'
  },
  formulas: [{ label: 'Cutoff Frequency', formula: 'fc = 1 / (2 * pi * R * C)', description: '3 dB Cutoff frequency' }],
  procedure: ['1. Connect the op-amp circuit.', '2. Vary input frequency from 10 Hz to 100 kHz.', '3. Record output amplitude and calculate gain in dB.'],
  comparison: [{ parameter: 'Cutoff Frequency (fc)', theoretical: 1591.5, simulated: 1590, errorPercent: 0.1, unit: 'Hz' }],
  observations: [],
  observationColumns: [
    { key: 'freq', label: 'Frequency', unit: 'Hz' },
    { key: 'vin', label: 'Vin', unit: 'V' },
    { key: 'vout', label: 'Vout', unit: 'V' },
    { key: 'gainDb', label: 'Gain', unit: 'dB' }
  ],
  resultStatement: 'The low pass filter frequency response was verified.',
  conclusion: 'The -3 dB cutoff frequency closely matches theoretical design calculations.',
  parameters: { r: 10, c: 0.01, passbandGain: 1 },
  studentName: 'Linear Filter Test',
  circuitId: 'low-pass-filter',
  activeResults: { fc: 1591.55 }
});

assert(lpfHtml.includes('BODE MAGNITUDE RESPONSE: LOW-PASS FILTER'), 'LPF export embeds actual Bode magnitude plot');
assert(lpfHtml.includes('fc = 1591.6 Hz (-3 dB point)') || lpfHtml.includes('1591.5'), 'LPF export marks accurate cutoff frequency');
assert(lpfHtml.includes('simulated behavior agrees with theoretical calculations'), 'LPF conclusion states simulated behavior agrees with theoretical calculations');
assert(lpfHtml.includes('physical breadboard hardware testing remains pending'), 'LPF conclusion states physical hardware testing remains pending when unrecorded');

console.log(`\n====================================================`);
console.log(`FINAL VALIDATION SUMMARY: ${passedTests} / ${totalTests} tests passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
console.log(`====================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
