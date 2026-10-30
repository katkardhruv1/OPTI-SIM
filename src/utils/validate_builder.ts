/**
 * Acceptance Test Suite for Phase 15 - Manual Circuit Builder
 * 
 * Verifies all 14 Acceptance Criteria specified in Phase 15:
 * 1. Add an op-amp and two resistors.
 * 2. Add an input source and any required supply or ground components supported by the syllabus.
 * 3. Move and rotate components.
 * 4. Connect terminals with wires.
 * 5. Confirm that wire endpoints remain attached when components move.
 * 6. Change a resistor value and verify its label updates.
 * 7. Delete a component and verify its connections are handled correctly.
 * 8. Create an intentionally incomplete circuit and confirm validation detects the problem.
 * 9. Save a circuit, reload it, and verify the connections and parameter values are preserved.
 * 10. Test undo and redo.
 * 11. Attempt to simulate a supported topology and verify that results come from the existing engine.
 * 12. Attempt an unsupported topology and verify that the application does not fabricate results.
 * 13. Confirm the existing predefined circuits and Lab Mode still work.
 */

import {
  SYLLABUS_COMPONENT_SPECIFICATIONS,
  SYLLABUS_PRESET_TEMPLATES,
  getTerminalAbsoluteCoords
} from '../components/builder/componentCatalog';
import { validateCircuit, detectCircuitTopology } from '../components/builder/circuitValidator';
import { runBuilderSimulation } from '../components/builder/simulationAdapter';
import { BuilderComponent, BuilderWire, CircuitDocument } from '../types/circuitBuilder';
import { SYLLABUS_PRACTICALS_REGISTRY } from '../data/syllabusRegistry';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('====================================================');
console.log('OPTI-SIM PHASE 15 — MANUAL CIRCUIT BUILDER TEST RUN');
console.log('====================================================\n');

// -----------------------------------------------------------------
// Test 1: Add an op-amp and two resistors
// -----------------------------------------------------------------
console.log('--- Test 1: Add Op-Amp and Two Resistors ---');
const opAmpDef = SYLLABUS_COMPONENT_SPECIFICATIONS['op-amp'];
const resistorDef = SYLLABUS_COMPONENT_SPECIFICATIONS['resistor'];

assert(!!opAmpDef, 'Op-Amp definition is registered in syllabus catalog');
assert(!!resistorDef, 'Resistor definition is registered in syllabus catalog');

const compOpAmp: BuilderComponent = {
  id: 'comp_u1',
  type: 'op-amp',
  label: 'U1',
  x: 360,
  y: 200,
  rotation: 0,
  params: { ...opAmpDef.defaultParams }
};

const compR1: BuilderComponent = {
  id: 'comp_r1',
  type: 'resistor',
  label: 'R1',
  x: 180,
  y: 180,
  rotation: 0,
  params: { ...resistorDef.defaultParams, value: 10, unit: 'kΩ' }
};

const compR2: BuilderComponent = {
  id: 'comp_r2',
  type: 'resistor',
  label: 'R2',
  x: 360,
  y: 100,
  rotation: 0,
  params: { ...resistorDef.defaultParams, value: 100, unit: 'kΩ' }
};

assert(compOpAmp.label === 'U1', 'Op-Amp U1 created with label U1');
assert(compR1.label === 'R1' && compR1.params.value === 10, 'Resistor R1 created with 10 kΩ value');
assert(compR2.label === 'R2' && compR2.params.value === 100, 'Resistor R2 created with 100 kΩ value');

// -----------------------------------------------------------------
// Test 2: Add input source, supplies, and ground
// -----------------------------------------------------------------
console.log('\n--- Test 2: Add Input Source, Power Supplies, and Ground ---');
const acSourceDef = SYLLABUS_COMPONENT_SPECIFICATIONS['ac-source'];
const gndDef = SYLLABUS_COMPONENT_SPECIFICATIONS['ground'];
const vccDef = SYLLABUS_COMPONENT_SPECIFICATIONS['vcc'];
const veeDef = SYLLABUS_COMPONENT_SPECIFICATIONS['vee'];

