import {
  BuilderComponent,
  BuilderWire,
  CircuitValidationIssue,
  DetectedTopology
} from '../../types/circuitBuilder';
import { SYLLABUS_COMPONENT_SPECIFICATIONS } from './componentCatalog';

/**
 * Union-Find Disjoint Set data structure to group connected terminals into electrical nets
 */
export class ElectricalNetlist {
  private parent: Map<string, string> = new Map();

  private key(compId: string, termId: string): string {
    return `${compId}:${termId}`;
  }

  public find(key: string): string {
    if (!this.parent.has(key)) {
      this.parent.set(key, key);
      return key;
    }
    const p = this.parent.get(key)!;
    if (p === key) return key;
    const root = this.find(p);
    this.parent.set(key, root);
    return root;
  }

  public union(compIdA: string, termIdA: string, compIdB: string, termIdB: string): void {
    const rootA = this.find(this.key(compIdA, termIdA));
    const rootB = this.find(this.key(compIdB, termIdB));
    if (rootA !== rootB) {
      this.parent.set(rootA, rootB);
    }
  }

  public areConnected(compIdA: string, termIdA: string, compIdB: string, termIdB: string): boolean {
    return this.find(this.key(compIdA, termIdA)) === this.find(this.key(compIdB, termIdB));
  }

  public getNetId(compId: string, termId: string): string {
    return this.find(this.key(compId, termId));
  }
}

/**
 * Builds the complete electrical netlist from placed components and wires
 */
export function buildNetlist(components: BuilderComponent[], wires: BuilderWire[]): ElectricalNetlist {
  const netlist = new ElectricalNetlist();

  // Initialize all terminals in the netlist
  for (const comp of components) {
    const spec = SYLLABUS_COMPONENT_SPECIFICATIONS[comp.type];
    if (spec) {
      for (const term of spec.terminals) {
        netlist.find(`${comp.id}:${term.id}`);
      }
    }
  }

  // Connect terminals joined by wires
  for (const wire of wires) {
    netlist.union(wire.fromCompId, wire.fromTerminalId, wire.toCompId, wire.toTerminalId);
  }

  return netlist;
}

/**
 * Validates the assembled circuit and produces actionable feedback
 */
