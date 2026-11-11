/** Add the website reference to a saved board without changing its original artwork. */
export async function codedDesignImage(source, code) {
  if (!/^TD-\d{4}$/.test(code)) throw new Error('Invalid design reference')
  const image = new Image()
  image.src = source
  await image.decode()
  const canvas = document.createElement('canvas')
  const width = Math.max(720, image.naturalWidth)
  const height = Math.round(image.naturalHeight * width / image.naturalWidth)
  const strip = Math.round(width * 0.095)
  canvas.width = width
  canvas.height = height + strip
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, canvas.height)
  ctx.drawImage(image, 0, 0, width, height)
  ctx.fillStyle = '#171717'
  ctx.fillRect(0, height, width, strip)
  ctx.fillStyle = '#fff'
  ctx.font = `700 ${Math.round(width * 0.035)}px sans-serif`
  ctx.textBaseline = 'middle'
  ctx.fillText(`TEAMDEE  |  ${code}`, width * 0.035, height + strip / 2)
  return canvas.toDataURL('image/png')
}
