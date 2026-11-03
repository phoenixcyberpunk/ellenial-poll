/*! ellenial-room.js · shared Ellenial pattern · AGPL-3.0 · no tracking
 *
 * The encrypted live room used by Ellenial apps (first in quiz, now shared). One device hosts
 * and holds everything in memory; other devices join with a link. Messages pass through
 * Supabase Realtime *broadcast*: no table, nothing stored. Every message is encrypted on the
 * device (AES-GCM, key derived with HKDF from a random 32-byte secret). The secret only lives in
 * the join link after '#', which browsers never send to a server.
 *
 * HOW TO USE IN ANOTHER ELLENIAL APP
 * 1. Copy this file and vendor/supabase.min.js into the app, unchanged. Load supabase first.
 * 2. var room = EllenialRoom.create({
 *        app: 'poll',          // channel prefix: '<app>:<roomId>'
 *        tag: 'ep1',           // per-app crypto label (HKDF salt/info, AAD); never reuse another app's
 *        supabaseUrl: '…', supabaseKey: 'sb_publishable_…',
 *        local: false          // true = BroadcastChannel between tabs, for local testing
 *    })
 * 3. var conn = room.connect(roomId, secret, onMessage(obj), onStatus(isConnected))
 *    conn.send(obj) -> Promise; conn.close()
 * 4. New room: EllenialRoom.newRoom() -> { roomId, secret }. Link: origin + '/join#' + roomId + '.' + secret.
 *    Reading a link: EllenialRoom.readRef(text) -> { roomId, secret } or null.
 * Validate every incoming message in the app: anyone with the link can send.
 */
;(function () {
  'use strict'
  var enc = new TextEncoder(), dec = new TextDecoder()

  function toB64u(bytes) {
    var bin = ''
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  function fromB64u(s) {
    if (typeof s !== 'string' || !/^[A-Za-z0-9_-]*$/.test(s)) return null
    try {
      var bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))
      var out = new Uint8Array(bin.length)
      for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
      return out
    } catch (e) { return null }
  }
  function randomB64u(n) { return toB64u(crypto.getRandomValues(new Uint8Array(n))) }

  function newRoom() { return { roomId: randomB64u(16), secret: randomB64u(32) } }
  function readRef(text) {
    var t = text || ''
    try { t = decodeURIComponent(t) } catch (e) { /* keep */ }
    var m = t.match(/([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})(?![A-Za-z0-9_-])/)
    if (!m) return null
    var id = fromB64u(m[1]), sec = fromB64u(m[2])
    return id && id.length === 16 && sec && sec.length === 32 ? { roomId: m[1], secret: m[2] } : null
  }

  function create(opts) {
    var tag = opts.tag, client = null
    if (!/^[a-z0-9]{2,8}$/.test(tag || '')) throw new Error('EllenialRoom: tag must be a short per-app label')

    function roomKey(roomId, secret) {
      var raw = fromB64u(secret)
      if (!raw || raw.length !== 32) return Promise.reject(new Error('bad_secret'))
      return crypto.subtle.importKey('raw', raw, 'HKDF', false, ['deriveKey']).then(function (base) {
        return crypto.subtle.deriveKey(
          { name: 'HKDF', hash: 'SHA-256', salt: enc.encode(tag + '|' + roomId), info: enc.encode(tag + '|room-enc') },
          base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
      })
    }
    function seal(key, roomId, obj) {
      var iv = crypto.getRandomValues(new Uint8Array(12))
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv, additionalData: enc.encode(tag + '|' + roomId) }, key, enc.encode(JSON.stringify(obj)))
        .then(function (ct) {
          var c = new Uint8Array(ct), out = new Uint8Array(12 + c.length)
          out.set(iv); out.set(c, 12)
          return '1.' + toB64u(out)
        })
    }
    function unseal(key, roomId, blob) {
      if (typeof blob !== 'string' || blob.slice(0, 2) !== '1.' || blob.length > (opts.maxBytes || 200000)) return Promise.resolve(null)
      var bytes = fromB64u(blob.slice(2))
      if (!bytes || bytes.length < 29) return Promise.resolve(null)
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12), additionalData: enc.encode(tag + '|' + roomId) }, key, bytes.slice(12))
        .then(function (p) { return JSON.parse(dec.decode(p)) })
        .catch(function () { return null })
    }

    function connect(roomId, secret, onMessage, onStatus) {
      var closed = false, key = null, chan = null, bc = null
      var name = opts.app + ':' + roomId
      var ready = roomKey(roomId, secret).then(function (k) { key = k })

      function deliver(payload) {
        if (closed || !key || !payload) return
        unseal(key, roomId, payload.b).then(function (msg) { if (msg && !closed) onMessage(msg) })
      }
      ready.then(function () {
        if (closed) return
        if (opts.local) {
          bc = new BroadcastChannel(name)
          bc.onmessage = function (e) { deliver(e.data) }
          onStatus(true)
          return
        }
        if (!window.supabase) { onStatus(false); return }
        if (!client) {
          client = window.supabase.createClient(opts.supabaseUrl, opts.supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
          })
        }
        chan = client.channel(name, { config: { broadcast: { self: false, ack: false } } })
        chan.on('broadcast', { event: 'm' }, function (e) { deliver(e.payload) })
        chan.subscribe(function (status) { if (!closed) onStatus(status === 'SUBSCRIBED') })
      }).catch(function () { onStatus(false) })

      return {
        send: function (obj) {
          return ready.then(function () {
            if (closed) return
            return seal(key, roomId, obj).then(function (b) {
              if (bc) bc.postMessage({ b: b })
              else if (chan) chan.send({ type: 'broadcast', event: 'm', payload: { b: b } })
            })
          }).catch(function () {})
        },
        close: function () {
          closed = true
          if (bc) bc.close()
          if (chan && client) client.removeChannel(chan)
        }
      }
    }
    return { connect: connect }
  }

  window.EllenialRoom = { create: create, newRoom: newRoom, readRef: readRef, toB64u: toB64u, fromB64u: fromB64u, randomB64u: randomB64u }
})()
