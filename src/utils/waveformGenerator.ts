import { WaveformType } from '../types/circuit';

export interface WaveformPoint {
  t: number;      // time in seconds
  vin: number;    // input voltage in Volts
  vout: number;   // output voltage in Volts
}

export interface WaveformData {
  points: WaveformPoint[];
  tMin: number;
  tMax: number;
  vMin: number;
  vMax: number;
  timeUnit: string;
}

/**
 * Generates numerical waveform data for the Integrator
 */
export function generateIntegratorWaveform(
  waveform: WaveformType,
  vinPeak: number,
  freqHz: number,
  rc: number,
  numCycles: number = 2,
  numPoints: number = 300
): WaveformData {
  const period = 1 / Math.max(freqHz, 1e-3);
  const tTotal = period * numCycles;
  const omega = 2 * Math.PI * freqHz;
  const points: WaveformPoint[] = [];

  let vMin = -vinPeak;
  let vMax = vinPeak;

  // Max peak output for sine: A / (omega * RC)
  // For display scaling, if gain is too large or too small, we cap output to prevent runaway
  const gain = 1 / Math.max(omega * rc, 1e-6);

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * tTotal;
    const cyclePos = (t / period) % 1; // 0 to 1 in cycle
    let vin = 0;
    let vout = 0;

    if (waveform === 'sine') {
      vin = vinPeak * Math.sin(omega * t);
      // Vout = -1/RC * ∫ A sin(wt) dt = +A/(wRC) * cos(wt)
      vout = vinPeak * gain * Math.cos(omega * t);
    } else if (waveform === 'square') {
      vin = cyclePos < 0.5 ? vinPeak : -vinPeak;
      // Integration of square wave is a triangle wave:
      // When vin = +V, vout slopes down: slope = -V / RC
      // When vin = -V, vout slopes up: slope = +V / RC
      // Peak-to-peak amplitude = (vinPeak * period/2) / RC = vinPeak / (2 * freqHz * rc)
      const voutPk = (vinPeak * period) / (4 * Math.max(rc, 1e-9));
      if (cyclePos < 0.5) {
        // Sloping down from +voutPk to -voutPk
        vout = voutPk - (2 * voutPk * (cyclePos / 0.5));
      } else {
        // Sloping up from -voutPk to +voutPk
        vout = -voutPk + (2 * voutPk * ((cyclePos - 0.5) / 0.5));
      }
    } else {
      // Triangle wave
      // Normalized between -vinPeak and +vinPeak
      if (cyclePos < 0.25) {
        vin = 4 * vinPeak * cyclePos;
      } else if (cyclePos < 0.75) {
        vin = vinPeak - 4 * vinPeak * (cyclePos - 0.25);
      } else {
        vin = -vinPeak + 4 * vinPeak * (cyclePos - 0.75);
      }

      // Integration of triangle wave gives parabolic curved waveform
      // Centered: when vin is zero, vout reaches extrema
      const triGain = 1 / (omega * rc);
      // Approximation for smooth parabolic wave:
      vout = -vinPeak * triGain * Math.cos(omega * t - 0.2);
    }

    // Clamp for display safety if gain is enormous
    const clampedVout = Math.max(-50, Math.min(50, vout));

    points.push({ t, vin, vout: clampedVout });

    if (vin < vMin) vMin = vin;
    if (vin > vMax) vMax = vin;
    if (clampedVout < vMin) vMin = clampedVout;
    if (clampedVout > vMax) vMax = clampedVout;
  }

  // Margin
  const vRange = Math.max(vMax - vMin, 1);
  vMin -= vRange * 0.15;
  vMax += vRange * 0.15;

  return {
    points,
    tMin: 0,
    tMax: tTotal,
    vMin,
    vMax,
    timeUnit: tTotal < 1e-3 ? 'µs' : tTotal < 1 ? 'ms' : 's',
  };
}

/**
 * Generates numerical waveform data for the Differentiator
 */
