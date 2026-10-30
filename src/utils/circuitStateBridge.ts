/**
 * Circuit State Bridge for OPTI-SIM
 * Synchronizes active circuit parameters, calculation results, and waveform data
 * between the interactive Circuit Simulator workspaces and Engineering Lab Mode.
 */

import { calculateInvertingAmp } from '../calculations/invertingAmp';
import { calculateNonInvertingAmp } from '../calculations/nonInvertingAmp';
import { calculateVoltageFollower } from '../calculations/voltageFollower';
import { calculateSummingAmplifier } from '../calculations/summingAmp';
import { calculateDifferentialAmplifier } from '../calculations/diffAmp';
import { calculateIntegrator } from '../calculations/integrator';
import { calculateDifferentiator } from '../calculations/differentiator';
import { calculateLowPassResponse, calculateHighPassResponse } from '../calculations/activeFilter';
import { calculatePrecisionRectifier } from '../calculations/rectifier';
import { calculateComparator } from '../calculations/comparator';
import { calculateSchmittTrigger } from '../calculations/schmittTrigger';
import { calculateSquareWave } from '../calculations/squareWave';
import { calculateTriangularWave } from '../calculations/triangularWave';
import { calculatePWM } from '../calculations/pwm';
import { calculateDAC } from '../calculations/dac';
import { calculateADC } from '../calculations/adc';
import { ObservationRow } from '../types/lab';
import { cleanFloat } from './formatters';

export const CIRCUIT_UPDATE_EVENT = 'optisim-circuit-update';

export interface ActiveCircuitPayload {
  circuitId: string;
  inputs: any;
  results: any;
}

/**
 * Returns reference default inputs for any circuit matching Section 5 standard test suite
 */
export function getDefaultInputsForCircuit(circuitId: string): any {
  switch (circuitId) {
    case 'inverting-amplifier':
      return { vin: 2, vinUnit: 'V', rin: 10, rinUnit: 'kΩ', rf: 50, rfUnit: 'kΩ' };
    case 'non-inverting-amplifier':
      return { vin: 1, vinUnit: 'V', r1: 10, r1Unit: 'kΩ', rf: 90, rfUnit: 'kΩ' };
    case 'voltage-follower':
      return { vin: 5, vinUnit: 'V' };
    case 'summing-amplifier':
      return {
        rf: 10,
        rfUnit: 'kΩ',
        channels: [
          { id: 'ch-1', name: 'Channel 1', voltage: 1, voltageUnit: 'V', resistance: 10, resistanceUnit: 'kΩ' },
          { id: 'ch-2', name: 'Channel 2', voltage: 2, voltageUnit: 'V', resistance: 10, resistanceUnit: 'kΩ' },
        ],
      };
    case 'differential-amplifier':
      return {
        v1: 2,
        v1Unit: 'V',
        v2: 1,
        v2Unit: 'V',
        r1: 10,
        r1Unit: 'kΩ',
        r2: 10,
        r2Unit: 'kΩ',
        rf: 20,
        rfUnit: 'kΩ',
        rg: 20,
        rgUnit: 'kΩ',
      };
    case 'integrator':
      return { vin: 1, vinUnit: 'V', frequency: 1000, frequencyUnit: 'Hz', r: 10, rUnit: 'kΩ', c: 0.01, cUnit: 'µF', waveform: 'square' };
    case 'differentiator':
      return { vin: 1, vinUnit: 'V', frequency: 1000, frequencyUnit: 'Hz', r: 10, rUnit: 'kΩ', c: 0.01, cUnit: 'µF', waveform: 'triangle' };
    case 'low-pass-filter':
      return { passbandGain: 1, r: 10, rUnit: 'kΩ', c: 0.01, cUnit: 'µF', vin: 2, vinUnit: 'V', frequency: 100, frequencyUnit: 'Hz', waveform: 'sine' };
    case 'high-pass-filter':
      return { passbandGain: 1, r: 10, rUnit: 'kΩ', c: 0.01, cUnit: 'µF', vin: 2, vinUnit: 'V', frequency: 10000, frequencyUnit: 'Hz', waveform: 'sine' };
    case 'precision-rectifier':
      return { vin: 2, vinUnit: 'V', frequency: 1000, frequencyUnit: 'Hz', diodeType: 'Ideal Superdiode' };
    case 'comparator':
      return { vin: 2, vinUnit: 'V', vref: 1, vrefUnit: 'V', posVsat: 15, negVsat: -15, comparatorType: 'non-inverting', frequency: 1000, frequencyUnit: 'Hz', waveform: 'sine' };
    case 'schmitt-trigger':
      return { vinAmplitude: 5, vinUnit: 'V', vrefCenter: 0, posVsat: 12, negVsat: -12, rf: 20, rfUnit: 'kΩ', r1: 10, r1Unit: 'kΩ', frequency: 1000, frequencyUnit: 'Hz', waveform: 'sine' };
    case 'square-wave-generator':
      return { posVsat: 12, negVsat: -12, r1: 10, r1Unit: 'kΩ', r2: 10, r2Unit: 'kΩ', r: 10, rUnit: 'kΩ', c: 0.01, cUnit: 'µF' };
    case 'triangular-wave-generator':
      return { amplitude: 12, amplitudeUnit: 'V', frequency: 1000, frequencyUnit: 'Hz', r: 10, rUnit: 'kΩ', c: 0.01, cUnit: 'µF', offset: 0 };
    case 'pwm-generator':
      return { carrierFreq: 1000, carrierFreqUnit: 'Hz', carrierAmp: 5, vMin: 0, vMax: 5, vControl: 2.5, pwmMode: 'comparator-based' };
    case 'dac':
      return { resolution: 4, vref: 5, digitalBinary: '1010', digitalDecimal: 10 };
    case 'adc':
      return { resolution: 4, vref: 5, vin: 2.5 };
    default:
      return {};
  }
}

