import { useState } from 'react'
import { cn } from '@utils/cn'
import { useArticleStore } from '@store/articleStore'
import type { ArticleBlock } from '@store/articleStore'
import TextBlock from './TextBlock'

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   emoji: '💡' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', emoji: '⚠️' },
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/30',  emoji: '✅' },
  red:    { bg: 'bg-red-500/10',    border: 'border-red-500/30',    emoji: '🚨' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', emoji: '🔮' },
}

const EMOJIS = ['💡', '⚠️', '✅', '🚨', '🔮', '📌', '🎯', '💬', '🔥', '📝']

interface Props {
  block: ArticleBlock
}

export default function CalloutBlock({ block }: Props) {
  const { updateBlock } = useArticleStore()
  const [emojiOpen, setEmojiOpen] = useState(false)
  const color = (block.calloutColor ?? 'blue') as keyof typeof COLOR_MAP
  const styles = COLOR_MAP[color]

  return (
    <div
      className={cn(
        'my-2 flex gap-3 p-4 rounded-xl border',
        styles.bg,
        styles.border,
      )}
    >
      {/* Emoji picker */}
      <div className="relative shrink-0">
        <button
          onClick={() => setEmojiOpen((v) => !v)}
          className="text-2xl leading-none hover:scale-110 transition-transform select-none"
        >
          {block.emoji ?? styles.emoji}
        </button>
        {emojiOpen && (
          <div className="absolute left-0 top-full mt-1 z-50 flex flex-wrap gap-1 p-2 bg-surface-card border border-surface-border rounded-xl shadow-xl w-44">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => { updateBlock(block.id, { emoji: e }); setEmojiOpen(false) }}
                className="text-xl p-1 rounded hover:bg-surface-raised transition-colors"
              >
                {e}
              </button>
            ))}
            {/* Color selector */}
            <div className="w-full border-t border-surface-border mt-1 pt-1 flex gap-1.5">
              {(Object.keys(COLOR_MAP) as (keyof typeof COLOR_MAP)[]).map((c) => (
                <button
                  key={c}
                  onClick={() => { updateBlock(block.id, { calloutColor: c }); setEmojiOpen(false) }}
                  className={cn(
                    'w-5 h-5 rounded-full border-2 transition-transform hover:scale-110',
                    c === 'blue' && 'bg-blue-500',
                    c === 'yellow' && 'bg-yellow-500',
                    c === 'green' && 'bg-green-500',
                    c === 'red' && 'bg-red-500',
                    c === 'purple' && 'bg-purple-500',
                    color === c ? 'border-white' : 'border-transparent',
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <TextBlock block={block} />
      </div>
    </div>
  )
}