export function generateDifferentiatorWaveform(
  waveform: WaveformType,
  vinPeak: number,
  freqHz: number,
  rc: number,
  numCycles: number = 2,
  numPoints: number = 400
): WaveformData {
  const period = 1 / Math.max(freqHz, 1e-3);
  const tTotal = period * numCycles;
  const omega = 2 * Math.PI * freqHz;
  const points: WaveformPoint[] = [];

  let vMin = -vinPeak;
  let vMax = vinPeak;

  // Differentiator sinusoidal gain: omega * RC
  const gain = omega * rc;

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * tTotal;
    const cyclePos = (t / period) % 1; // 0 to 1
    let vin = 0;
    let vout = 0;

    if (waveform === 'sine') {
      vin = vinPeak * Math.sin(omega * t);
      // Vout = -RC * d/dt [ A sin(wt) ] = -RC * A * w * cos(wt)
      vout = -vinPeak * gain * Math.cos(omega * t);
    } else if (waveform === 'triangle') {
      // Triangle wave
      if (cyclePos < 0.25) {
        vin = 4 * vinPeak * cyclePos;
      } else if (cyclePos < 0.75) {
        vin = vinPeak - 4 * vinPeak * (cyclePos - 0.25);
      } else {
        vin = -vinPeak + 4 * vinPeak * (cyclePos - 0.75);
      }

      // Derivative of triangle wave:
      // Rising slope: +4 * vinPeak * freqHz
      // Falling slope: -4 * vinPeak * freqHz
      // Vout = -RC * slope
      const voutSquareAmp = 4 * vinPeak * freqHz * rc;
      if (cyclePos < 0.25 || cyclePos >= 0.75) {
        vout = -voutSquareAmp;
      } else {
        vout = +voutSquareAmp;
      }
    } else {
      // Square wave
      vin = cyclePos < 0.5 ? vinPeak : -vinPeak;

      // Practical differentiator on square wave:
      // At transitions (cyclePos ~ 0 and cyclePos ~ 0.5), we get sharp spikes
      // with exponential decay: spikeAmp * exp(-dt / tau)
      const spikeAmp = Math.min(15, vinPeak * 8);
      const spikeWidth = 0.04; // fraction of period

      if (cyclePos < spikeWidth) {
        // Transition from -V to +V -> negative sharp spike in inverting differentiator
        const decay = Math.exp(-cyclePos / (spikeWidth * 0.3));
        vout = -spikeAmp * decay;
      } else if (cyclePos >= 0.5 && cyclePos < 0.5 + spikeWidth) {
        // Transition from +V to -V -> positive sharp spike
        const decay = Math.exp(-(cyclePos - 0.5) / (spikeWidth * 0.3));
        vout = +spikeAmp * decay;
      } else {
        vout = 0;
      }
    }

    const clampedVout = Math.max(-50, Math.min(50, vout));

    points.push({ t, vin, vout: clampedVout });

    if (vin < vMin) vMin = vin;
    if (vin > vMax) vMax = vin;
    if (clampedVout < vMin) vMin = clampedVout;
    if (clampedVout > vMax) vMax = clampedVout;
  }

  // Margin
  const vRange = Math.max(vMax - vMin, 1);
  vMin -= vRange * 0.15;
  vMax += vRange * 0.15;

  return {
    points,
    tMin: 0,
    tMax: tTotal,
    vMin,
    vMax,
    timeUnit: tTotal < 1e-3 ? 'µs' : tTotal < 1 ? 'ms' : 's',
  };
}

/**
 * Generates numerical waveform data for Active Filters (Low Pass / High Pass)
 */
export function generateFilteredWaveform(
  waveform: WaveformType,
  vinPeak: number,
  freqHz: number,
  gainMag: number,
  phaseShiftDeg: number = 0,
  numCycles: number = 2,
  numPoints: number = 300
): WaveformData {
  const period = 1 / Math.max(freqHz, 1e-3);
  const tTotal = period * numCycles;
  const omega = 2 * Math.PI * freqHz;
  const phaseRad = (phaseShiftDeg * Math.PI) / 180;
  const points: WaveformPoint[] = [];

  let vMin = -vinPeak;
  let vMax = vinPeak;

  const voutPeak = vinPeak * gainMag;

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * tTotal;
    const cyclePos = (t / period) % 1;
    let vin = 0;
    let vout = 0;

    if (waveform === 'sine') {
      vin = vinPeak * Math.sin(omega * t);
      vout = voutPeak * Math.sin(omega * t + phaseRad);
    } else if (waveform === 'square') {
      vin = cyclePos < 0.5 ? vinPeak : -vinPeak;
      const tShifted = (t + phaseRad / omega) % period;
      const shiftedPos = (tShifted / period + 1) % 1;
      const rawSq = shiftedPos < 0.5 ? voutPeak : -voutPeak;
      vout = rawSq * 0.95;
    } else {
      if (cyclePos < 0.25) {
        vin = 4 * vinPeak * cyclePos;
      } else if (cyclePos < 0.75) {
        vin = vinPeak - 4 * vinPeak * (cyclePos - 0.25);
      } else {
        vin = -vinPeak + 4 * vinPeak * (cyclePos - 0.75);
      }
      vout = vin * gainMag;
    }

    const clampedVout = Math.max(-50, Math.min(50, vout));
    points.push({ t, vin, vout: clampedVout });

    if (vin < vMin) vMin = vin;
    if (vin > vMax) vMax = vin;
    if (clampedVout < vMin) vMin = clampedVout;
    if (clampedVout > vMax) vMax = clampedVout;
  }

  const vRange = Math.max(vMax - vMin, 1);
  vMin -= vRange * 0.15;
  vMax += vRange * 0.15;

  return {
    points,
    tMin: 0,
    tMax: tTotal,
    vMin,
    vMax,
    timeUnit: tTotal < 1e-3 ? 'µs' : tTotal < 1 ? 'ms' : 's',
  };
}

