/**
 * Safely evaluates arithmetic expressions (e.g., "=10+20", "10 + 20 * 2", "(5 + 3) * 4").
 * Supports:
 * - Leading '=' (Excel-style)
 * - Basic operators: +, -, *, /
 * - Parentheses: ()
 * - Floating point numbers (e.g. 10.5, .75)
 * - Trailing operators trimming (e.g. "10 + " -> 10)
 * - Safe recursive descent parser without eval() or Function()
 */

export function isMathExpression(input: string | null | undefined): boolean {
  if (input == null) return false;
  const s = String(input).trim();
  if (!s) return false;
  if (s.startsWith('=')) return true;
  // Contains +, *, / or - followed by a number or operator, or parentheses
  return /[+*/(]/.test(s) || /-\s*\d/.test(s);
}

export function evaluateMathExpression(input: string | null | undefined): number | null {
  if (input == null) return null;
  let expr = String(input).trim();
  if (!expr) return null;

  // Remove leading equals sign if present
  if (expr.startsWith('=')) {
    expr = expr.substring(1).trim();
  }
  if (!expr) return null;

  // Trim any trailing operators or whitespace (e.g. "10 + " -> "10")
  expr = expr.replace(/[+\-*/\s]+$/, '');
  if (!expr) return null;

  // Tokenize into numbers, operators, and parentheses
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if ('+-*/()'.includes(ch)) {
      tokens.push(ch);
      i++;
      continue;
    }
    // Number: digits and optional single dot
    if (/\d|\./.test(ch)) {
      let numStr = '';
      let hasDot = false;
      while (i < expr.length && /[\d.]/.test(expr[i])) {
        if (expr[i] === '.') {
          if (hasDot) return null; // Invalid multiple dots
          hasDot = true;
        }
        numStr += expr[i];
        i++;
      }
      tokens.push(numStr);
      continue;
    }
    // Invalid character
    return null;
  }

  if (tokens.length === 0) return null;

  let pos = 0;

  function parseExpression(): number {
    return parseAdditive();
  }

  function parseAdditive(): number {
    let left = parseMultiplicative();
    while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
      const op = tokens[pos++];
      const right = parseMultiplicative();
      if (op === '+') {
        left = left + right;
      } else {
        left = left - right;
      }
    }
    return left;
  }

  function parseMultiplicative(): number {
    let left = parsePrimary();
    while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
      const op = tokens[pos++];
      const right = parsePrimary();
      if (op === '*') {
        left = left * right;
      } else {
        if (right === 0) {
          throw new Error('Division by zero');
        }
        left = left / right;
      }
    }
    return left;
  }

  function parsePrimary(): number {
    if (pos >= tokens.length) {
      throw new Error('Unexpected end of expression');
    }
    const token = tokens[pos];

    // Unary plus or minus
    if (token === '+') {
      pos++;
      return parsePrimary();
    }
    if (token === '-') {
      pos++;
      return -parsePrimary();
    }

    if (token === '(') {
      pos++; // consume '('
      const val = parseExpression();
      if (pos >= tokens.length || tokens[pos] !== ')') {
        throw new Error('Mismatched parentheses');
      }
      pos++; // consume ')'
      return val;
    }

    const num = Number(token);
    if (isNaN(num)) {
      throw new Error(`Invalid number token: ${token}`);
    }
    pos++;
    return num;
  }

  try {
    const result = parseExpression();
    if (pos < tokens.length) {
      // Unparsed tokens remain
      return null;
    }
    if (!Number.isFinite(result)) return null;

    // Eliminate JavaScript floating-point epsilon issues (e.g. 0.1 + 0.2 = 0.30000000000000004)
    return Math.round((result + Number.EPSILON) * 1000000) / 1000000;
  } catch {
    return null;
  }
}
