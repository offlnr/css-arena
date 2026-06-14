// ── Shorthand → longhand expansion ───────────────────────────────────────────
const EXPAND: Record<string, string[]> = {
  padding:           ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
  margin:            ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
  border:            ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
                      'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
                      'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style'],
  'border-radius':   ['border-top-left-radius', 'border-top-right-radius',
                      'border-bottom-right-radius', 'border-bottom-left-radius'],
  'border-width':    ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'],
  'border-color':    ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'],
  'border-style':    ['border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style'],
  background:        ['background-color', 'background-image', 'background-size', 'background-position'],
  font:              ['font-size', 'font-weight', 'font-family', 'font-style', 'line-height'],
  gap:               ['row-gap', 'column-gap'],
  inset:             ['top', 'right', 'bottom', 'left'],
  overflow:          ['overflow-x', 'overflow-y'],
  outline:           ['outline-width', 'outline-color', 'outline-style'],
  'text-decoration': ['text-decoration-line', 'text-decoration-color', 'text-decoration-style'],
  // intentionally skip: transition, animation, transform (complex to compare fairly)
  transition: [],
  animation:  [],
};

// Extract the longhand properties that the target CSS explicitly sets
function extractProps(css: string): string[] {
  const raw = new Set<string>();
  const re = /[\w-]+(?=\s*:)/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const p = m[0].toLowerCase();
    if (!p.startsWith('--')) raw.add(p); // skip CSS variables
  }
  const result = new Set<string>();
  for (const p of raw) {
    const expanded = EXPAND[p];
    if (expanded !== undefined) {
      expanded.forEach((e) => result.add(e));
    } else {
      result.add(p);
    }
  }
  return [...result];
}

// ── Value comparison helpers ──────────────────────────────────────────────────
function parseRgb(v: string): [number, number, number] | null {
  const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : null;
}

function parseNum(v: string): number | null {
  const m = v.match(/^([\d.]+)/);
  return m ? parseFloat(m[1]) : null;
}

function valuesMatch(prop: string, a: string, b: string): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  // Color comparison with tolerance ±15 per channel
  if (prop.includes('color')) {
    const ca = parseRgb(a), cb = parseRgb(b);
    if (ca && cb) {
      return Math.abs(ca[0] - cb[0]) <= 15
          && Math.abs(ca[1] - cb[1]) <= 15
          && Math.abs(ca[2] - cb[2]) <= 15;
    }
  }

  // Numeric comparison with ±3px / ±0.1em tolerance
  const na = parseNum(a), nb = parseNum(b);
  if (na !== null && nb !== null) {
    const unit = a.replace(/[\d.]+/, '') || b.replace(/[\d.]+/, '');
    const tol = unit.includes('em') ? 0.1 : 3;
    return Math.abs(na - nb) <= tol;
  }

  return false;
}

// ── Iframe rendering ──────────────────────────────────────────────────────────
function buildDoc(html: string, css: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#f0f2f5;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;font-family:sans-serif;}
${css}
</style></head><body>${html}</body></html>`;
}

function renderInIframe(html: string, css: string): Promise<{ doc: Document; cleanup: () => void }> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-600px;top:0;width:500px;height:500px;border:none;visibility:hidden;';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    document.body.appendChild(iframe);
    const cleanup = () => { if (document.body.contains(iframe)) document.body.removeChild(iframe); };
    iframe.onload = () => resolve({ doc: iframe.contentDocument!, cleanup });
    iframe.onerror = () => { cleanup(); reject(new Error('iframe load failed')); };
    iframe.srcdoc = buildDoc(html, css);
  });
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function calcVisualScore(
  targetHTML: string,
  targetCSS: string,
  userHTML: string,
  userCSS: string,
): Promise<number> {
  const props = extractProps(targetCSS);
  if (props.length === 0) return 0;

  const [target, user] = await Promise.all([
    renderInIframe(targetHTML, targetCSS),
    renderInIframe(userHTML, userCSS),
  ]);

  try {
    const targetEls = [...target.doc.body.querySelectorAll('*')] as Element[];
    const userEls   = [...user.doc.body.querySelectorAll('*')] as Element[];
    const count = Math.min(targetEls.length, userEls.length);
    if (count === 0) return 0;

    let hits = 0;
    let total = 0;

    for (let i = 0; i < count; i++) {
      const tStyles = target.doc.defaultView!.getComputedStyle(targetEls[i]);
      const uStyles = user.doc.defaultView!.getComputedStyle(userEls[i]);

      for (const prop of props) {
        const tv = tStyles.getPropertyValue(prop).trim();
        if (!tv || tv === 'none' && prop.startsWith('border')) continue; // skip unset
        total++;
        const uv = uStyles.getPropertyValue(prop).trim();
        if (valuesMatch(prop, tv, uv)) hits++;
      }
    }

    if (total === 0) return 0;
    return Math.round((hits / total) * 100);
  } finally {
    target.cleanup();
    user.cleanup();
  }
}
