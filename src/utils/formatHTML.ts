function attrs(el: Element): string {
  return [...el.attributes].map((a) => ` ${a.name}="${a.value}"`).join('');
}

const VOID_TAGS = new Set([
  'br', 'hr', 'img', 'input', 'meta', 'link',
  'area', 'base', 'col', 'source', 'track', 'wbr',
]);

function formatNode(node: Node, depth: number): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? '').trim();
    return text ? '  '.repeat(depth) + text : '';
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el  = node as Element;
  const tag = el.tagName.toLowerCase();
  const pad = '  '.repeat(depth);

  if (VOID_TAGS.has(tag)) return `${pad}<${tag}${attrs(el)}>`;

  const children = [...el.childNodes]
    .map((n) => formatNode(n, depth + 1))
    .filter(Boolean);

  if (children.length === 0) return `${pad}<${tag}${attrs(el)}></${tag}>`;

  const allText = [...el.childNodes].every((n) => n.nodeType === Node.TEXT_NODE);
  if (allText) return `${pad}<${tag}${attrs(el)}>${el.textContent?.trim()}</${tag}>`;

  return `${pad}<${tag}${attrs(el)}>\n${children.join('\n')}\n${pad}</${tag}>`;
}

export function formatHTML(raw: string): string {
  const doc = new DOMParser().parseFromString(raw, 'text/html');
  return [...doc.body.childNodes]
    .map((n) => formatNode(n, 0))
    .filter(Boolean)
    .join('\n');
}
