import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@utils/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-surface-card border rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-400 resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-50 min-h-[80px]',
            error ? 'border-red-500' : 'border-surface-border',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
export default Textarea