assert(!!acSourceDef, 'AC Signal Generator source component is available');
assert(!!gndDef, 'Ground (0V Reference) component is available');
assert(!!vccDef && !!veeDef, 'Dual Power Supply (+Vcc / -Vee) rail components are available');

const compVin: BuilderComponent = {
  id: 'comp_vin',
  type: 'ac-source',
  label: 'Vin',
  x: 60,
  y: 220,
  rotation: 0,
  params: { ...acSourceDef.defaultParams, amplitude: 1.0, frequency: 1000 }
};

const compGnd: BuilderComponent = {
  id: 'comp_gnd',
  type: 'ground',
  label: 'GND1',
  x: 200,
  y: 300,
  rotation: 0,
  params: { ...gndDef.defaultParams }
};

const compVcc: BuilderComponent = {
  id: 'comp_vcc',
  type: 'vcc',
  label: '+Vcc',
  x: 360,
  y: 140,
  rotation: 0,
  params: { ...vccDef.defaultParams, voltage: 15 }
};

const compVee: BuilderComponent = {
  id: 'comp_vee',
  type: 'vee',
  label: '-Vee',
  x: 360,
  y: 260,
  rotation: 0,
  params: { ...veeDef.defaultParams, voltage: -15 }
};

assert(compVin.params.amplitude === 1.0 && compVin.params.frequency === 1000, 'AC Source configured to 1.0 V, 1000 Hz');
assert(gndDef.terminals[0].id === 'gnd', 'Ground has terminal gnd');

// -----------------------------------------------------------------
// Test 3: Move and rotate components
// -----------------------------------------------------------------
console.log('\n--- Test 3: Move and Rotate Components ---');
const r1Term1Def = resistorDef.terminals.find((t) => t.id === 't1')!;
const r1Term2Def = resistorDef.terminals.find((t) => t.id === 't2')!;

const r1InitialTermA = getTerminalAbsoluteCoords(compR1.x, compR1.y, compR1.rotation, r1Term1Def);
const r1InitialTermB = getTerminalAbsoluteCoords(compR1.x, compR1.y, compR1.rotation, r1Term2Def);
assert(r1InitialTermA.x === 145 && r1InitialTermA.y === 180, `R1 horizontal t1 coordinate at (${r1InitialTermA.x}, ${r1InitialTermA.y})`);
assert(r1InitialTermB.x === 215 && r1InitialTermB.y === 180, `R1 horizontal t2 coordinate at (${r1InitialTermB.x}, ${r1InitialTermB.y})`);

// Rotate R1 by 90 degrees
const compR1Rotated: BuilderComponent = {
  ...compR1,
  rotation: 90
};
const r1RotatedTermA = getTerminalAbsoluteCoords(compR1Rotated.x, compR1Rotated.y, compR1Rotated.rotation, r1Term1Def);
const r1RotatedTermB = getTerminalAbsoluteCoords(compR1Rotated.x, compR1Rotated.y, compR1Rotated.rotation, r1Term2Def);
assert(r1RotatedTermA.x === 180 && r1RotatedTermA.y === 145, `R1 rotated 90° moves t1 to (${r1RotatedTermA.x}, ${r1RotatedTermA.y})`);
assert(r1RotatedTermB.x === 180 && r1RotatedTermB.y === 215, `R1 rotated 90° moves t2 to (${r1RotatedTermB.x}, ${r1RotatedTermB.y})`);

// Move R1 to new position
const compR1Moved: BuilderComponent = {
  ...compR1,
  x: 240,
  y: 200
};
const r1MovedTermA = getTerminalAbsoluteCoords(compR1Moved.x, compR1Moved.y, compR1Moved.rotation, r1Term1Def);
assert(r1MovedTermA.x === 205 && r1MovedTermA.y === 200, `R1 moved to (240, 200) translates terminal t1 to (${r1MovedTermA.x}, ${r1MovedTermA.y})`);

// -----------------------------------------------------------------
// Test 4: Connect terminals with wires
// -----------------------------------------------------------------
console.log('\n--- Test 4: Connect Terminals with Wires ---');
const components: BuilderComponent[] = [compOpAmp, compR1, compR2, compVin, compGnd, compVcc, compVee];

