// Server → Client events
export const SOCKET_EVENTS = {
  // Notifications
  NOTIFICATION_NEW: 'notification:new',

  // Messages
  MESSAGE_NEW:         'message:new',
  MESSAGE_READ:        'message:read',
  CONVERSATION_UPDATE: 'conversation:update',

  // Presence
  USER_ONLINE:  'user:online',
  USER_OFFLINE: 'user:offline',
  TYPING_START: 'typing:start',
  TYPING_STOP:  'typing:stop',

  // Posts (live updates)
  POST_LIKED:    'post:liked',
  POST_COMMENTED:'post:commented',
} as const

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS]