/**
 * Generates numerical waveform data for the Precision Half-Wave Rectifier
 */
export function generateRectifiedWaveform(
  vinPeak: number,
  freqHz: number,
  numCycles: number = 2,
  numPoints: number = 300
): WaveformData {
  const period = 1 / Math.max(freqHz, 1e-3);
  const tTotal = period * numCycles;
  const omega = 2 * Math.PI * freqHz;
  const points: WaveformPoint[] = [];

  let vMin = -vinPeak;
  let vMax = vinPeak;

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * tTotal;
    const vin = vinPeak * Math.sin(omega * t);
    const vout = vin > 0 ? vin : 0;

    points.push({ t, vin, vout });

    if (vin < vMin) vMin = vin;
    if (vin > vMax) vMax = vin;
  }

  const vRange = Math.max(vMax - vMin, 1);
  vMin -= vRange * 0.15;
  vMax += vRange * 0.15;

  return {
    points,
    tMin: 0,
    tMax: tTotal,
    vMin,
    vMax,
    timeUnit: tTotal < 1e-3 ? 'µs' : tTotal < 1 ? 'ms' : 's',
  };
}

/**
 * Generates numerical waveform data for the Op-Amp Comparator
 */
export function generateComparatorWaveform(
  waveform: WaveformType,
  vinPeak: number,
  freqHz: number,
  vref: number,
  posVsat: number,
  negVsat: number,
  comparatorType: 'non-inverting' | 'inverting' = 'non-inverting',
  numCycles: number = 2,
  numPoints: number = 400
): WaveformData {
  const period = 1 / Math.max(freqHz, 1e-3);
  const tTotal = period * numCycles;
  const omega = 2 * Math.PI * freqHz;
  const points: WaveformPoint[] = [];

  let vMin = Math.min(-vinPeak, negVsat);
  let vMax = Math.max(vinPeak, posVsat);

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * tTotal;
    const cyclePos = (t / period) % 1;
    let vin = 0;

    if (waveform === 'sine') {
      vin = vinPeak * Math.sin(omega * t);
    } else if (waveform === 'square') {
      vin = cyclePos < 0.5 ? vinPeak : -vinPeak;
    } else {
      // Triangle wave
      if (cyclePos < 0.25) {
        vin = 4 * vinPeak * cyclePos;
      } else if (cyclePos < 0.75) {
        vin = vinPeak - 4 * vinPeak * (cyclePos - 0.25);
      } else {
        vin = -vinPeak + 4 * vinPeak * (cyclePos - 0.75);
      }
    }

    let vout = 0;
    if (comparatorType === 'non-inverting') {
      vout = vin > vref ? posVsat : vin < vref ? negVsat : 0;
    } else {
      vout = vin > vref ? negVsat : vin < vref ? posVsat : 0;
    }

    points.push({ t, vin, vout });

    if (vin < vMin) vMin = vin;
    if (vin > vMax) vMax = vin;
    if (vout < vMin) vMin = vout;
    if (vout > vMax) vMax = vout;
  }

  const vRange = Math.max(vMax - vMin, 1);
  vMin -= vRange * 0.1;
  vMax += vRange * 0.1;

  return {
    points,
    tMin: 0,
    tMax: tTotal,
    vMin,
    vMax,
    timeUnit: tTotal < 1e-3 ? 'µs' : tTotal < 1 ? 'ms' : 's',
  };
}

