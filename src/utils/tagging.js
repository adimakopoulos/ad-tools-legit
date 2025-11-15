const STOP_WORDS = new Set([
  'the','a','an','and','or','but','of','in','on','to','for','with','at','by','from',
  'it','is','was','were','be','this','that','these','those','i','you','he','she',
  'they','we','my','your','our','their','as','about','into','up','down','over',
])

export function generateTags(text) {
  if (!text) return []
  const clean = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
  const counts = {}
  for (const word of clean.split(/\s+/)) {
    if (!word || STOP_WORDS.has(word) || word.length < 3) continue
    counts[word] = (counts[word] || 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w)
}
