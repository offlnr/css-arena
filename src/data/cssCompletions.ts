import type { Monaco } from '@monaco-editor/react'

// Prevent re-registering the provider on every editor remount (key={activeTab} causes remounts)
let _registered = false

function getTextBeforePosition(
  model: import('monaco-editor').editor.ITextModel,
  position: import('monaco-editor').Position,
): string {
  return model.getValueInRange({
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  })
}

// Returns true only when the cursor is inside a CSS rule block { ... }
function isInsideCssBlock(textBefore: string): boolean {
  let depth = 0
  for (const ch of textBefore) {
    if (ch === '{') depth++
    else if (ch === '}') depth--
  }
  return depth > 0
}

const CSS_PROPS: { prop: string; values?: string[] }[] = [
  { prop: 'display',          values: ['flex','grid','block','inline','inline-block','inline-flex','none','contents'] },
  { prop: 'position',         values: ['relative','absolute','fixed','sticky','static'] },
  { prop: 'flex-direction',   values: ['row','column','row-reverse','column-reverse'] },
  { prop: 'flex-wrap',        values: ['nowrap','wrap','wrap-reverse'] },
  { prop: 'justify-content',  values: ['flex-start','flex-end','center','space-between','space-around','space-evenly'] },
  { prop: 'justify-items',    values: ['start','end','center','stretch'] },
  { prop: 'align-items',      values: ['flex-start','flex-end','center','stretch','baseline'] },
  { prop: 'align-self',       values: ['auto','flex-start','flex-end','center','stretch','baseline'] },
  { prop: 'align-content',    values: ['flex-start','flex-end','center','space-between','space-around','stretch'] },
  { prop: 'gap',              values: ['0','4px','8px','12px','16px','24px','32px'] },
  { prop: 'flex',             values: ['1','auto','none','0 1 auto'] },
  { prop: 'flex-grow',        values: ['0','1','2'] },
  { prop: 'flex-shrink',      values: ['0','1'] },
  { prop: 'flex-basis',       values: ['auto','0','100%','50%'] },
  { prop: 'grid-template-columns', values: ['repeat(2, 1fr)','repeat(3, 1fr)','1fr 1fr','auto 1fr'] },
  { prop: 'grid-template-rows',    values: ['auto','1fr','repeat(2, auto)'] },
  { prop: 'grid-column',      values: ['span 2','1 / 3','auto'] },
  { prop: 'grid-row',         values: ['span 2','1 / 3','auto'] },
  { prop: 'width',            values: ['100%','100vw','auto','50%','fit-content','max-content','min-content'] },
  { prop: 'height',           values: ['100%','100vh','auto','50%','fit-content'] },
  { prop: 'min-width',        values: ['0','100%','200px','auto','fit-content'] },
  { prop: 'max-width',        values: ['100%','400px','600px','800px','1200px','none'] },
  { prop: 'min-height',       values: ['0','100%','100vh','auto'] },
  { prop: 'max-height',       values: ['none','100%','100vh','400px'] },
  { prop: 'margin',           values: ['0','auto','0 auto','8px','16px','24px','32px'] },
  { prop: 'margin-top',       values: ['0','auto','8px','16px','24px','32px'] },
  { prop: 'margin-right',     values: ['0','auto','8px','16px','24px','32px'] },
  { prop: 'margin-bottom',    values: ['0','auto','8px','16px','24px','32px'] },
  { prop: 'margin-left',      values: ['0','auto','8px','16px','24px','32px'] },
  { prop: 'padding',          values: ['0','8px','12px','16px','24px','32px'] },
  { prop: 'padding-top',      values: ['0','8px','12px','16px','24px'] },
  { prop: 'padding-right',    values: ['0','8px','12px','16px','24px'] },
  { prop: 'padding-bottom',   values: ['0','8px','12px','16px','24px'] },
  { prop: 'padding-left',     values: ['0','8px','12px','16px','24px'] },
  { prop: 'color',            values: ['#000','#fff','#333','#666','inherit','currentColor','transparent'] },
  { prop: 'background',       values: ['none','transparent','#fff','#000','linear-gradient(135deg, #667eea, #764ba2)'] },
  { prop: 'background-color', values: ['transparent','#fff','#000','#f5f5f5','rgba(0,0,0,0.1)'] },
  { prop: 'background-image', values: ['none','linear-gradient(to right, #f00, #00f)','url()'] },
  { prop: 'background-size',  values: ['cover','contain','auto','100%','50%'] },
  { prop: 'background-position', values: ['center','top','bottom','left','right','50% 50%'] },
  { prop: 'background-repeat', values: ['no-repeat','repeat','repeat-x','repeat-y'] },
  { prop: 'border',           values: ['none','1px solid #ccc','1px solid #000','2px solid','2px dashed'] },
  { prop: 'border-top',       values: ['none','1px solid #ccc'] },
  { prop: 'border-right',     values: ['none','1px solid #ccc'] },
  { prop: 'border-bottom',    values: ['none','1px solid #ccc'] },
  { prop: 'border-left',      values: ['none','1px solid #ccc','4px solid #6366f1'] },
  { prop: 'border-width',     values: ['1px','2px','0','thin','medium'] },
  { prop: 'border-style',     values: ['solid','dashed','dotted','none','double'] },
  { prop: 'border-color',     values: ['transparent','#ccc','#000','currentColor'] },
  { prop: 'border-radius',    values: ['0','4px','6px','8px','12px','16px','24px','50%','9999px'] },
  { prop: 'border-top-left-radius',     values: ['0','4px','8px','50%'] },
  { prop: 'border-top-right-radius',    values: ['0','4px','8px','50%'] },
  { prop: 'border-bottom-left-radius',  values: ['0','4px','8px','50%'] },
  { prop: 'border-bottom-right-radius', values: ['0','4px','8px','50%'] },
  { prop: 'outline',          values: ['none','1px solid #ccc','2px solid #6366f1'] },
  { prop: 'box-shadow',       values: ['none','0 2px 8px rgba(0,0,0,0.1)','0 4px 16px rgba(0,0,0,0.15)','inset 0 2px 4px rgba(0,0,0,0.1)'] },
  { prop: 'font-size',        values: ['12px','14px','16px','18px','20px','24px','32px','1rem','1.25rem','1.5rem','2rem'] },
  { prop: 'font-family',      values: ['sans-serif','serif','monospace','inherit','system-ui'] },
  { prop: 'font-weight',      values: ['400','500','600','700','800','bold','normal','inherit'] },
  { prop: 'font-style',       values: ['normal','italic','oblique'] },
  { prop: 'line-height',      values: ['1','1.2','1.4','1.5','1.6','2','normal'] },
  { prop: 'letter-spacing',   values: ['0','0.025em','0.05em','0.1em','-0.025em'] },
  { prop: 'text-align',       values: ['left','right','center','justify'] },
  { prop: 'text-decoration',  values: ['none','underline','line-through','overline'] },
  { prop: 'text-transform',   values: ['none','uppercase','lowercase','capitalize'] },
  { prop: 'white-space',      values: ['normal','nowrap','pre','pre-wrap','pre-line'] },
  { prop: 'word-break',       values: ['normal','break-all','keep-all','break-word'] },
  { prop: 'overflow',         values: ['visible','hidden','scroll','auto'] },
  { prop: 'overflow-x',       values: ['visible','hidden','scroll','auto'] },
  { prop: 'overflow-y',       values: ['visible','hidden','scroll','auto'] },
  { prop: 'opacity',          values: ['0','0.5','0.7','0.8','1'] },
  { prop: 'visibility',       values: ['visible','hidden','collapse'] },
  { prop: 'cursor',           values: ['default','pointer','text','move','not-allowed','grab','crosshair'] },
  { prop: 'pointer-events',   values: ['auto','none'] },
  { prop: 'top',              values: ['0','auto','50%','100%'] },
  { prop: 'right',            values: ['0','auto','50%','100%'] },
  { prop: 'bottom',           values: ['0','auto','50%','100%'] },
  { prop: 'left',             values: ['0','auto','50%','100%'] },
  { prop: 'z-index',          values: ['0','1','10','100','999','-1','auto'] },
  { prop: 'float',            values: ['none','left','right'] },
  { prop: 'clear',            values: ['none','left','right','both'] },
  { prop: 'transform',        values: ['none','rotate(45deg)','scale(1.1)','translateX(0)','translateY(-50%)','translate(-50%, -50%)'] },
  { prop: 'transition',       values: ['none','all 200ms ease','all 300ms ease','opacity 200ms','transform 200ms'] },
  { prop: 'animation',        values: ['none'] },
  { prop: 'list-style',       values: ['none','disc','circle','square','decimal'] },
  { prop: 'content',          values: ['""','none','attr(data-content)'] },
  { prop: 'box-sizing',       values: ['border-box','content-box'] },
  { prop: 'object-fit',       values: ['fill','contain','cover','none','scale-down'] },
  { prop: 'resize',           values: ['none','both','horizontal','vertical'] },
  { prop: 'aspect-ratio',     values: ['auto','1','16/9','4/3'] },
  { prop: 'text-overflow',    values: ['clip','ellipsis'] },
  { prop: 'vertical-align',   values: ['baseline','top','middle','bottom','text-top','text-bottom'] },
  { prop: 'table-layout',     values: ['auto','fixed'] },
  { prop: 'border-collapse',  values: ['collapse','separate'] },
  { prop: 'user-select',      values: ['none','auto','text','all'] },
]

