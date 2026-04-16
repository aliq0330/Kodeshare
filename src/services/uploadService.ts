import { supabase } from '@/lib/supabase'

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

export const uploadService = {
  async uploadAvatar(file: File): Promise<string> {
    if (file.size > MAX_SIZE) throw new Error('Dosya 2 MB\'dan büyük olamaz')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Giriş yapmalısın')
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) throw new Error(error.message)
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    return publicUrl
  },

  async uploadCover(file: File): Promise<string> {
    if (file.size > MAX_SIZE) throw new Error('Dosya 2 MB\'dan büyük olamaz')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Giriş yapmalısın')
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/cover.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) throw new Error(error.message)
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    return publicUrl
  },
}