/**
 * Generates numerical waveform data for the Schmitt Trigger with true hysteresis memory
 */
export function generateSchmittWaveform(
  waveform: WaveformType,
  vinPeak: number,
  freqHz: number,
  utp: number,
  ltp: number,
  posVsat: number,
  negVsat: number,
  numCycles: number = 2,
  numPoints: number = 500
): WaveformData {
  const period = 1 / Math.max(freqHz, 1e-3);
  const tTotal = period * numCycles;
  const omega = 2 * Math.PI * freqHz;
  const points: WaveformPoint[] = [];

  let vMin = Math.min(-vinPeak, negVsat, ltp);
  let vMax = Math.max(vinPeak, posVsat, utp);

  // Initialize state based on initial input value
  let currentState = negVsat;

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * tTotal;
    const cyclePos = (t / period) % 1;
    let vin = 0;

    if (waveform === 'sine') {
      vin = vinPeak * Math.sin(omega * t);
    } else if (waveform === 'square') {
      vin = cyclePos < 0.5 ? vinPeak : -vinPeak;
    } else {
      // Triangle wave
      if (cyclePos < 0.25) {
        vin = 4 * vinPeak * cyclePos;
      } else if (cyclePos < 0.75) {
        vin = vinPeak - 4 * vinPeak * (cyclePos - 0.25);
      } else {
        vin = -vinPeak + 4 * vinPeak * (cyclePos - 0.75);
      }
    }

    // Schmitt trigger memory logic:
    // If Vin > UTP, switches to +Vsat
    // If Vin < LTP, switches to -Vsat
    // If between LTP and UTP, retains currentState!
    if (vin > utp) {
      currentState = posVsat;
    } else if (vin < ltp) {
      currentState = negVsat;
    }

    points.push({ t, vin, vout: currentState });

    if (vin < vMin) vMin = vin;
    if (vin > vMax) vMax = vin;
    if (currentState < vMin) vMin = currentState;
    if (currentState > vMax) vMax = currentState;
  }

  const vRange = Math.max(vMax - vMin, 1);
  vMin -= vRange * 0.1;
  vMax += vRange * 0.1;

  return {
    points,
    tMin: 0,
    tMax: tTotal,
    vMin,
    vMax,
    timeUnit: tTotal < 1e-3 ? 'µs' : tTotal < 1 ? 'ms' : 's',
  };
}

/**
 * Generates numerical waveform data for the Astable Square Wave Generator
 * Includes the output square wave and the exponential capacitor charging wave vc(t)
 */
export function generateAstableSquareWave(
  timePeriod: number,
  posVsat: number,
  negVsat: number,
  beta: number,
  rc: number,
  numCycles: number = 2.5,
  numPoints: number = 500
): WaveformData {
  const period = Math.max(timePeriod, 1e-6);
  const tTotal = period * numCycles;
  const points: WaveformPoint[] = [];

  let vMin = negVsat;
  let vMax = posVsat;

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * tTotal;
    const cyclePos = (t / period) % 1; // 0 to 1

    // Output square wave
    const vout = cyclePos < 0.5 ? posVsat : negVsat;

    // Capacitor voltage vc(t) exponential charging towards saturation rail
    // and reversing when it hits +/- beta * Vsat
    let vc = 0;
    if (cyclePos < 0.5) {
      // Charging up towards +Vsat from -beta*Vsat
      const tInHalf = cyclePos * period;
      const decay = Math.exp(-tInHalf / Math.max(rc, 1e-9));
      vc = posVsat - (posVsat + beta * posVsat) * decay;
    } else {
      // Charging down towards -Vsat from +beta*Vsat
      const tInHalf = (cyclePos - 0.5) * period;
      const decay = Math.exp(-tInHalf / Math.max(rc, 1e-9));
      vc = negVsat + (Math.abs(negVsat) + beta * Math.abs(negVsat)) * decay;
    }

    // vin represents capacitor voltage vc(t) on dual-trace scope
    points.push({ t, vin: vc, vout });

    if (vout < vMin) vMin = vout;
    if (vout > vMax) vMax = vout;
    if (vc < vMin) vMin = vc;
    if (vc > vMax) vMax = vc;
  }

  const vRange = Math.max(vMax - vMin, 1);
  vMin -= vRange * 0.15;
  vMax += vRange * 0.15;

  return {
    points,
    tMin: 0,
    tMax: tTotal,
    vMin,
    vMax,
    timeUnit: tTotal < 1e-3 ? 'µs' : tTotal < 1 ? 'ms' : 's',
  };
}