export function validateCircuit(
  components: BuilderComponent[],
  wires: BuilderWire[]
): {
  issues: CircuitValidationIssue[];
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
} {
  const issues: CircuitValidationIssue[] = [];

  if (components.length === 0) {
    issues.push({
      id: 'empty-canvas',
      severity: 'info',
      message: 'Circuit canvas is empty. Add components from the library to begin assembly.'
    });
    return { issues, isValid: false, hasErrors: false, hasWarnings: false };
  }

  // 1. Check for Duplicate Reference Labels
  const labelMap = new Map<string, string[]>();
  for (const comp of components) {
    const lbl = comp.label.trim();
    if (!labelMap.has(lbl)) labelMap.set(lbl, []);
    labelMap.get(lbl)!.push(comp.id);
  }

  for (const [lbl, ids] of labelMap.entries()) {
    if (ids.length > 1) {
      issues.push({
        id: `dup-label-${lbl}`,
        severity: 'error',
        message: `Duplicate reference label '${lbl}' detected on ${ids.length} components. Each component must have a unique identifier.`,
        componentId: ids[0]
      });
    }
  }

  // 2. Parameter Sanity Validation
  for (const comp of components) {
    if (comp.type === 'resistor') {
      const val = Number(comp.params.value);
      if (isNaN(val) || val <= 0) {
        issues.push({
          id: `param-res-${comp.id}`,
          severity: 'error',
          message: `${comp.label} has an invalid resistance value (${comp.params.value}). Must be strictly greater than 0 Ω.`,
          componentId: comp.id
        });
      }
    } else if (comp.type === 'capacitor') {
      const val = Number(comp.params.value);
      if (isNaN(val) || val <= 0) {
        issues.push({
          id: `param-cap-${comp.id}`,
          severity: 'error',
          message: `${comp.label} has an invalid capacitance value (${comp.params.value}). Must be strictly greater than 0.`,
          componentId: comp.id
        });
      }
    } else if (comp.type === 'ac-source') {
      const amp = Number(comp.params.amplitude);
      const freq = Number(comp.params.frequency);
      if (isNaN(amp) || amp <= 0) {
        issues.push({
          id: `param-vin-amp-${comp.id}`,
          severity: 'error',
          message: `${comp.label} amplitude must be greater than 0 V.`,
          componentId: comp.id
        });
      }
      if (isNaN(freq) || freq <= 0) {
        issues.push({
          id: `param-vin-freq-${comp.id}`,
          severity: 'error',
          message: `${comp.label} frequency must be greater than 0 Hz.`,
          componentId: comp.id
        });
      }
    }
  }

  // 3. Terminal Connection Analysis
  const terminalConnections = new Map<string, number>();
  for (const wire of wires) {
    const fromKey = `${wire.fromCompId}:${wire.fromTerminalId}`;
    const toKey = `${wire.toCompId}:${wire.toTerminalId}`;
    terminalConnections.set(fromKey, (terminalConnections.get(fromKey) || 0) + 1);
    terminalConnections.set(toKey, (terminalConnections.get(toKey) || 0) + 1);
  }

  for (const comp of components) {
    const spec = SYLLABUS_COMPONENT_SPECIFICATIONS[comp.type];
    if (!spec) continue;

    for (const term of spec.terminals) {
      const count = terminalConnections.get(`${comp.id}:${term.id}`) || 0;
      if (count === 0) {
        if (comp.type === 'op-amp') {
          if (term.id === 'in-' || term.id === 'in+') {
            issues.push({
              id: `floating-${comp.id}-${term.id}`,
              severity: 'error',
              message: `Op-Amp ${comp.label} input terminal '${term.name}' is floating. Operational amplifiers require defined input potentials.`,
              componentId: comp.id,
              terminalId: term.id
            });
          } else if (term.id === 'out') {
            issues.push({
              id: `unconnected-out-${comp.id}`,
              severity: 'warning',
              message: `Op-Amp ${comp.label} output terminal is unconnected.`,
              componentId: comp.id,
              terminalId: term.id
            });
          } else if (term.id === 'vcc' || term.id === 'vee') {
            issues.push({
              id: `internal-rail-${comp.id}-${term.id}`,
              severity: 'info',
              message: `Op-Amp ${comp.label} power pin '${term.name}' is unconnected. Using default internal ±15V DC supply rails.`,
              componentId: comp.id,
              terminalId: term.id
            });
          }
        } else if (comp.type === 'resistor' || comp.type === 'capacitor' || comp.type === 'diode') {
          issues.push({
            id: `unconnected-${comp.id}-${term.id}`,
            severity: 'warning',
            message: `${comp.label} (${spec.displayName}) terminal '${term.name}' is unconnected.`,
            componentId: comp.id,
            terminalId: term.id
          });
        }
      }
    }
  }

  // 4. Ground Reference Check
  const hasGround = components.some((c) => c.type === 'ground');
  if (!hasGround) {
    issues.push({
      id: 'missing-ground',
      severity: 'error',
      message: 'Circuit is missing a Ground (0V GND) reference. All SPPU practical circuits require a common ground.'
    });
  }

  // 5. Input Source Check
  const hasInputSource = components.some((c) => c.type === 'ac-source' || c.type === 'dc-source');
  if (!hasInputSource) {
    issues.push({
      id: 'missing-source',
      severity: 'warning',
      message: 'No input signal source (Vin / Vref) placed in circuit.'
    });
  }

  const hasErrors = issues.some((i) => i.severity === 'error');
  const hasWarnings = issues.some((i) => i.severity === 'warning');
  const isValid = !hasErrors;

  return {
    issues,
    isValid,
    hasErrors,
    hasWarnings
  };
}

/**
 * Automatically inspects the netlist graph and identifies supported syllabus circuit topologies
 */
