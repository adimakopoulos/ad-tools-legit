// Browser-side encryption helpers using Web Crypto API

async function getKeyFromPassword(password, saltBase64) {
  const enc = new TextEncoder()
  const salt = saltBase64 ? Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16))

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  )

  const saltB64 = btoa(String.fromCharCode(...salt))
  return { key, saltB64 }
}

async function hashKey(key) {
  const raw = await crypto.subtle.exportKey('raw', key)
  const hash = await crypto.subtle.digest('SHA-256', raw)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
}

export async function createMasterSecret(password) {
  const { key, saltB64 } = await getKeyFromPassword(password)
  const hash = await hashKey(key)
  return { key, saltB64, hash }
}

export async function deriveMasterKey(password, saltB64) {
  const { key } = await getKeyFromPassword(password, saltB64)
  const hash = await hashKey(key)
  return { key, hash }
}

export async function encryptJson(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const data = enc.encode(JSON.stringify(obj))

  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data,
  )

  const ivB64 = btoa(String.fromCharCode(...iv))
  const cipherB64 = btoa(String.fromCharCode(...new Uint8Array(cipher)))
  return { iv: ivB64, cipher: cipherB64 }
}

export async function decryptJson(key, ivB64, cipherB64) {
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0))
  const cipher = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0))

  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipher,
  )

  const dec = new TextDecoder()
  return JSON.parse(dec.decode(plain))
}
