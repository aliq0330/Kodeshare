import Modal from '@components/ui/Modal'
import FollowersTab from './FollowersTab'

interface FollowersModalProps {
  open: boolean
  onClose: () => void
  username: string
  type: 'followers' | 'following'
}

export default function FollowersModal({ open, onClose, username, type }: FollowersModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={type === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}
      size="sm"
    >
      <FollowersTab username={username} type={type} />
    </Modal>
  )
}
