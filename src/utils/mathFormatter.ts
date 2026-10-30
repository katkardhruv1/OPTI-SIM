/**
 * Utility to convert raw LaTeX or unformatted mathematical strings
 * into clean, readable Unicode engineering typography for UI display.
 */
export function formatMathFormula(raw?: string): string {
  if (!raw) return '';

  let s = raw;

  // 1. Remove \text{...} wrappers
  s = s.replace(/\\text\{([^{}]+)\}/g, '$1');

  // 2. Convert piecewise cases: \begin{cases} ... \end{cases}
  s = s.replace(/\\begin\{cases\}\s*([^\\]+?)\s*\\\\\s*([^\\]+?)\s*\\end\{cases\}/g, (_, c1, c2) => {
    const clean1 = c1.replace(/&/g, ' if ').trim();
    const clean2 = c2.replace(/&/g, ' if ').trim();
    return `${clean1} | ${clean2}`;
  });

  // 3. Convert \frac{numerator}{denominator} -> numerator / denominator
  let prev = '';
  while (s.includes('\\frac') && prev !== s) {
    prev = s;
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_, num, den) => {
      const cleanNum = num.trim();
      const cleanDen = den.trim();
      const wrapNum =
        cleanNum.includes('+') || cleanNum.includes('-') || cleanNum.includes(' ')
          ? `(${cleanNum})`
          : cleanNum;
      const wrapDen =
        cleanDen.includes('+') || cleanDen.includes('-') || cleanDen.includes(' ') || cleanDen.includes('·')
          ? `(${cleanDen})`
          : cleanDen;
      return `${wrapNum} / ${wrapDen}`;
    });
  }

  // 4. Common LaTeX mathematical symbols to clean Unicode
  const symbolMap: Record<string, string> = {
    '\\cdot': '·',
    '\\approx': '≈',
    '\\Delta': 'Δ',
    '\\delta': 'δ',
    '\\pi': 'π',
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\omega': 'ω',
    '\\tau': 'τ',
    '\\theta': 'θ',
    '\\mu': 'μ',
    '\\times': '×',
    '\\propto': '∝',
    '\\infty': '∞',
    '\\implies': '→',
    '\\to': '→',
    '\\pm': '±',
    '\\mp': '∓',
    '\\sqrt': '√',
    '\\sum': '∑',
    '\\int': '∫',
    '\\partial': '∂',
    '\\neq': '≠',
    '\\leq': '≤',
    '\\geq': '≥',
    '\\ln': 'ln',
    '\\log': 'log',
    '\\sin': 'sin',
    '\\cos': 'cos',
    '\\tan': 'tan',
    '\\quad': '  ',
    '\\qquad': '    ',
    '\\%': '%',
    '\\left(': '(',
    '\\right)': ')',
    '\\left[': '[',
    '\\right]': ']',
    '\\{': '{',
    '\\}': '}',
    '\\_': '_',
    '\\ ': ' ',
  };

  for (const [latex, unicode] of Object.entries(symbolMap)) {
    s = s.split(latex).join(unicode);
  }

  // 5. Handle integral limits: \int_0^t -> ∫₀ᵗ
  s = s.replace(/∫_0\^t\s*/g, '∫₀ᵗ ');
  s = s.replace(/∫_\{?([^}^ ]+)\}?\^\{?([^}^ ]+)\}?\s*/g, '∫[$1..$2] ');

  // 6. Handle summation limits: ∑_{i=1}^{N} -> ∑(i=1..N)
  s = s.replace(/∑_\{?([^}^ ]+)\}?\^\{?([^}^ ]+)\}?\s*/g, '∑($1..$2) ');

  // 7. Clean up subscript braces: V_{sat} -> Vsat or V_sat, V_{in} -> Vin, etc.
  s = s.replace(/_\{([a-zA-Z0-9, ]+)\}/g, (_, sub) => `_${sub.replace(/\s+/g, '')}`);

  // 8. Clean up power superscripts: 2^{N} -> 2^N
  s = s.replace(/\^\{([a-zA-Z0-9+-]+)\}/g, '^$1');

  // 9. Remove any remaining stray backslashes
  s = s.replace(/\\([a-zA-Z]+)/g, '$1');
  s = s.replace(/\\/g, '');

  // 10. Clean up multiple spaces
  s = s.replace(/[ \t]{2,}/g, ' ').trim();

  return s;
}
