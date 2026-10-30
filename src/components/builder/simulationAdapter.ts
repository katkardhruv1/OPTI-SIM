import {
  BuilderComponent,
  BuilderWire,
  DetectedTopology
} from '../../types/circuitBuilder';
import { calculateInvertingAmp } from '../../calculations/invertingAmp';
import { calculateNonInvertingAmp } from '../../calculations/nonInvertingAmp';
import { calculateVoltageFollower } from '../../calculations/voltageFollower';
import { calculateIntegrator } from '../../calculations/integrator';
import { calculateSchmittTrigger } from '../../calculations/schmittTrigger';
import { calculateComparator } from '../../calculations/comparator';
import {
  simulateLinearOpAmp,
  SimulationResult,
  WaveformSignalParams,
  generateTimeArray,
  extractMetrics
} from '../../utils/waveformEngine';
import { convertToOhms, convertToFarads, cleanFloat, formatResistance } from '../../utils/formatters';

export interface BuilderSimulationOutput {
  topology: DetectedTopology;
  summaryMetrics: Array<{ label: string; value: string; unit?: string; description?: string }>;
  derivationSteps: string[];
  simulationResult: SimulationResult;
}

/**
 * Runs authentic analytical simulation for supported syllabus circuit topologies
 */
export function runBuilderSimulation(
  topology: DetectedTopology,
  components: BuilderComponent[]
): BuilderSimulationOutput | null {
  if (!topology.isSimulatable) return null;

  const compMap = new Map<string, BuilderComponent>(components.map((c) => [c.id, c]));
  const opAmp = topology.componentsMapped.opAmp ? compMap.get(topology.componentsMapped.opAmp) : undefined;
  const posVsat = opAmp?.params?.posVsat !== undefined ? Number(opAmp.params.posVsat) : 15;
  const negVsat = opAmp?.params?.negVsat !== undefined ? Number(opAmp.params.negVsat) : -15;

  // -------------------------------------------------------------
  // 1. INVERTING OPERATIONAL AMPLIFIER
  // -------------------------------------------------------------
  if (topology.type === 'inverting-amplifier') {
    const rinComp = compMap.get(topology.componentsMapped.rin)!;
    const rfComp = compMap.get(topology.componentsMapped.rf)!;
    const vinComp = compMap.get(topology.componentsMapped.vin)!;

    const rinVal = Number(rinComp.params.value);
    const rinUnit = rinComp.params.unit || 'kΩ';
    const rfVal = Number(rfComp.params.value);
    const rfUnit = rfComp.params.unit || 'kΩ';
    const vinAmp = Number(vinComp.params.amplitude || 1.0);
    const freq = Number(vinComp.params.frequency || 1000);
    const waveform = vinComp.params.waveform || 'sine';

    const calcResults = calculateInvertingAmp({
      vin: vinAmp,
      vinUnit: 'V',
      rin: rinVal,
      rinUnit: rinUnit as any,
      rf: rfVal,
      rfUnit: rfUnit as any
    });

    const signalParams: WaveformSignalParams = {
      waveform,
      amplitude: vinAmp,
      frequency: freq,
      phaseDeg: 0,
      dcOffset: Number(vinComp.params.offset || 0)
    };

    const simResult = simulateLinearOpAmp({
      inputParams: signalParams,
      gain: Math.abs(calcResults.av),
      phaseInvert: true,
      posVsat,
      negVsat,
      applyClipping: true,
      numCycles: 4,
      sampleCount: 600
    });

    return {
      topology,
      summaryMetrics: [
        { label: 'Voltage Gain (Av)', value: cleanFloat(calcResults.av), unit: '', description: 'Closed-loop inverting gain Av = -Rf / Rin' },
        { label: 'Output Peak Voltage (Vout)', value: cleanFloat(calcResults.vout), unit: 'V', description: 'Vout = Av × Vin (180° inverted)' },
        { label: 'Input Impedance (Zin)', value: formatResistance(convertToOhms(rinVal, rinUnit as any)), unit: '', description: 'Virtual ground at inverting node holds Zin = Rin' },
        { label: 'Phase Shift', value: '180°', unit: 'deg', description: 'Inverting configuration produces 180° phase inversion' }
      ],
      derivationSteps: [
        `Av = - (${rfComp.label} / ${rinComp.label})`,
        `Av = - (${rfVal} ${rfUnit} / ${rinVal} ${rinUnit}) = ${cleanFloat(calcResults.av)}`,
        `Vout = Av × Vin = (${cleanFloat(calcResults.av)}) × (${vinAmp} V) = ${cleanFloat(calcResults.vout)} V`
      ],
      simulationResult: simResult
    };
  }

  // -------------------------------------------------------------
  // 2. NON-INVERTING OPERATIONAL AMPLIFIER
  // -------------------------------------------------------------
  if (topology.type === 'non-inverting-amplifier') {
    const r1Comp = compMap.get(topology.componentsMapped.r1)!;
    const rfComp = compMap.get(topology.componentsMapped.rf)!;
    const vinComp = compMap.get(topology.componentsMapped.vin)!;

    const r1Val = Number(r1Comp.params.value);
    const r1Unit = r1Comp.params.unit || 'kΩ';
    const rfVal = Number(rfComp.params.value);
    const rfUnit = rfComp.params.unit || 'kΩ';
    const vinAmp = Number(vinComp.params.amplitude || 1.0);
    const freq = Number(vinComp.params.frequency || 1000);
    const waveform = vinComp.params.waveform || 'sine';

    const calcResults = calculateNonInvertingAmp({
      vin: vinAmp,
      vinUnit: 'V',
      r1: r1Val,
      r1Unit: r1Unit as any,
      rf: rfVal,
      rfUnit: rfUnit as any
    });

    const signalParams: WaveformSignalParams = {
      waveform,
      amplitude: vinAmp,
      frequency: freq,
      phaseDeg: 0,
      dcOffset: Number(vinComp.params.offset || 0)
    };

    const simResult = simulateLinearOpAmp({
      inputParams: signalParams,
      gain: calcResults.av,
      phaseInvert: false,
      posVsat,
      negVsat,
      applyClipping: true,
      numCycles: 4,
      sampleCount: 600
    });

    return {
      topology,
      summaryMetrics: [
        { label: 'Voltage Gain (Av)', value: cleanFloat(calcResults.av), unit: '', description: 'Non-inverting gain Av = 1 + (Rf / R1)' },
        { label: 'Output Peak Voltage (Vout)', value: cleanFloat(calcResults.vout), unit: 'V', description: 'Vout = Av × Vin (in-phase)' },
        { label: 'Phase Shift', value: '0°', unit: 'deg', description: 'Output is in-phase with input' }
      ],
      derivationSteps: [
        `Av = 1 + (${rfComp.label} / ${r1Comp.label})`,
        `Av = 1 + (${rfVal} ${rfUnit} / ${r1Val} ${r1Unit}) = ${cleanFloat(calcResults.av)}`,
        `Vout = Av × Vin = (${cleanFloat(calcResults.av)}) × (${vinAmp} V) = ${cleanFloat(calcResults.vout)} V`
      ],
      simulationResult: simResult
    };
  }

  // -------------------------------------------------------------
  // 3. VOLTAGE FOLLOWER (BUFFER)
  // -------------------------------------------------------------
  if (topology.type === 'voltage-follower') {
    const vinComp = compMap.get(topology.componentsMapped.vin)!;
    const vinAmp = Number(vinComp.params.amplitude || 2.0);
    const freq = Number(vinComp.params.frequency || 1000);
    const waveform = vinComp.params.waveform || 'sine';

    const calcResults = calculateVoltageFollower({
      vin: vinAmp,
      vinUnit: 'V'
    });

    const signalParams: WaveformSignalParams = {
      waveform,
      amplitude: vinAmp,
      frequency: freq,
      phaseDeg: 0,
      dcOffset: Number(vinComp.params.offset || 0)
    };

    const simResult = simulateLinearOpAmp({
      inputParams: signalParams,
      gain: 1.0,
      phaseInvert: false,
      posVsat,
      negVsat,
      applyClipping: true,
      numCycles: 4,
      sampleCount: 600
    });

    return {
      topology,
      summaryMetrics: [
        { label: 'Voltage Gain (Av)', value: '1.00', unit: '', description: 'Unity gain voltage buffer Av = 1.0' },
        { label: 'Output Peak Voltage (Vout)', value: cleanFloat(calcResults.vout), unit: 'V', description: 'Vout = Vin' },
        { label: 'Phase Shift', value: '0°', unit: 'deg', description: 'Zero phase shift' }
      ],
      derivationSteps: [
        'Av = 1.00 (100% negative feedback with zero attenuation)',
        `Vout = Vin = ${vinAmp} V`
      ],
      simulationResult: simResult
    };
  }

  // -------------------------------------------------------------
  // 4. INVERTING SCHMITT TRIGGER
  // -------------------------------------------------------------
  if (topology.type === 'inverting-schmitt-trigger') {
    const r1Comp = compMap.get(topology.componentsMapped.r1)!;
    const r2Comp = compMap.get(topology.componentsMapped.r2)!;
    const vinComp = compMap.get(topology.componentsMapped.vin)!;

    const r1Val = Number(r1Comp.params.value);
    const r1Unit = r1Comp.params.unit || 'Ω';
    const r2Val = Number(r2Comp.params.value);
    const r2Unit = r2Comp.params.unit || 'kΩ';
    const vinAmp = Number(vinComp.params.amplitude || 2.5);
    const freq = Number(vinComp.params.frequency || 1000);

    const calcResults = calculateSchmittTrigger({
      vinAmplitude: vinAmp,
      vinUnit: 'V',
      frequency: freq,
      frequencyUnit: 'Hz',
      vrefCenter: 0,
      posVsat,
      negVsat,
      r1: r1Val,
      r1Unit: r1Unit as any,
      rf: r2Val,
      rfUnit: r2Unit as any,
      waveform: 'sine'
    });

    const r1Ohms = convertToOhms(r1Val, r1Unit as any);
    const r2Ohms = convertToOhms(r2Val, r2Unit as any);
    const beta = r2Ohms / (r1Ohms + r2Ohms);
    const utp = beta * posVsat;
    const ltp = beta * negVsat;
    const vh = utp - ltp;

    // Time-domain dynamic waveform simulation
    const numCycles = 4;
    const sampleCount = 800;
    const { time, period, timeUnit, scale } = generateTimeArray(freq, numCycles, sampleCount);

    const vinVals: number[] = new Array(time.length);
    const voutVals: number[] = new Array(time.length);
    let state = posVsat;

    for (let i = 0; i < time.length; i++) {
      const t = time[i];
      const vIn = vinAmp * Math.sin(2 * Math.PI * freq * t);
      vinVals[i] = vIn;

      // Inverting Schmitt switching
      if (vIn >= utp) state = negVsat;
      else if (vIn <= ltp) state = posVsat;

      voutVals[i] = state;
    }

    const inMetrics = extractMetrics(vinVals, freq);
    const outMetrics = extractMetrics(voutVals, freq);

    const simResult: SimulationResult = {
      time,
      vin: vinVals,
      vout: voutVals,
      inMetrics,
      outMetrics,
      gain: Math.abs(posVsat / (vinAmp || 1)),
      gainDb: 20 * Math.log10(Math.abs(posVsat / (vinAmp || 1))),
      phaseDiffDeg: 180,
      clipped: false,
      posVsat,
      negVsat,
      timeUnit,
      timeScaleMultiplier: scale,
      period,
      numCycles
    };

    return {
      topology,
      summaryMetrics: [
        { label: 'Feedback Factor (β)', value: cleanFloat(beta, 4), unit: '', description: 'β = R2 / (R1 + R2)' },
        { label: 'Upper Trigger Point (VUTP)', value: `+${cleanFloat(utp, 3)}`, unit: 'V', description: 'VUTP = β × (+Vsat)' },
        { label: 'Lower Trigger Point (VLTP)', value: cleanFloat(ltp, 3), unit: 'V', description: 'VLTP = β × (-Vsat)' },
        { label: 'Hysteresis Width (VH)', value: cleanFloat(vh, 3), unit: 'V', description: 'VH = VUTP - VLTP (Noise Margin)' }
      ],
      derivationSteps: [
        `β = ${r2Comp.label} / (${r1Comp.label} + ${r2Comp.label}) = ${formatResistance(r2Ohms)} / (${formatResistance(r1Ohms)} + ${formatResistance(r2Ohms)}) = ${cleanFloat(beta, 4)}`,
        `VUTP = β × (+Vsat) = ${cleanFloat(beta, 4)} × (+${posVsat} V) = +${cleanFloat(utp, 3)} V`,
        `VLTP = β × (-Vsat) = ${cleanFloat(beta, 4)} × (${negVsat} V) = ${cleanFloat(ltp, 3)} V`,
        `VH = VUTP - VLTP = ${cleanFloat(utp, 3)} V - (${cleanFloat(ltp, 3)} V) = ${cleanFloat(vh, 3)} V`
      ],
      simulationResult: simResult
    };
  }

  // -------------------------------------------------------------
  // 5. PRACTICAL INTEGRATOR
  // -------------------------------------------------------------
  if (topology.type === 'practical-integrator') {
    const r1Comp = compMap.get(topology.componentsMapped.r1)!;
    const cfComp = compMap.get(topology.componentsMapped.cf)!;
    const rfComp = topology.componentsMapped.rf ? compMap.get(topology.componentsMapped.rf) : undefined;
    const vinComp = compMap.get(topology.componentsMapped.vin)!;

    const r1Val = Number(r1Comp.params.value);
    const r1Unit = r1Comp.params.unit || 'kΩ';
    const cfVal = Number(cfComp.params.value);
    const cfUnit = cfComp.params.unit || 'µF';
    const rfVal = rfComp ? Number(rfComp.params.value) : 100;
    const rfUnit = rfComp ? rfComp.params.unit || 'kΩ' : 'kΩ';

    const vinAmp = Number(vinComp.params.amplitude || 1.0);
    const freq = Number(vinComp.params.frequency || 1000);
    const waveform = vinComp.params.waveform || 'square';

    const calcResults = calculateIntegrator({
      vin: vinAmp,
      vinUnit: 'V',
      frequency: freq,
      frequencyUnit: 'Hz',
      r: r1Val,
      rUnit: r1Unit as any,
      c: cfVal,
      cUnit: cfUnit as any,
      waveform: waveform as any
    });

    const r1Ohms = convertToOhms(r1Val, r1Unit as any);
    const cfFarads = convertToFarads(cfVal, cfUnit as any);
    const rfOhms = rfComp ? convertToOhms(rfVal, rfUnit as any) : r1Ohms * 10;
    const fa = 1 / (2 * Math.PI * rfOhms * cfFarads);
    const fb = 1 / (2 * Math.PI * r1Ohms * cfFarads);

    // Simulate inverted triangular output from square wave input
    const numCycles = 4;
    const sampleCount = 600;
    const { time, period, timeUnit, scale } = generateTimeArray(freq, numCycles, sampleCount);

    const vinVals: number[] = new Array(time.length);
    const voutVals: number[] = new Array(time.length);

    for (let i = 0; i < time.length; i++) {
      const t = time[i];
      const cyclePos = (t * freq) % 1;
      const vIn = cyclePos < 0.5 ? vinAmp : -vinAmp;
      vinVals[i] = vIn;

      // Integration: Square wave integrates into inverted triangle wave
      const triFrac = cyclePos < 0.5 ? (1 - 4 * cyclePos) : (-3 + 4 * cyclePos);
      const idealVpp = (vinAmp / (4 * freq * r1Ohms * cfFarads)) * 2;
      const vOutClamped = Math.max(negVsat, Math.min(posVsat, (triFrac * idealVpp) / 2));
      voutVals[i] = vOutClamped;
    }

    const inMetrics = extractMetrics(vinVals, freq);
    const outMetrics = extractMetrics(voutVals, freq);

    const simResult: SimulationResult = {
      time,
      vin: vinVals,
      vout: voutVals,
      inMetrics,
      outMetrics,
      gain: Math.abs(outMetrics.vPeak / (inMetrics.vPeak || 1)),
      gainDb: 20 * Math.log10(Math.abs(outMetrics.vPeak / (inMetrics.vPeak || 1))),
      phaseDiffDeg: 90,
      clipped: false,
      posVsat,
      negVsat,
      timeUnit,
      timeScaleMultiplier: scale,
      period,
      numCycles
    };

    return {
      topology,
      summaryMetrics: [
        { label: "Lower Cutoff (fa)", value: cleanFloat(fa, 1), unit: 'Hz', description: 'Break frequency fa = 1 / (2π Rf Cf)' },
        { label: "0 dB Unity Crossover (fb)", value: cleanFloat(fb, 1), unit: 'Hz', description: 'Unity gain crossover fb = 1 / (2π R1 Cf)' },
        { label: "RC Time Constant (τ)", value: cleanFloat(r1Ohms * cfFarads * 1e3, 3), unit: 'ms', description: 'τ = R1 · Cf integration time constant' }
      ],
      derivationSteps: [
        `fa = 1 / (2π · ${rfComp ? rfComp.label : 'Rf'} · ${cfComp.label}) = 1 / (2π · ${formatResistance(rfOhms)} · ${cfVal} ${cfUnit}) = ${cleanFloat(fa, 1)} Hz`,
        `fb = 1 / (2π · ${r1Comp.label} · ${cfComp.label}) = 1 / (2π · ${formatResistance(r1Ohms)} · ${cfVal} ${cfUnit}) = ${cleanFloat(fb, 1)} Hz`,
        `Vo(t) = - (1 / (${r1Comp.label} · ${cfComp.label})) ∫ Vin(t) dt`
      ],
      simulationResult: simResult
    };
  }

  // -------------------------------------------------------------
  // 6. OPEN-LOOP VOLTAGE COMPARATOR
  // -------------------------------------------------------------
  if (topology.type === 'open-loop-comparator') {
    const vinComp = compMap.get(topology.componentsMapped.vin)!;
    const vrefComp = topology.componentsMapped.vref ? compMap.get(topology.componentsMapped.vref) : undefined;

    const vinAmp = Number(vinComp.params.amplitude || 3.0);
    const freq = Number(vinComp.params.frequency || 1000);
    const vref = vrefComp ? Number(vrefComp.params.voltage || 0) : 0;

    const calcResults = calculateComparator({
      comparatorType: 'inverting',
      vin: vinAmp,
      vinUnit: 'V',
      vref,
      vrefUnit: 'V',
      posVsat,
      negVsat,
      waveform: 'sine',
      frequency: freq,
      frequencyUnit: 'Hz'
    });

    const numCycles = 4;
    const sampleCount = 600;
    const { time, period, timeUnit, scale } = generateTimeArray(freq, numCycles, sampleCount);

    const vinVals: number[] = new Array(time.length);
    const voutVals: number[] = new Array(time.length);

    for (let i = 0; i < time.length; i++) {
      const t = time[i];
      const vIn = vinAmp * Math.sin(2 * Math.PI * freq * t);
      vinVals[i] = vIn;
      voutVals[i] = vIn > vref ? negVsat : posVsat;
    }

    const inMetrics = extractMetrics(vinVals, freq);
    const outMetrics = extractMetrics(voutVals, freq);

    const simResult: SimulationResult = {
      time,
      vin: vinVals,
      vout: voutVals,
      inMetrics,
      outMetrics,
      gain: Math.abs(posVsat / (vinAmp || 1)),
      gainDb: 20 * Math.log10(Math.abs(posVsat / (vinAmp || 1))),
      phaseDiffDeg: 180,
      clipped: true,
      posVsat,
      negVsat,
      timeUnit,
      timeScaleMultiplier: scale,
      period,
      numCycles
    };

    return {
      topology,
      summaryMetrics: [
        { label: 'Reference Threshold (Vref)', value: cleanFloat(vref), unit: 'V', description: 'Switching comparison threshold' },
        { label: 'Positive Rail (+Vsat)', value: `+${cleanFloat(posVsat)}`, unit: 'V', description: 'Output HIGH saturated level' },
        { label: 'Negative Rail (-Vsat)', value: cleanFloat(negVsat), unit: 'V', description: 'Output LOW saturated level' }
      ],
      derivationSteps: [
        `When Vin > Vref (${cleanFloat(vref)} V) → Vout = -Vsat (${negVsat} V)`,
        `When Vin < Vref (${cleanFloat(vref)} V) → Vout = +Vsat (+${posVsat} V)`
      ],
      simulationResult: simResult
    };
  }

  return null;
}
