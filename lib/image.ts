// Browser-only: shrinks screenshots before upload so the free storage lasts longer.
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  if (file.type === 'image/gif') return file // keep animation
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
  return blob && blob.size < file.size ? blob : file
}
