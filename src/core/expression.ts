/* ARTINOS expressions — the arithmetic a number field accepts. A small recursive-descent parser:
   nothing is ever handed to eval, so a pasted string can only ever come out as a number.

     2*3+1 · (4+6)/2 · 2^8 · 1.5k · pi/2 · sin(pi/2) · min(3, 8) · x*2

   `x` is the value being edited. A leading * or / works on it directly ("*2", "/4"), and += and -=
   step it ("+=10"). Returns null for anything that is not a finite number. */

const CONSTANTS: Record<string, number> = { pi: Math.PI, tau: Math.PI * 2, e: Math.E };

const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  abs: Math.abs,
  acos: Math.acos,
  asin: Math.asin,
  atan: Math.atan,
  atan2: Math.atan2,
  ceil: Math.ceil,
  clamp: (v, lo, hi) => Math.min(hi, Math.max(lo, v)),
  cos: Math.cos,
  deg: (r) => (r * 180) / Math.PI,
  exp: Math.exp,
  floor: Math.floor,
  lerp: (a, b, t) => a + (b - a) * t,
  ln: Math.log,
  log: Math.log10,
  log2: Math.log2,
  max: Math.max,
  min: Math.min,
  pow: Math.pow,
  rad: (d) => (d * Math.PI) / 180,
  round: Math.round,
  sin: Math.sin,
  sqrt: Math.sqrt,
  tan: Math.tan,
};

type Token = { t: 'num'; v: number } | { t: 'name'; v: string } | { t: 'op'; v: string };

function tokenize(text: string): Token[] | null {
  const out: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);
    const space = /^\s+/.exec(rest);
    if (space) {
      i += space[0].length;
      continue;
    }
    const num = /^(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?(k(?![a-z]))?/i.exec(rest);
    if (num) {
      out.push({ t: 'num', v: parseFloat(num[0]) * (num[1] ? 1000 : 1) });
      i += num[0].length;
      continue;
    }
    const name = /^[a-z_][a-z0-9_]*/i.exec(rest);
    if (name) {
      out.push({ t: 'name', v: name[0].toLowerCase() });
      i += name[0].length;
      continue;
    }
    if (!'+-*/^%(),'.includes(rest[0])) return null;
    out.push({ t: 'op', v: rest[0] });
    i++;
  }
  return out;
}

/** The value of `text`, or null. `x` is what the field holds now. */
export function evaluate(text: string, x = 0): number | null {
  let source = text.trim().replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
  if (!source) return null;
  if (/^[*/]/.test(source)) source = `x${source}`;
  else if (/^[-+]=/.test(source)) source = `x${source[0]}(${source.slice(2)})`;
  const tokens = tokenize(source);
  if (!tokens?.length) return null;
  let at = 0;
  const peekOp = (v: string) => tokens[at]?.t === 'op' && tokens[at].v === v;
  const take = (v: string) => (peekOp(v) ? (at++, true) : false);
  const fail = (): never => {
    throw new SyntaxError(text);
  };

  const sum = (): number => {
    let v = product();
    for (;;) {
      if (take('+')) v += product();
      else if (take('-')) v -= product();
      else return v;
    }
  };
  const product = (): number => {
    let v = unary();
    for (;;) {
      if (take('*')) v *= unary();
      else if (take('/')) v /= unary();
      else if (take('%')) v %= unary();
      else return v;
    }
  };
  // a sign binds looser than a power: -2^2 is -4
  const unary = (): number => (take('-') ? -unary() : take('+') ? unary() : power());
  const power = (): number => {
    const base = atom();
    return take('^') ? Math.pow(base, unary()) : base;
  };
  const atom = (): number => {
    const token = tokens[at++] ?? fail();
    if (token.t === 'num') return token.v;
    if (token.t === 'op') {
      if (token.v !== '(') fail();
      const v = sum();
      if (!take(')')) fail();
      return v;
    }
    if (take('(')) {
      const fn = Object.prototype.hasOwnProperty.call(FUNCTIONS, token.v) ? FUNCTIONS[token.v] : fail();
      const args = [sum()];
      while (take(',')) args.push(sum());
      if (!take(')')) fail();
      return fn(...args);
    }
    if (token.v === 'x') return x;
    return Object.prototype.hasOwnProperty.call(CONSTANTS, token.v) ? CONSTANTS[token.v] : fail();
  };

  try {
    const value = sum();
    return at === tokens.length && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}
