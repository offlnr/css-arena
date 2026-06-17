import puppeteer, { Browser } from 'puppeteer';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const W = 500;
const H = 500;

let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser?.connected) return _browser;
  _browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  _browser.on('disconnected', () => { _browser = null; });
  return _browser;
}

function buildDoc(html: string, css: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:${W}px;height:${H}px;background:#f0f2f5;display:flex;align-items:center;justify-content:center;padding:20px;font-family:sans-serif;overflow:hidden;}
${css}
</style></head><body>${html}</body></html>`;
}

export async function scoreSubmission(
  targetHTML: string,
  targetCSS: string,
  userHTML: string,
  userCSS: string,
): Promise<number> {
  const browser = await getBrowser();
  const [tPage, uPage] = await Promise.all([browser.newPage(), browser.newPage()]);

  await Promise.all([
    tPage.setViewport({ width: W, height: H }),
    uPage.setViewport({ width: W, height: H }),
  ]);

  try {
    await Promise.all([
      tPage.setContent(buildDoc(targetHTML, targetCSS), { waitUntil: 'load' }),
      uPage.setContent(buildDoc(userHTML, userCSS), { waitUntil: 'load' }),
    ]);

    const [tBuf, uBuf] = await Promise.all([
      tPage.screenshot({ type: 'png' }),
      uPage.screenshot({ type: 'png' }),
    ]) as [Buffer, Buffer];

    const tPng = PNG.sync.read(tBuf);
    const uPng = PNG.sync.read(uBuf);
    const diff = new PNG({ width: W, height: H });

    const diffPixels = pixelmatch(tPng.data, uPng.data, diff.data, W, H, {
      threshold: 0.1,
      includeAA: true,
    });

    return Math.max(0, Math.round((1 - diffPixels / (W * H)) * 100));
  } finally {
    await Promise.all([tPage.close(), uPage.close()]);
  }
}
