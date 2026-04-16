export const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const isValidUsername = (username: string) =>
  /^[a-zA-Z0-9_]{3,30}$/.test(username)

export const isValidPassword = (password: string) =>
  password.length >= 8

export const isValidUrl = (url: string) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