/**
 * Generates numerical waveform data for the Triangular Wave Generator
 * Mathematically integrates the square wave into a continuous triangle waveform
 */
export function generateTriangularFromSquare(
  squareAmp: number,
  timePeriod: number,
  rc: number,
  numCycles: number = 2.5,
  numPoints: number = 500
): WaveformData {
  const period = Math.max(timePeriod, 1e-6);
  const tTotal = period * numCycles;
  const points: WaveformPoint[] = [];

  // Vpp = Vin * T / (2 * RC)
  const vpp = rc > 0 ? (squareAmp * period) / (2 * rc) : 0;
  const vPeak = vpp / 2;

  let vMin = -squareAmp;
  let vMax = squareAmp;

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * tTotal;
    const cyclePos = (t / period) % 1; // 0 to 1

    // Square wave input
    const vin = cyclePos < 0.5 ? squareAmp : -squareAmp;

    // Output triangle wave (inverting integrator: when vin > 0, output ramps down)
    let vout = 0;
    if (cyclePos < 0.5) {
      // Ramps from +vPeak to -vPeak with slope = -Vin / RC
      vout = vPeak - (2 * vPeak * (cyclePos / 0.5));
    } else {
      // Ramps from -vPeak to +vPeak with slope = +Vin / RC
      vout = -vPeak + (2 * vPeak * ((cyclePos - 0.5) / 0.5));
    }

    points.push({ t, vin, vout });

    if (vin < vMin) vMin = vin;
    if (vin > vMax) vMax = vin;
    if (vout < vMin) vMin = vout;
    if (vout > vMax) vMax = vout;
  }

  const vRange = Math.max(vMax - vMin, 1);
  vMin -= vRange * 0.15;
  vMax += vRange * 0.15;

  return {
    points,
    tMin: 0,
    tMax: tTotal,
    vMin,
    vMax,
    timeUnit: tTotal < 1e-3 ? 'µs' : tTotal < 1 ? 'ms' : 's',
  };
}

export interface PWMPoint {
  t: number;
  carrier: number; // triangular carrier
  vControl: number; // reference level
  pwmOut: number;   // digital pulse
}

export interface PWMWaveformData {
  points: PWMPoint[];
  tMin: number;
  tMax: number;
  vMin: number;
  vMax: number;
  timeUnit: string;
}

/**
 * Generates numerical waveform data for the PWM Generator
 * Carrier triangle, DC control reference, and comparator PWM output
 */
export function generatePWMWaveformData(
  carrierFreq: number,
  vMinCarrier: number,
  vMaxCarrier: number,
  vControl: number,
  numCycles: number = 3,
  numPoints: number = 600
): PWMWaveformData {
  const period = 1 / Math.max(carrierFreq, 1e-3);
  const tTotal = period * numCycles;
  const points: PWMPoint[] = [];

  const carrierSpan = vMaxCarrier - vMinCarrier;
  let minV = Math.min(vMinCarrier, vControl, 0);
  let maxV = Math.max(vMaxCarrier, vControl, 5);

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * tTotal;
    const cyclePos = (t / period) % 1; // 0 to 1

    // Symmetrical triangular carrier from vMinCarrier to vMaxCarrier
    let carrier = 0;
    if (cyclePos < 0.5) {
      carrier = vMinCarrier + carrierSpan * (cyclePos / 0.5);
    } else {
      carrier = vMaxCarrier - carrierSpan * ((cyclePos - 0.5) / 0.5);
    }

    // PWM output: HIGH (5V) when vControl > carrier, LOW (0V) otherwise
    const pwmOut = vControl > carrier ? 5 : 0;

    points.push({
      t,
      carrier,
      vControl,
      pwmOut,
    });
  }

  const vRange = Math.max(maxV - minV, 1);
  minV -= vRange * 0.1;
  maxV += vRange * 0.1;

  return {
    points,
    tMin: 0,
    tMax: tTotal,
    vMin: minV,
    vMax: maxV,
    timeUnit: tTotal < 1e-3 ? 'µs' : tTotal < 1 ? 'ms' : 's',
  };
}