/**
 * Calculates results for given inputs and circuit ID
 */
export function computeResultsForCircuit(circuitId: string, inputs: any): any {
  try {
    switch (circuitId) {
      case 'inverting-amplifier': return calculateInvertingAmp(inputs);
      case 'non-inverting-amplifier': return calculateNonInvertingAmp(inputs);
      case 'voltage-follower': return calculateVoltageFollower(inputs);
      case 'summing-amplifier': return calculateSummingAmplifier(inputs);
      case 'differential-amplifier': return calculateDifferentialAmplifier(inputs);
      case 'integrator': return calculateIntegrator(inputs);
      case 'differentiator': return calculateDifferentiator(inputs);
      case 'low-pass-filter': return calculateLowPassResponse(inputs);
      case 'high-pass-filter': return calculateHighPassResponse(inputs);
      case 'precision-rectifier': return calculatePrecisionRectifier(inputs);
      case 'comparator': return calculateComparator(inputs);
      case 'schmitt-trigger': return calculateSchmittTrigger(inputs);
      case 'square-wave-generator': return calculateSquareWave(inputs);
      case 'triangular-wave-generator': return calculateTriangularWave(inputs);
      case 'pwm-generator': return calculatePWM(inputs);
      case 'dac': return calculateDAC(inputs);
      case 'adc': return calculateADC(inputs);
      default: return null;
    }
  } catch (err) {
    console.warn(`Error computing results for ${circuitId}:`, err);
    return null;
  }
}

/**
 * Saves current active circuit state and broadcasts to Lab Mode
 */
export function saveActiveCircuitState(circuitId: string, inputs: any, results: any): void {
  try {
    const payload: ActiveCircuitPayload = { circuitId, inputs, results };
    localStorage.setItem(`optisim_active_${circuitId}`, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent(CIRCUIT_UPDATE_EVENT, { detail: payload }));
  } catch (err) {
    console.warn('Failed to save active circuit state:', err);
  }
}

/**
 * Retrieves the currently active or default state for any circuit
 */
