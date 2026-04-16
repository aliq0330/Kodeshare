import { useEffect } from 'react'
import { connectSocket, disconnectSocket, getSocket } from './socket'
import { SOCKET_EVENTS } from './events'
import { useAuthStore } from '@store/authStore'
import { useNotificationStore } from '@store/notificationStore'
import { useMessageStore } from '@store/messageStore'

export function useSocket() {
  const { token, isAuthenticated } = useAuthStore()
  const pushNotification = useNotificationStore((s) => s.pushNotification)
  const pushMessage = useMessageStore((s) => s.pushMessage)

  useEffect(() => {
    if (!isAuthenticated || !token) return

    connectSocket(token)
    const socket = getSocket()

    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, pushNotification)
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, pushMessage)

    return () => {
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, pushNotification)
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, pushMessage)
      disconnectSocket()
    }
  }, [isAuthenticated, token, pushNotification, pushMessage])
}
