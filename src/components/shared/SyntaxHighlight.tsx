import React from 'react'

type TokenKind = 'comment' | 'string' | 'keyword' | 'number' | 'tag' | 'attr' | 'plain'
type Token = [TokenKind, string]

const STYLES: Record<TokenKind, React.CSSProperties> = {
  comment: { color: '#5c6370', fontStyle: 'italic' },
  string:  { color: '#98c379' },
  keyword: { color: '#c678dd' },
  number:  { color: '#d19a66' },
  tag:     { color: '#e06c75' },
  attr:    { color: '#61afef' },
  plain:   { color: '#abb2bf' },
}

const JS_KW =
  'await|async|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|' +
  'extends|finally|for|from|function|if|import|in|instanceof|let|new|null|of|return|static|' +
  'super|switch|this|throw|true|false|try|typeof|undefined|var|void|while|with|yield'

const CSS_KW =
  'none|block|flex|grid|inline-flex|inline-block|inline|absolute|relative|fixed|sticky|auto|' +
  'inherit|initial|unset|transparent|normal|bold|italic|underline|center|left|right|top|bottom|' +
  'solid|dashed|dotted|double|hidden|visible|pointer|default|nowrap|wrap|column|row|' +
  'space-between|space-around|space-evenly|stretch|start|end|border-box|content-box|' +
  'cover|contain|no-repeat|repeat|uppercase|lowercase|capitalize|sans-serif|serif|monospace'

function push(tokens: Token[], kind: TokenKind, text: string) {
  tokens.push([kind, text])
}

function tokenizeJS(code: string): Token[] {
  const tokens: Token[] = []
  const re = new RegExp(
    '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)' +
    '|("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'|`(?:[^`\\\\]|\\\\.)*`)' +
    `|\\b(${JS_KW})\\b` +
    '|(\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b)',
    'g',
  )
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) push(tokens, 'plain', code.slice(last, m.index))
    if      (m[1]) push(tokens, 'comment', m[0])
    else if (m[2]) push(tokens, 'string',  m[0])
    else if (m[3]) push(tokens, 'keyword', m[0])
    else if (m[4]) push(tokens, 'number',  m[0])
    else           push(tokens, 'plain',   m[0])
    last = re.lastIndex
  }
  if (last < code.length) push(tokens, 'plain', code.slice(last))
  return tokens
}

function tokenizeCSS(code: string): Token[] {
  const tokens: Token[] = []
  const re = new RegExp(
    '(\\/\\*[\\s\\S]*?\\*\\/)' +
    '|("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')' +
    '|(#[0-9a-fA-F]{3,8})' +
    '|(-?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:px|em|rem|%|vh|vw|vmin|vmax|pt|s|ms|deg|ch|fr|ex)?)' +
    `|\\b(${CSS_KW})\\b`,
    'g',
  )
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) push(tokens, 'plain', code.slice(last, m.index))
    if      (m[1]) push(tokens, 'comment', m[0])
    else if (m[2]) push(tokens, 'string',  m[0])
    else if (m[3]) push(tokens, 'number',  m[0])
    else if (m[4]) push(tokens, 'number',  m[0])
    else if (m[5]) push(tokens, 'keyword', m[0])
    else           push(tokens, 'plain',   m[0])
    last = re.lastIndex
  }
  if (last < code.length) push(tokens, 'plain', code.slice(last))
  return tokens
}

function tokenizeHTML(code: string): Token[] {
  const tokens: Token[] = []
  const re = /(<!--[\s\S]*?-->)|(<\/?)([a-zA-Z][\w-]*)|(\/?>)|([a-zA-Z][\w:-]*)(?=\s*=)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) push(tokens, 'plain', code.slice(last, m.index))
    if      (m[1])                push(tokens, 'comment', m[0])
    else if (m[2] !== undefined)  push(tokens, 'tag',     m[2] + m[3])
    else if (m[4])                push(tokens, 'tag',     m[0])
    else if (m[5])                push(tokens, 'attr',    m[0])
    else if (m[6])                push(tokens, 'string',  m[0])
    else                          push(tokens, 'plain',   m[0])
    last = re.lastIndex
  }
  if (last < code.length) push(tokens, 'plain', code.slice(last))
  return tokens
}

function tokenize(code: string, lang: string): Token[] {
  if (lang === 'css')  return tokenizeCSS(code)
  if (lang === 'html') return tokenizeHTML(code)
  return tokenizeJS(code)
}

interface Props {
  code: string
  lang: string
}

export default function SyntaxHighlight({ code, lang }: Props) {
  const tokens = tokenize(code, lang)
  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} style={STYLES[t[0]]}>
          {t[1]}
        </span>
      ))}
    </>
  )
}
