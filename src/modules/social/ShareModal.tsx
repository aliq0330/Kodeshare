import { useState } from 'react'
import { Copy, Twitter, Link2, GitFork, Check } from 'lucide-react'
import Modal from '@components/ui/Modal'
import Button from '@components/ui/Button'
import toast from 'react-hot-toast'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  postId: string
  postTitle: string
}

export default function ShareModal({ open, onClose, postId, postTitle }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/post/${postId}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Bağlantı kopyalandı!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal open={open} onClose={onClose} title="Paylaş" size="sm">
      <div className="flex flex-col gap-3">
        {/* Copy link */}
        <div className="flex items-center gap-2 bg-surface-raised border border-surface-border rounded-lg px-3 py-2">
          <span className="flex-1 text-sm text-gray-400 truncate">{url}</span>
          <button
            onClick={copyLink}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="secondary" size="sm" fullWidth>
            <Twitter className="w-4 h-4 text-sky-400" />
            Twitter
          </Button>
          <Button variant="secondary" size="sm" fullWidth>
            <GitFork className="w-4 h-4 text-green-400" />
            Yeniden Paylaş
          </Button>
          <Button variant="secondary" size="sm" fullWidth onClick={copyLink} className="col-span-2">
            <Link2 className="w-4 h-4" />
            Bağlantıyı Kopyala
          </Button>
        </div>
      </div>
    </Modal>
  )
}