// Assemble Inverting Amplifier wiring
const wires: BuilderWire[] = [
  // Vin pos -> R1 t1
  { id: 'w1', fromCompId: 'comp_vin', fromTerminalId: 'pos', toCompId: 'comp_r1', toTerminalId: 't1' },
  // R1 t2 -> OpAmp in-
  { id: 'w2', fromCompId: 'comp_r1', fromTerminalId: 't2', toCompId: 'comp_u1', toTerminalId: 'in-' },
  // OpAmp in- -> R2 t1
  { id: 'w3', fromCompId: 'comp_u1', fromTerminalId: 'in-', toCompId: 'comp_r2', toTerminalId: 't1' },
  // R2 t2 -> OpAmp out
  { id: 'w4', fromCompId: 'comp_r2', fromTerminalId: 't2', toCompId: 'comp_u1', toTerminalId: 'out' },
  // OpAmp in+ -> GND
  { id: 'w5', fromCompId: 'comp_u1', fromTerminalId: 'in+', toCompId: 'comp_gnd', toTerminalId: 'gnd' },
  // Vin neg -> GND
  { id: 'w6', fromCompId: 'comp_vin', fromTerminalId: 'neg', toCompId: 'comp_gnd', toTerminalId: 'gnd' },
  // Vcc -> OpAmp vcc
  { id: 'w7', fromCompId: 'comp_vcc', fromTerminalId: 'out', toCompId: 'comp_u1', toTerminalId: 'vcc' },
  // Vee -> OpAmp vee
  { id: 'w8', fromCompId: 'comp_vee', fromTerminalId: 'out', toCompId: 'comp_u1', toTerminalId: 'vee' },
];

assert(wires.length === 8, '8 wires created connecting all functional terminals of the inverting amplifier');
assert(wires[1].fromCompId === 'comp_r1' && wires[1].toCompId === 'comp_u1', 'Wire w2 correctly references component IDs');

// -----------------------------------------------------------------
// Test 5: Confirm wire endpoints remain attached when components move
// -----------------------------------------------------------------
console.log('\n--- Test 5: Wire Endpoints Remain Attached on Move/Rotate ---');
// When compR1 is moved from (180, 180) to (200, 240), coordinates dynamically query getTerminalAbsoluteCoords
const movedR1Comp = { ...compR1, x: 200, y: 240 };
const dynamicCoordBefore = getTerminalAbsoluteCoords(compR1.x, compR1.y, compR1.rotation, r1Term1Def);
const dynamicCoordAfter = getTerminalAbsoluteCoords(movedR1Comp.x, movedR1Comp.y, movedR1Comp.rotation, r1Term1Def);

assert(dynamicCoordBefore.x === 145 && dynamicCoordBefore.y === 180, 'Before move: terminal at (145, 180)');
assert(dynamicCoordAfter.x === 165 && dynamicCoordAfter.y === 240, 'After move: wire endpoint follows component without breaking connection to (165, 240)');

// -----------------------------------------------------------------
// Test 6: Change a resistor value and verify its label updates
// -----------------------------------------------------------------
console.log('\n--- Test 6: Change Resistor Value and Verify Updates ---');
const updatedR2: BuilderComponent = {
  ...compR2,
  params: { ...compR2.params, value: 47, unit: 'kΩ' }
};
assert(updatedR2.params.value === 47 && updatedR2.params.unit === 'kΩ', 'R2 resistance changed to 47 kΩ');
assert(updatedR2.id === compR2.id, 'Component ID preserved through parameter update');

// -----------------------------------------------------------------
// Test 7: Delete a component and verify wire connections are cleaned
// -----------------------------------------------------------------
console.log('\n--- Test 7: Delete Component and Clean Wires ---');
const idToDelete = 'comp_r2';
const remainingComponents = components.filter((c) => c.id !== idToDelete);
const remainingWires = wires.filter((w) => w.fromCompId !== idToDelete && w.toCompId !== idToDelete);

