import { useArticleStore } from '@store/articleStore'
import type { ArticleBlock } from '@store/articleStore'
import TextBlock from './TextBlock'

interface Props {
  block: ArticleBlock
}

export default function QuoteBlock({ block }: Props) {
  const { updateBlock } = useArticleStore()

  return (
    <figure className="my-2 pl-5 border-l-4 border-brand-500">
      <blockquote className="not-italic">
        <TextBlock block={block} />
      </blockquote>
      <figcaption className="mt-2">
        <input
          type="text"
          value={block.caption ?? ''}
          onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
          placeholder="— Kaynak (isteğe bağlı)"
          className="text-sm text-gray-500 bg-transparent border-none outline-none placeholder:text-gray-700 italic w-full"
        />
      </figcaption>
    </figure>
  )
}
