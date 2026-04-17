export type * from './user'
export type * from './post'
export type * from './comment'
export type * from './collection'
export type * from './message'
export type * from './notification'
export type * from './editor'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNextPage: boolean
}

export interface ApiError {
  message: string
  code: string
  statusCode: number
}
