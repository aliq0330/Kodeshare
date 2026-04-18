import { supabase } from '@/lib/supabase'

const TARGET_SIZE = 350
const MAX_BYTES   = 200 * 1024 // 200 KB

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), type, quality),
  )
}

async function resizeAndCompress(file: File): Promise<{ blob: Blob; ext: string }> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width  = TARGET_SIZE
  canvas.height = TARGET_SIZE
  const ctx = canvas.getContext('2d')!
  const side = Math.min(bitmap.width, bitmap.height)
  const sx   = (bitmap.width  - side) / 2
  const sy   = (bitmap.height - side) / 2
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE)
  bitmap.close()

  // Try WebP 0.85 → WebP 0.7 → JPEG 0.7
  for (const [type, quality, ext] of [
    ['image/webp', 0.85, 'webp'],
    ['image/webp', 0.7,  'webp'],
    ['image/jpeg', 0.7,  'jpg' ],
  ] as const) {
    const blob = await toBlob(canvas, type, quality)
    if (blob.size <= MAX_BYTES || ext === 'jpg') return { blob, ext }
  }
  // unreachable but satisfies TS
  const blob = await toBlob(canvas, 'image/jpeg', 0.7)
  return { blob, ext: 'jpg' }
}

export const uploadService = {
  async uploadAvatar(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Giriş yapmalısın')
    const { blob, ext } = await resizeAndCompress(file)
    const path = `${user.id}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, blob, {
      upsert: true,
      contentType: blob.type,
    })
    if (error) throw new Error(error.message)
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    return publicUrl
  },

  async uploadCover(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Giriş yapmalısın')
    const { blob, ext } = await resizeAndCompress(file)
    const path = `${user.id}/cover.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, blob, {
      upsert: true,
      contentType: blob.type,
    })
    if (error) throw new Error(error.message)
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    return publicUrl
  },
}