export function registerCssCompletions(monaco: Monaco) {
  if (_registered) return
  _registered = true

  monaco.languages.registerCompletionItemProvider('css', {
    triggerCharacters: ['-', ':'],
    provideCompletionItems(model: import('monaco-editor').editor.ITextModel, position: import('monaco-editor').Position) {
      const lineText = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      })

      const textBefore = getTextBeforePosition(model, position)
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      // After ":" → suggest values for that property
      const afterColon = /:\s*[\w-]*$/.test(lineText)
      if (afterColon) {
        const propMatch = lineText.match(/([\w-]+)\s*:\s*[\w-]*$/)
        if (propMatch) {
          const prop = CSS_PROPS.find(p => p.prop === propMatch[1])
          if (prop?.values) {
            return {
              suggestions: prop.values.map(v => ({
                label: v,
                kind: monaco.languages.CompletionItemKind.Value,
                insertText: v,
                range,
              })),
            }
          }
        }
        return { suggestions: [] }
      }

      // Only suggest property names when cursor is inside a rule block { ... }
      // This prevents showing CSS properties when writing selectors (div, .class, etc.)
      if (!isInsideCssBlock(textBefore)) {
        return { suggestions: [] }
      }

      return {
        suggestions: CSS_PROPS.map(({ prop }) => ({
          label: prop,
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: prop + ': ',
          range,
          detail: 'CSS',
          sortText: prop,
        })),
      }
    },
  })
}
