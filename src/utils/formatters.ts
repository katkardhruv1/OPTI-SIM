/**
 * Formatting and engineering unit conversion utilities for OPTI-SIM
 * Standardized numerical precision and display formatting.
 */

export function convertToVolts(val: number, unit: 'V' | 'mV'): number {
  if (!isFinite(val)) return 0;
  if (unit === 'mV') return val * 1e-3;
  return val;
}

export function convertToOhms(val: number, unit: 'Ω' | 'kΩ' | 'MΩ'): number {
  if (!isFinite(val)) return 0;
  if (unit === 'kΩ') return val * 1e3;
  if (unit === 'MΩ') return val * 1e6;
  return val;
}

export function convertToFarads(val: number, unit: 'µF' | 'nF' | 'pF' | 'F'): number {
  if (!isFinite(val)) return 0;
  if (unit === 'µF') return val * 1e-6;
  if (unit === 'nF') return val * 1e-9;
  if (unit === 'pF') return val * 1e-12;
  return val;
}

export function convertToHertz(val: number, unit: 'Hz' | 'kHz' | 'MHz'): number {
  if (!isFinite(val)) return 0;
  if (unit === 'kHz') return val * 1e3;
  if (unit === 'MHz') return val * 1e6;
  return val;
}

export function formatResistance(ohms: number): string {
  if (!isFinite(ohms)) return '0 Ω';
  if (ohms >= 1e6) {
    const val = ohms / 1e6;
    return `${cleanFloat(val)} MΩ`;
  }
  if (ohms >= 1e3) {
    const val = ohms / 1e3;
    return `${cleanFloat(val)} kΩ`;
  }
  return `${cleanFloat(ohms)} Ω`;
}

export function formatCapacitance(farads: number): string {
  if (!isFinite(farads)) return '0 F';
  if (farads >= 1) {
    return `${cleanFloat(farads)} F`;
  }
  if (farads >= 1e-3) {
    return `${cleanFloat(farads * 1e3)} mF`;
  }
  if (farads >= 1e-6) {
    return `${cleanFloat(farads * 1e6)} µF`;
  }
  if (farads >= 1e-9) {
    return `${cleanFloat(farads * 1e9)} nF`;
  }
  return `${cleanFloat(farads * 1e12)} pF`;
}

export function formatFrequency(hz: number): string {
  if (!isFinite(hz)) return '0 Hz';
  if (hz >= 1e6) {
    return `${cleanFloat(hz / 1e6)} MHz`;
  }
  if (hz >= 1e3) {
    return `${cleanFloat(hz / 1e3)} kHz`;
  }
  return `${cleanFloat(hz)} Hz`;
}

export function formatTimeSeconds(seconds: number): string {
  if (!isFinite(seconds)) return '0 s';
  const abs = Math.abs(seconds);
  if (abs >= 1 || abs === 0) {
    return `${cleanFloat(seconds)} s`;
  }
  if (abs >= 1e-3) {
    return `${cleanFloat(seconds * 1e3)} ms`;
  }
  if (abs >= 1e-6) {
    return `${cleanFloat(seconds * 1e6)} µs`;
  }
  return `${cleanFloat(seconds * 1e9)} ns`;
}

export function formatVoltage(volts: number): string {
  if (!isFinite(volts)) return '0 V';
  const abs = Math.abs(volts);
  if (abs < 0.001 && abs > 0) {
    return `${cleanFloat(volts * 1e3)} mV`;
  }
  return `${cleanFloat(volts)} V`;
}

export function formatCurrent(amps: number): string {
  if (!isFinite(amps)) return '0 A';
  const abs = Math.abs(amps);
  if (abs < 1e-6 && abs > 0) {
    return `${cleanFloat(amps * 1e9)} nA`;
  }
  if (abs < 1e-3 && abs > 0) {
    return `${cleanFloat(amps * 1e6)} µA`;
  }
  if (abs < 1 && abs > 0) {
    return `${cleanFloat(amps * 1e3)} mA`;
  }
  return `${cleanFloat(amps)} A`;
}

/**
 * Standardizes numerical precision for engineering display:
 * - Eliminates floating-point roundoff (e.g. 2.00000000001 -> 2)
 * - Retains clean precision without false trailing zeros
 * - Avoids zero underflow for very small values
 * - Never returns NaN, Infinity, null, or undefined as display strings
 */
export function cleanFloat(val: number, precision: number = 4): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  if (!isFinite(val)) return val > 0 ? '+Vsat' : '-Vsat';

  // Check if value is integer or within tiny epsilon of integer
  if (Math.abs(val - Math.round(val)) < 1e-7) {
    return Math.round(val).toString();
  }

  const abs = Math.abs(val);

  // If very small number, prevent turning into '0'
  if (abs < 1e-4 && abs > 0) {
    return val.toExponential(Math.min(precision, 3));
  }

  // Normal decimals: format with specified precision and strip trailing zeros
  const str = val.toFixed(precision);
  const parsed = parseFloat(str);
  if (Math.abs(parsed - Math.round(parsed)) < 1e-7) {
    return Math.round(parsed).toString();
  }
  return parsed.toString();
}