export function getActiveCircuitState(circuitId: string): { inputs: any; results: any } {
  try {
    const raw = localStorage.getItem(`optisim_active_${circuitId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.inputs && parsed.results) {
        return { inputs: parsed.inputs, results: parsed.results };
      }
    }
  } catch {
    // fallback
  }

  const defInputs = getDefaultInputsForCircuit(circuitId);
  const defResults = computeResultsForCircuit(circuitId, defInputs);
  return { inputs: defInputs, results: defResults };
}

/**
 * Creates an empirical observation row from the current simulation state
 * Ensures observations strictly derive from actual simulation data or student input
 */
export function generateObservationFromSimulation(
  circuitId: string,
  inputs: any,
  results: any
): ObservationRow | null {
  const rowId = `row-${Date.now()}`;
  if (!inputs || !results) return null;

  switch (circuitId) {
    case 'inverting-amplifier': {
      const vin = inputs.vin ?? 1;
      const rin = inputs.rin ?? 10;
      const rf = inputs.rf ?? 50;
      const gainTheo = results.av ?? -(rf / rin);
      const voutSim = results.vout ?? (gainTheo * vin);
      return { id: rowId, vin, rin, rf, gainTheo: Number(cleanFloat(gainTheo, 2)), voutSim: Number(cleanFloat(voutSim, 2)), error: 0.0 };
    }
    case 'non-inverting-amplifier': {
      const vin = inputs.vin ?? 1;
      const r1 = inputs.r1 ?? 10;
      const rf = inputs.rf ?? 90;
      const gainTheo = results.av ?? (1 + rf / r1);
      const voutSim = results.vout ?? (gainTheo * vin);
      return { id: rowId, vin, r1, rf, gainTheo: Number(cleanFloat(gainTheo, 2)), voutSim: Number(cleanFloat(voutSim, 2)), error: 0.0 };
    }
    case 'voltage-follower': {
      const vin = inputs.vin ?? 5;
      const voutSim = results.vout ?? vin;
      return { id: rowId, vin, voutSim: Number(cleanFloat(voutSim, 2)), error: 0.0 };
    }
    case 'summing-amplifier': {
      const rf = inputs.rf ?? 10;
      const ch1 = inputs.channels?.[0]?.voltage ?? 1;
      const ch2 = inputs.channels?.[1]?.voltage ?? 2;
      const voutSim = results.vout ?? -(ch1 + ch2);
      return { id: rowId, v1: ch1, v2: ch2, rf, voutSim: Number(cleanFloat(voutSim, 2)), error: 0.0 };
    }
    case 'differential-amplifier': {
      const v1 = inputs.v1 ?? 2;
      const v2 = inputs.v2 ?? 1;
      const vdiff = v2 - v1;
      const voutSim = results.vout ?? (2 * vdiff);
      return { id: rowId, v1, v2, vdiff, voutSim: Number(cleanFloat(voutSim, 2)), error: 0.0 };
    }
    case 'integrator': {
      const vin = inputs.vin ?? 1;
      const f = inputs.frequency ?? 1000;
      const tau = results.rcTimeConstant ?? 0.0001;
      const gain = results.gain ?? 1;
      return { id: rowId, vin, f, tau: Number(cleanFloat(tau * 1e3, 3)), gainTheo: Number(cleanFloat(gain, 3)) };
    }
    case 'differentiator': {
      const vin = inputs.vin ?? 1;
      const f = inputs.frequency ?? 1000;
      const tau = results.rcTimeConstant ?? 0.0001;
      const gain = results.gain ?? 1;
      return { id: rowId, vin, f, tau: Number(cleanFloat(tau * 1e3, 3)), gainTheo: Number(cleanFloat(gain, 3)) };
    }
    case 'low-pass-filter':
    case 'high-pass-filter': {
      const f = inputs.frequency ?? 1000;
      const vin = inputs.vin ?? 1;
      const gainMag = results.gainMag ?? 1;
      const vout = results.vout ?? vin;
      const gainDb = results.gainDb ?? 0;
      return { id: rowId, f, vin, gainTheo: Number(cleanFloat(gainMag, 3)), voutSim: Number(cleanFloat(vout, 3)), gainDb: Number(cleanFloat(gainDb, 2)) };
    }
    case 'precision-rectifier': {
      const vin = inputs.vin ?? 2;
      const vpos = results.voutPosPeak ?? vin;
      const vneg = results.voutNegPeak ?? 0;
      return { id: rowId, vin, vpos: Number(cleanFloat(vpos, 2)), vneg: Number(cleanFloat(vneg, 2)) };
    }
    case 'comparator': {
      const vin = inputs.vin ?? 2;
      const vref = inputs.vref ?? 1;
      const vout = results.vout ?? 15;
      const state = results.stateLabel ?? (vout > 0 ? '+Vsat' : '-Vsat');
      return { id: rowId, vin, vref, vout: Number(cleanFloat(vout, 1)), state };
    }
    case 'schmitt-trigger': {
      const vin = inputs.vinAmplitude ?? 5;
      const utp = results.utp ?? 4;
      const ltp = results.ltp ?? -4;
      const vh = results.hysteresisWidth ?? (utp - ltp);
      return { id: rowId, vin, utp: Number(cleanFloat(utp, 2)), ltp: Number(cleanFloat(ltp, 2)), vh: Number(cleanFloat(vh, 2)) };
    }
    case 'square-wave-generator': {
      const f = results.frequency ?? 1000;
      const t = results.timePeriod ?? 0.001;
      const beta = results.beta ?? 0.5;
      return { id: rowId, beta: Number(cleanFloat(beta, 3)), period: Number(cleanFloat(t * 1e3, 3)), freq: Number(cleanFloat(f, 1)) };
    }
    case 'triangular-wave-generator': {
      const vin = inputs.amplitude ?? 12;
      const f = inputs.frequency ?? 1000;
      const vpp = results.vpp ?? 12;
      const slope = results.outputSlope ?? 1000;
      return { id: rowId, vin, f, vpp: Number(cleanFloat(vpp, 2)), slope: Number(cleanFloat(slope, 1)) };
    }
    case 'pwm-generator': {
      const vctrl = inputs.vControl ?? 2.5;
      const duty = results.dutyCycle ?? 50;
      const f = results.carrierFreq ?? 1000;
      return { id: rowId, vctrl, f, duty: Number(cleanFloat(duty, 1)) };
    }
    case 'dac': {
      const bin = inputs.digitalBinary ?? '1010';
      const dec = results.decimalValue ?? 10;
      const vout = results.vout ?? 3.333;
      return { id: rowId, binary: bin, decimal: dec, voutTheo: Number(cleanFloat(vout, 3)), voutSim: Number(cleanFloat(vout, 3)), error: 0.0 };
    }
    case 'adc': {
      const vin = inputs.vin ?? 2.5;
      const dec = results.digitalDecimal ?? 8;
      const bin = results.digitalBinary ?? '1000';
      const vq = results.quantizedVoltage ?? 2.667;
      const errMv = (results.quantizationError ?? -0.167) * 1000;
      return { id: rowId, vin, decimalSim: dec, binarySim: bin, vqSim: Number(cleanFloat(vq, 3)), errorSim: Number(cleanFloat(errMv, 1)) };
    }
    default:
      return null;
  }
}
