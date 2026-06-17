// Visual properties checked on every element, regardless of what the target CSS uses.
// Covers layout, color, typography, spacing, borders, and effects.
const VISUAL_PROPS = [
  'display', 'position',
  'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'top', 'right', 'bottom', 'left',
  'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-self',
  'flex-grow', 'flex-shrink', 'flex-basis',
  'grid-template-columns', 'grid-template-rows', 'gap',
  'color', 'background-color',
  'font-size', 'font-weight', 'font-style', 'text-align', 'line-height', 'letter-spacing',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
  'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-left-radius', 'border-bottom-right-radius',
  'box-shadow', 'opacity', 'transform', 'overflow',
  'object-fit', 'z-index', 'cursor',
];

function parseRgb(v: string): [number, number, number] | null {
  const m = v.match(/rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
  return m ? [+m[1], +m[2], +m[3]] : null;
}

function parseNum(v: string): number | null {
  const m = v.match(/^-?([\d.]+)/);
  return m ? parseFloat(m[0]) : null;
}

function propScore(prop: string, a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;

  // Color: tolerance ±20 per channel
  if (prop.includes('color')) {
    const ca = parseRgb(a), cb = parseRgb(b);
    if (ca && cb) {
      const d = Math.max(
        Math.abs(ca[0] - cb[0]),
        Math.abs(ca[1] - cb[1]),
        Math.abs(ca[2] - cb[2]),
      );
      return d <= 20 ? 1 : Math.max(0, 1 - d / 255);
    }
  }

  // Numeric: full credit within tolerance, partial credit beyond
  const na = parseNum(a), nb = parseNum(b);
  if (na !== null && nb !== null) {
    const unit = a.replace(/^-?[\d.]+/, '');
    const tol  = unit.includes('em') || unit.includes('rem') ? 0.15 : 4;
    const diff = Math.abs(na - nb);
    if (diff <= tol) return 1;
    const max = Math.max(Math.abs(na), Math.abs(nb), 1);
    return Math.max(0, 1 - diff / max);
  }

  return 0;
}

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
    iframe.onload  = () => resolve({ doc: iframe.contentDocument!, cleanup });
    iframe.onerror = () => { cleanup(); reject(new Error('iframe load failed')); };
    iframe.srcdoc  = buildDoc(html, css);
  });
}

export async function calcVisualScore(
  targetHTML: string,
  targetCSS:  string,
  userHTML:   string,
  userCSS:    string,
): Promise<number> {
  const [target, user] = await Promise.all([
    renderInIframe(targetHTML, targetCSS),
    renderInIframe(userHTML,   userCSS),
  ]);

  try {
    const tEls = [...target.doc.body.querySelectorAll('*')] as Element[];
    const uEls = [...user.doc.body.querySelectorAll('*')] as Element[];
    const count = Math.min(tEls.length, uEls.length);
    if (count === 0) return 0;

    let total = 0;
    let score = 0;

    for (let i = 0; i < count; i++) {
      const tStyle = target.doc.defaultView!.getComputedStyle(tEls[i]);
      const uStyle = user.doc.defaultView!.getComputedStyle(uEls[i]);

      for (const prop of VISUAL_PROPS) {
        const tv = tStyle.getPropertyValue(prop).trim();
        if (!tv) continue;
        total++;
        score += propScore(prop, tv, uStyle.getPropertyValue(prop).trim());
      }
    }

    if (total === 0) return 0;
    return Math.round((score / total) * 100);
  } finally {
    target.cleanup();
    user.cleanup();
  }
}