export function detectCircuitTopology(
  components: BuilderComponent[],
  wires: BuilderWire[]
): DetectedTopology {
  const opAmps = components.filter((c) => c.type === 'op-amp');
  const resistors = components.filter((c) => c.type === 'resistor');
  const capacitors = components.filter((c) => c.type === 'capacitor');
  const diodes = components.filter((c) => c.type === 'diode');
  const acSources = components.filter((c) => c.type === 'ac-source');
  const dcSources = components.filter((c) => c.type === 'dc-source');
  const grounds = components.filter((c) => c.type === 'ground');

  if (opAmps.length === 0) {
    return {
      type: 'unsupported',
      displayName: 'Passive / Discrete Network',
      isSimulatable: false,
      confidence: 0,
      componentsMapped: {},
      explanation: 'No operational amplifier detected. Place an op-amp (LM741) to configure an active op-amp practical circuit.'
    };
  }

  const netlist = buildNetlist(components, wires);
  const u1 = opAmps[0];

  // Helper: check if a terminal is grounded
  const isGrounded = (compId: string, termId: string): boolean => {
    return grounds.some((g) => netlist.areConnected(compId, termId, g.id, 'gnd'));
  };

  // Helper: find resistor connected between two specific terminals
  const findResistorBetween = (
    c1Id: string,
    t1Id: string,
    c2Id: string,
    t2Id: string
  ): BuilderComponent | undefined => {
    return resistors.find((r) => {
      const conn1 = netlist.areConnected(c1Id, t1Id, r.id, 't1') && netlist.areConnected(c2Id, t2Id, r.id, 't2');
      const conn2 = netlist.areConnected(c1Id, t1Id, r.id, 't2') && netlist.areConnected(c2Id, t2Id, r.id, 't1');
      return conn1 || conn2;
    });
  };

  // Helper: find capacitor connected between two specific terminals
  const findCapacitorBetween = (
    c1Id: string,
    t1Id: string,
    c2Id: string,
    t2Id: string
  ): BuilderComponent | undefined => {
    return capacitors.find((c) => {
      const conn1 = netlist.areConnected(c1Id, t1Id, c.id, 't1') && netlist.areConnected(c2Id, t2Id, c.id, 't2');
      const conn2 = netlist.areConnected(c1Id, t1Id, c.id, 't2') && netlist.areConnected(c2Id, t2Id, c.id, 't1');
      return conn1 || conn2;
    });
  };

  // -------------------------------------------------------------
  // TOPOLOGY 1: INVERTING AMPLIFIER
  // - Vin -> Rin -> in-
  // - in- -> Rf -> out
  // - in+ -> Ground
  // -------------------------------------------------------------
  if (acSources.length >= 1) {
    const vin = acSources[0];
    const rf = findResistorBetween(u1.id, 'in-', u1.id, 'out');
    const rin = resistors.find((r) => {
      if (r.id === rf?.id) return false;
      const connectedToInverting = netlist.areConnected(u1.id, 'in-', r.id, 't1') || netlist.areConnected(u1.id, 'in-', r.id, 't2');
      const connectedToVin = netlist.areConnected(vin.id, 'pos', r.id, 't1') || netlist.areConnected(vin.id, 'pos', r.id, 't2');
      return connectedToInverting && connectedToVin;
    });
    const nonInvertingGrounded = isGrounded(u1.id, 'in+');
    const vinGrounded = isGrounded(vin.id, 'neg');

    if (rf && rin && nonInvertingGrounded && vinGrounded && capacitors.length === 0) {
      return {
        type: 'inverting-amplifier',
        displayName: 'Inverting Operational Amplifier',
        isSimulatable: true,
        confidence: 0.98,
        componentsMapped: {
          opAmp: u1.id,
          rin: rin.id,
          rf: rf.id,
          vin: vin.id
        },
        explanation: `Verified Inverting Topology: Input applied via ${rin.label} to inverting terminal, feedback via ${rf.label} to output, and non-inverting terminal grounded. Theoretical Gain Av = -${rf.label}/${rin.label}.`
      };
    }
  }

  // -------------------------------------------------------------
  // TOPOLOGY 2: PRACTICAL INTEGRATOR
  // - Vin -> R1 -> in-
  // - in- -> Cf (and optional parallel Rf) -> out
  // - in+ -> Ground
  // -------------------------------------------------------------
  if (acSources.length >= 1) {
    const vin = acSources[0];
    const cf = findCapacitorBetween(u1.id, 'in-', u1.id, 'out');
    const rf = findResistorBetween(u1.id, 'in-', u1.id, 'out');
    const r1 = resistors.find((r) => {
      if (r.id === rf?.id) return false;
      const connectedToInverting = netlist.areConnected(u1.id, 'in-', r.id, 't1') || netlist.areConnected(u1.id, 'in-', r.id, 't2');
      const connectedToVin = netlist.areConnected(vin.id, 'pos', r.id, 't1') || netlist.areConnected(vin.id, 'pos', r.id, 't2');
      return connectedToInverting && connectedToVin;
    });
    const nonInvertingGrounded = isGrounded(u1.id, 'in+');

    if (cf && r1 && nonInvertingGrounded) {
      return {
        type: 'practical-integrator',
        displayName: 'Practical Op-Amp Integrator',
        isSimulatable: true,
        confidence: 0.95,
        componentsMapped: {
          opAmp: u1.id,
          r1: r1.id,
          cf: cf.id,
          ...(rf ? { rf: rf.id } : {}),
          vin: vin.id
        },
        explanation: `Verified Integrator Topology: Input applied through ${r1.label} to inverting terminal with feedback capacitor ${cf.label}${rf ? ` and stabilization resistor ${rf.label}` : ''}. Output performs mathematical time integration.`
      };
    }
  }

  // -------------------------------------------------------------
  // TOPOLOGY 3: INVERTING SCHMITT TRIGGER
  // - Vin -> in- (direct or via R3)
  // - out -> R1 -> in+
  // - in+ -> R2 -> Ground
  // -------------------------------------------------------------
  if (acSources.length >= 1) {
    const vin = acSources[0];
    const r1Feedback = findResistorBetween(u1.id, 'out', u1.id, 'in+');
    const r2Ground = resistors.find((r) => {
      if (r.id === r1Feedback?.id) return false;
      const connectedToNonInverting = netlist.areConnected(u1.id, 'in+', r.id, 't1') || netlist.areConnected(u1.id, 'in+', r.id, 't2');
      const termToGnd = netlist.areConnected(r.id, 't1', u1.id, 'in+') ? isGrounded(r.id, 't2') : isGrounded(r.id, 't1');
      return connectedToNonInverting && termToGnd;
    });

    const vinToInverting = netlist.areConnected(vin.id, 'pos', u1.id, 'in-') ||
      resistors.some((r) => {
        const toVin = netlist.areConnected(vin.id, 'pos', r.id, 't1') || netlist.areConnected(vin.id, 'pos', r.id, 't2');
        const toIn = netlist.areConnected(u1.id, 'in-', r.id, 't1') || netlist.areConnected(u1.id, 'in-', r.id, 't2');
        return toVin && toIn;
      });

    if (r1Feedback && r2Ground && vinToInverting) {
      return {
        type: 'inverting-schmitt-trigger',
        displayName: 'Inverting Schmitt Trigger with Hysteresis',
        isSimulatable: true,
        confidence: 0.96,
        componentsMapped: {
          opAmp: u1.id,
          r1: r1Feedback.id,
          r2: r2Ground.id,
          vin: vin.id
        },
        explanation: `Verified Inverting Schmitt Trigger Topology: Positive feedback divider formed by ${r1Feedback.label} and ${r2Ground.label} to non-inverting terminal (+), input applied to inverting terminal (-). Hysteresis width VH = VUTP - VLTP.`
      };
    }
  }

  // -------------------------------------------------------------
  // TOPOLOGY 4: NON-INVERTING AMPLIFIER
  // - Vin -> in+
  // - out -> Rf -> in-
  // - in- -> R1 -> Ground
  // -------------------------------------------------------------
  if (acSources.length >= 1) {
    const vin = acSources[0];
    const vinToNonInverting = netlist.areConnected(vin.id, 'pos', u1.id, 'in+');
    const rf = findResistorBetween(u1.id, 'out', u1.id, 'in-');
    const r1 = resistors.find((r) => {
      if (r.id === rf?.id) return false;
      const connectedToInverting = netlist.areConnected(u1.id, 'in-', r.id, 't1') || netlist.areConnected(u1.id, 'in-', r.id, 't2');
      const termToGnd = netlist.areConnected(r.id, 't1', u1.id, 'in-') ? isGrounded(r.id, 't2') : isGrounded(r.id, 't1');
      return connectedToInverting && termToGnd;
    });

    if (vinToNonInverting && rf && r1) {
      return {
        type: 'non-inverting-amplifier',
        displayName: 'Non-Inverting Operational Amplifier',
        isSimulatable: true,
        confidence: 0.95,
        componentsMapped: {
          opAmp: u1.id,
          r1: r1.id,
          rf: rf.id,
          vin: vin.id
        },
        explanation: `Verified Non-Inverting Topology: Input applied directly to non-inverting terminal (+), negative feedback divider via ${rf.label} and ${r1.label}. Gain Av = 1 + ${rf.label}/${r1.label}.`
      };
    }
  }

  // -------------------------------------------------------------
  // TOPOLOGY 5: VOLTAGE FOLLOWER (BUFFER)
  // - out directly wired to in-
  // - Vin -> in+
  // -------------------------------------------------------------
  if (acSources.length >= 1) {
    const vin = acSources[0];
    const directFeedback = netlist.areConnected(u1.id, 'out', u1.id, 'in-');
    const vinToNonInverting = netlist.areConnected(vin.id, 'pos', u1.id, 'in+');

    if (directFeedback && vinToNonInverting && resistors.length === 0) {
      return {
        type: 'voltage-follower',
        displayName: 'Unity-Gain Voltage Follower (Buffer)',
        isSimulatable: true,
        confidence: 0.98,
        componentsMapped: {
          opAmp: u1.id,
          vin: vin.id
        },
        explanation: 'Verified Voltage Follower Topology: 100% negative feedback with output directly connected to inverting input (-), input signal applied to non-inverting input (+). Av = 1.0.'
      };
    }
  }

  // -------------------------------------------------------------
  // TOPOLOGY 6: OPEN-LOOP VOLTAGE COMPARATOR
  // - Vin to one input terminal, Vref (or Ground) to the other, no feedback
  // -------------------------------------------------------------
  if (acSources.length >= 1 && diodes.length === 0 && capacitors.length === 0) {
    const vin = acSources[0];
    const hasFeedback = netlist.areConnected(u1.id, 'out', u1.id, 'in-') || netlist.areConnected(u1.id, 'out', u1.id, 'in+');
    if (!hasFeedback && resistors.length <= 1) {
      const vinToInverting = netlist.areConnected(vin.id, 'pos', u1.id, 'in-');
      const vref = dcSources[0];
      return {
        type: 'open-loop-comparator',
        displayName: 'Open-Loop Voltage Comparator',
        isSimulatable: true,
        confidence: 0.90,
        componentsMapped: {
          opAmp: u1.id,
          vin: vin.id,
          ...(vref ? { vref: vref.id } : {})
        },
        explanation: `Verified Comparator Topology: Open-loop mode with input signal comparing against ${vref ? vref.label : '0V ground'}. Output switches between ±Vsat.`
      };
    }
  }

  // -------------------------------------------------------------
  // UNSUPPORTED / GENERAL TOPOLOGY
  // -------------------------------------------------------------
  return {
    type: 'unsupported',
    displayName: 'Custom / Unclassified Circuit Topology',
    isSimulatable: false,
    confidence: 0,
    componentsMapped: {},
    explanation:
      'The assembled circuit topology does not match a verified syllabus analytical model (Inverting Amp, Non-Inverting Amp, Buffer, Integrator, Schmitt Trigger, or Comparator). Wiring validation is active and your schematic can be saved locally, but simulation is not supported for this custom arrangement.'
  };
}
