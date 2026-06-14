import html2canvas from 'html2canvas';

const W = 400;
const H = 400;

function buildDoc(html: string, css: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#f0f2f5;display:flex;align-items:center;justify-content:center;width:${W}px;height:${H}px;overflow:hidden;font-family:sans-serif;}
${css}
</style></head><body>${html}</body></html>`;
}

function captureDoc(html: string, css: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `position:fixed;left:-${W + 20}px;top:0;width:${W}px;height:${H}px;border:none;visibility:hidden;`;
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    document.body.appendChild(iframe);

    iframe.onload = async () => {
      try {
        const doc = iframe.contentDocument!;
        const canvas = await html2canvas(doc.body, {
          width: W,
          height: H,
          useCORS: false,
          logging: false,
          backgroundColor: '#f0f2f5',
        });
        const ctx = canvas.getContext('2d')!;
        resolve(ctx.getImageData(0, 0, W, H));
      } catch (e) {
        reject(e);
      } finally {
        document.body.removeChild(iframe);
      }
    };
    iframe.onerror = reject;
    iframe.srcdoc = buildDoc(html, css);
  });
}

function comparePixels(a: ImageData, b: ImageData): number {
  const len = a.data.length;
  let matches = 0;
  const tolerance = 15;
  for (let i = 0; i < len; i += 4) {
    const dr = Math.abs(a.data[i]     - b.data[i]);
    const dg = Math.abs(a.data[i + 1] - b.data[i + 1]);
    const db = Math.abs(a.data[i + 2] - b.data[i + 2]);
    if (dr <= tolerance && dg <= tolerance && db <= tolerance) matches++;
  }
  return Math.round((matches / (len / 4)) * 100);
}

export async function calcVisualScore(
  targetHTML: string,
  targetCSS: string,
  userHTML: string,
  userCSS: string,
): Promise<number> {
  const [targetImg, userImg] = await Promise.all([
    captureDoc(targetHTML, targetCSS),
    captureDoc(userHTML, userCSS),
  ]);
  return comparePixels(targetImg, userImg);
}
