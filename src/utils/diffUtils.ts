export type DiffPart = { type: 'same' | 'add' | 'del'; text: string }

export function diffText(oldText: string, newText: string): DiffPart[] {
  if (oldText === newText) return [{ type: 'same', text: oldText }]

  const oldTokens = tokenize(oldText)
  const newTokens = tokenize(newText)

  if (oldTokens.length === 0) return newTokens.map((t) => ({ type: 'add' as const, text: t }))
  if (newTokens.length === 0) return oldTokens.map((t) => ({ type: 'del' as const, text: t }))

  const m = oldTokens.length
  const n = newTokens.length

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0) as number[])
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldTokens[i - 1] === newTokens[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  const result: DiffPart[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldTokens[i - 1] === newTokens[j - 1]) {
      result.unshift({ type: 'same', text: oldTokens[i - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'add', text: newTokens[j - 1] })
      j--
    } else {
      result.unshift({ type: 'del', text: oldTokens[i - 1] })
      i--
    }
  }
  return result
}

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((s) => s.length > 0)
}

export type LineDiff = { type: 'same' | 'add' | 'del'; content: string; lineNo?: number }

export function diffLines(oldCode: string, newCode: string): LineDiff[] {
  const oldLines = oldCode.split('\n')
  const newLines = newCode.split('\n')

  if (oldCode === newCode) return oldLines.map((l, i) => ({ type: 'same', content: l, lineNo: i + 1 }))

  const m = oldLines.length
  const n = newLines.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0) as number[])

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  const result: LineDiff[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'same', content: oldLines[i - 1], lineNo: j })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'add', content: newLines[j - 1], lineNo: j })
      j--
    } else {
      result.unshift({ type: 'del', content: oldLines[i - 1] })
      i--
    }
  }
  return result
}

export type BlockDiffEntry =
  | { status: 'same';    block: { type: string; content?: string; code?: string; src?: string } }
  | { status: 'added';   block: { type: string; content?: string; code?: string; src?: string } }
  | { status: 'removed'; block: { type: string; content?: string; code?: string; src?: string } }
  | { status: 'changed'; oldBlock: { type: string; content?: string; code?: string; src?: string }; newBlock: { type: string; content?: string; code?: string; src?: string } }

export function diffBlocks(
  oldBlocks: Array<{ id: string; type: string; content?: string; code?: string; src?: string }>,
  newBlocks: Array<{ id: string; type: string; content?: string; code?: string; src?: string }>,
): BlockDiffEntry[] {
  const result: BlockDiffEntry[] = []

  const oldById = new Map(oldBlocks.map((b) => [b.id, b]))
  const newById = new Map(newBlocks.map((b) => [b.id, b]))
  const processedNewIds = new Set<string>()

  for (const oldBlock of oldBlocks) {
    const newBlock = newById.get(oldBlock.id)
    if (!newBlock) {
      result.push({ status: 'removed', block: oldBlock })
    } else {
      processedNewIds.add(oldBlock.id)
      const oldText = blockText(oldBlock)
      const newText = blockText(newBlock)
      if (oldBlock.type !== newBlock.type || oldText !== newText) {
        result.push({ status: 'changed', oldBlock, newBlock })
      } else {
        result.push({ status: 'same', block: newBlock })
      }
    }
  }

  for (const newBlock of newBlocks) {
    if (!processedNewIds.has(newBlock.id) && !oldById.has(newBlock.id)) {
      result.push({ status: 'added', block: newBlock })
    }
  }

  return result
}

function blockText(b: { content?: string; code?: string; src?: string }): string {
  return b.content ?? b.code ?? b.src ?? ''
}