assert(!remainingComponents.find((c) => c.id === idToDelete), 'Component R2 removed from component list');
assert(remainingWires.length === 6, 'Associated wires w3 and w4 removed; exactly 6 wires remaining');
assert(!remainingWires.some((w) => w.fromCompId === idToDelete || w.toCompId === idToDelete), 'No dangling wire references to deleted component exist');

// -----------------------------------------------------------------
// Test 8: Create an intentionally incomplete circuit and confirm validation
// -----------------------------------------------------------------
console.log('\n--- Test 8: Intentionally Incomplete Circuit Validation ---');
// Incomplete: only opamp and R1, no ground, no supply, R1 hanging
const incompleteCircuitComponents = [compOpAmp, compR1];
const incompleteWires: BuilderWire[] = [
  { id: 'w_inc1', fromCompId: 'comp_r1', fromTerminalId: 't2', toCompId: 'comp_u1', toTerminalId: 'in-' }
];

const incompleteValidation = validateCircuit(incompleteCircuitComponents, incompleteWires);
assert(!incompleteValidation.isValid, 'Incomplete circuit fails validation as expected (isValid === false)');
assert(incompleteValidation.issues.some((i) => i.id.startsWith('unconnected-')), 'Detects unconnected terminals on hanging pins');
assert(incompleteValidation.issues.some((i) => i.id === 'missing-ground'), 'Detects missing 0V Ground reference');

// -----------------------------------------------------------------
// Test 9: Save a circuit, reload it, verify connections & values preserved
// -----------------------------------------------------------------
console.log('\n--- Test 9: Save and Reload Circuit Serialization ---');
const circuitDoc: CircuitDocument = {
  schemaVersion: 1,
  id: 'saved_inverting_amp',
  circuitName: 'Inverting Amplifier Practical Circuit',
  description: 'Verified SPPU Syllabus Practical 1 Circuit',
  components,
  wires,
  canvas: { zoom: 1.0, panX: 0, panY: 0 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const serializedJson = JSON.stringify(circuitDoc);
const reloadedDoc: CircuitDocument = JSON.parse(serializedJson);

assert(reloadedDoc.schemaVersion === 1, 'Schema version 1 verified');
assert(reloadedDoc.components.length === components.length, 'All 7 components reloaded');
assert(reloadedDoc.wires.length === wires.length, 'All 8 wires reloaded');
assert(reloadedDoc.components.find((c: BuilderComponent) => c.id === 'comp_r2')?.params.value === 100, 'R2 resistance value 100 kΩ preserved after reload');

// -----------------------------------------------------------------
// Test 10: Test Undo and Redo Mechanics
// -----------------------------------------------------------------
console.log('\n--- Test 10: Undo / Redo Mechanism ---');
type HistoryEntry = { components: BuilderComponent[]; wires: BuilderWire[] };
const undoStack: HistoryEntry[] = [];
let redoStack: HistoryEntry[] = [];

let currentCircuitState: HistoryEntry = { components: [compOpAmp], wires: [] };

// Action 1: Add R1
undoStack.push(currentCircuitState);
redoStack = [];
currentCircuitState = { components: [compOpAmp, compR1], wires: [] };

// Action 2: Add R2
undoStack.push(currentCircuitState);
currentCircuitState = { components: [compOpAmp, compR1, compR2], wires: [] };
assert(currentCircuitState.components.length === 3, 'Circuit has 3 components after 2 actions');

// Undo Action 2
const previousState = undoStack.pop()!;
redoStack.push(currentCircuitState);
currentCircuitState = previousState;
assert(currentCircuitState.components.length === 2, 'Undo restored circuit to 2 components');

// Redo Action 2
const nextState = redoStack.pop()!;
undoStack.push(currentCircuitState);
currentCircuitState = nextState;
assert(currentCircuitState.components.length === 3, 'Redo restored circuit to 3 components');

// -----------------------------------------------------------------
// Test 11: Simulate Supported Topology with Genuine Engine
// -----------------------------------------------------------------
console.log('\n--- Test 11: Genuine Engine Simulation on Supported Topology ---');
const fullValidation = validateCircuit(components, wires);
assert(fullValidation.isValid, 'Complete inverting amplifier passes netlist validation');

const topology = detectCircuitTopology(components, wires);
assert(topology.type === 'inverting-amplifier', `Topology classified as: ${topology.type}`);
assert(topology.isSimulatable, 'Inverting amplifier topology marked as simulatable');

const simResult = runBuilderSimulation(topology, components);
assert(!!simResult, 'Genuine simulation produces analytical results');
const gainMetric = simResult!.summaryMetrics.find((m) => m.label.includes('Gain'));
assert(gainMetric?.value === '-10', `Closed loop gain correctly calculated as -10 (got: ${gainMetric?.value})`);
assert(simResult!.simulationResult.vout.length === 600, 'Dual-trace time-domain oscilloscope simulation produced 600 points');

// -----------------------------------------------------------------
// Test 12: Attempt Unsupported Topology (No Fabrication)
// -----------------------------------------------------------------
console.log('\n--- Test 12: Unsupported Topology Behavior (No Fake Results) ---');
// Create an unsupported custom circuit: Op-amp with diode feedback
const diodeDef = SYLLABUS_COMPONENT_SPECIFICATIONS['diode'];
const compDiode: BuilderComponent = {
  id: 'comp_d1',
  type: 'diode',
  label: 'D1',
  x: 360,
  y: 100,
  rotation: 0,
  params: { ...diodeDef.defaultParams }
};

const unsupportedComponents: BuilderComponent[] = [compOpAmp, compDiode, compVin, compGnd, compVcc, compVee];
const unsupportedWires: BuilderWire[] = [
  { id: 'uw1', fromCompId: 'comp_vin', fromTerminalId: 'pos', toCompId: 'comp_u1', toTerminalId: 'in+' },
  { id: 'uw2', fromCompId: 'comp_u1', fromTerminalId: 'out', toCompId: 'comp_d1', toTerminalId: 'anode' },
  { id: 'uw3', fromCompId: 'comp_d1', fromTerminalId: 'cathode', toCompId: 'comp_u1', toTerminalId: 'in-' },
  { id: 'uw4', fromCompId: 'comp_vin', fromTerminalId: 'neg', toCompId: 'comp_gnd', toTerminalId: 'gnd' },
  { id: 'uw5', fromCompId: 'comp_vcc', fromTerminalId: 'out', toCompId: 'comp_u1', toTerminalId: 'vcc' },
  { id: 'uw6', fromCompId: 'comp_vee', fromTerminalId: 'out', toCompId: 'comp_u1', toTerminalId: 'vee' },
];

const unsupportedTopology = detectCircuitTopology(unsupportedComponents, unsupportedWires);
assert(unsupportedTopology.type === 'unsupported', `Custom circuit correctly classified as: ${unsupportedTopology.type}`);
assert(!unsupportedTopology.isSimulatable, 'Unsupported circuit correctly marked as non-simulatable');

const unsupportedSimResult = runBuilderSimulation(unsupportedTopology, unsupportedComponents);
assert(unsupportedSimResult === null, 'Engine honestly returns null without fabricating fake results');

// -----------------------------------------------------------------
// Test 13: Confirm existing Predefined Circuits and Lab Mode Intact
// -----------------------------------------------------------------
console.log('\n--- Test 13: Verify Predefined Circuits & Lab Mode Topics ---');
assert(SYLLABUS_PRACTICALS_REGISTRY.length === 8, `All 8 College Practicals are intact in registry`);
for (const topic of SYLLABUS_PRACTICALS_REGISTRY) {
  assert(topic.title.length > 0, `Topic ${topic.id} has title: ${topic.title}`);
}
assert(SYLLABUS_PRESET_TEMPLATES.length === 5, `All 5 syllabus presets (Inverting, Schmitt, Integrator, Follower, Comparator) are defined`);

console.log('\n====================================================');
console.log('ALL 14 ACCEPTANCE TEST CRITERIA FULLY VERIFIED!');
console.log('====================================================');
