/* ellenial poll
   A quick poll for any room. No names, no accounts, no database. Phones talk to the host's
   screen through Supabase Realtime broadcast (messages pass through, nothing is stored), and
   every message is encrypted with a key that only lives in the join link after '#'.
   The live room is the same engine as ellenial quiz. */
(function () {
  'use strict';

  var CONFIG = {
    supabaseUrl: 'https://knvrvmqdxvcatsrvkrgx.supabase.co',
    // Public by design: it can only open Realtime broadcast channels. Same project as Quiz, Split and Gillefeeling.
    supabaseKey: 'sb_publishable_5e3mg1E-r-P_to34ONwRfw_FQYUwy3z',
    origin: 'https://poll.ellenial.app'
  };
  var LIMITS = { question: 160, option: 80, options: 8, phones: 300 };
  var MIN_SHARES = 5;      // while open, live shares only from this many votes (nobody can match a bar jump to a tap)
  var STEP_FILL = [0, 1, 3, 4, 5];
  var TYPE_KEYS = ['single', 'yesno', 'multi'];

  /* ---------------- words (English and Swedish; every Ellenial app has both, Ellen 8 Nov 2026) ---------------- */

  var T = {
    en: {
      other: 'Svenska', otherLang: 'sv',
      steps: ['Waiting for the first votes', 'A few have voted', 'About half the room', 'Most have voted', 'Almost everyone'],
      types: { single: { label: 'Pick one', hint: 'pick one' }, yesno: { label: 'Yes / no / maybe', hint: 'pick one' }, multi: { label: 'Pick any', hint: 'pick as many as you like' } },
      yesno: ['Yes', 'No', 'Maybe'],
      mostPicked: '✓ Most picked', sharedTop: '✓ Shared top pick',
      noVotes: 'No votes came in', noVotesText: 'Nobody voted before the poll closed.',
      hidden: 'Results are hidden', hiddenText: 'They show when the host closes the poll.',
      waiting: function (n) { return 'Results show from ' + n + ' votes'; }, waitingText: 'So no one can work out who picked what.',
      connected: 'Connected', connecting: 'Connecting…',
      privacy: 'No names, ever. Your vote passes through to the host’s screen and is never saved. ', howLink: 'How this works',
      madeBy: 'Made by me, with the help of AI · ', anApp: 'An Ellenial app',
      back: 'Back', appearance: 'Appearance', themes: { auto: 'Auto', light: 'Light', dark: 'Dark' },
      howTitle: 'How this works', howLead: 'I built this so a room can decide something quickly, without anyone handing over their name or data.',
      points: function (n) { return [
        ['No names, no accounts', 'You join with a link or a QR code. Nobody, me included, can see who voted for what.'],
        ['Votes pass through, never saved', 'Your vote travels encrypted to the host’s screen and is never written down anywhere. When the room closes, it’s gone.'],
        ['Nobody sees a vote move', 'While the poll is open, results only show once ' + n + ' people have voted. In a small group, the final result can still show who’s who: you’ll see how few you are.'],
        ['One vote per phone, on trust', 'Your phone remembers that it voted. Someone could cheat with another browser; I’d rather trust you than track you.'],
        ['Free and open', 'No ads, no trackers, no paywall. The code is public for anyone to check.']
      ]; },
      code: 'The code: ',
      askTitle: 'Ask the room', question: 'Your question', questionPh: 'Where should the summer party be?', kind: 'Kind of poll',
      yesnoNote: 'Options: Yes, No, Maybe.', option: function (i) { return 'Option ' + i; }, removeOption: function (i) { return 'Remove option ' + i; },
      addOption: 'Add an option', rules: 'Poll rules',
      changeRule: 'Let people change their vote', changeHint: 'Until I close the poll. Still one vote per phone.',
      hideRule: 'Hide results until I close', hideHint: 'People see the shares only after I close.',
      open: 'Open the poll', needQuestion: 'Write a question first.', needOptions: 'Add at least two different options.',
      whoVoted: 'Who has voted', turnoutNote: 'A share of the phones in the room, never a number.',
      qrLabel: 'QR code to join the poll', useLink: 'Use the link', hosting: 'You’re hosting', scan: 'Scan to vote, or share the link',
      room: 'Room ', copied: 'Link copied', copyFailed: 'Copy failed', copy: 'Copy the link',
      hiddenLine: 'Results hidden until I close', close: 'Close poll and show results',
      closed: 'Poll closed', results: 'Results · ', sharesNote: 'Shares only, never names or counts.',
      saveImage: 'Save as image on my phone', end: 'End poll and close the room', endNote: 'When the room closes, everything in it is gone.',
      imgTitle: 'Poll results', imgFoot: 'poll.ellenial.app · no names, nothing saved', imgFile: 'poll-results.png',
      ended: 'The poll has ended', endedText: 'The room is closed and everything in it is gone. Thanks for voting.',
      joining: 'Joining the poll…', joiningNote: 'If nothing happens, check that the host’s screen is still open.',
      canChange: '✓ You can change your vote', final: 'Votes are final',
      replaced: 'Your new vote replaced the old one. You can change it until the host closes the poll.',
      canChangeNote: 'You can change it until the host closes the poll.', finalNote: 'Votes are final in this poll.',
      yourVote: 'Your vote', sent: '✓ Vote sent', sending: 'Sending…', youPicked: 'You picked', changeVote: 'Change my vote',
      pickOne: 'Pick an option first.', pickAny: 'Pick at least one option.', picked: '✓ Picked',
      sendNew: 'Send my new vote', send: 'Send my vote',
      badLink: 'This link doesn’t work', badLinkText: 'Ask the host to share the link or show the QR code again.', ownPoll: 'Start my own poll',
      help: { label: 'How it works', title: 'How it works', lead: 'Three steps, about a minute.', done: 'Got it', close: 'Close',
        steps: [
          { title: 'Ask your question', text: 'Pick one, yes / no / maybe, or pick any. Up to ' + LIMITS.options + ' options.' },
          { title: 'Let the room vote', text: 'Everyone opens the link or scans the QR code and votes on their own phone. No names.' },
          { title: 'Close and see the result', text: 'While it’s open, shares show from ' + MIN_SHARES + ' votes. When you close, everyone sees the result. When you end the poll, everything is gone.' }
        ],
        note: 'Votes pass through encrypted and are never saved anywhere.', more: 'More about privacy' }
    },
    sv: {
      other: 'English', otherLang: 'en',
      steps: ['Väntar på de första rösterna', 'Några har röstat', 'Ungefär halva rummet', 'De flesta har röstat', 'Nästan alla'],
      types: { single: { label: 'Välj ett', hint: 'välj ett' }, yesno: { label: 'Ja / nej / kanske', hint: 'välj ett' }, multi: { label: 'Välj flera', hint: 'välj så många du vill' } },
      yesno: ['Ja', 'Nej', 'Kanske'],
      mostPicked: '✓ Mest vald', sharedTop: '✓ Delad förstaplats',
      noVotes: 'Inga röster kom in', noVotesText: 'Ingen röstade innan omröstningen stängdes.',
      hidden: 'Resultatet är dolt', hiddenText: 'Det visas när värden stänger omröstningen.',
      waiting: function (n) { return 'Resultatet visas från ' + n + ' röster'; }, waitingText: 'Så att ingen kan räkna ut vem som valde vad.',
      connected: 'Ansluten', connecting: 'Ansluter…',
      privacy: 'Inga namn, någonsin. Din röst går direkt till värdens skärm och sparas aldrig. ', howLink: 'Så funkar det',
      madeBy: 'Gjord av mig, med hjälp av AI · ', anApp: 'En Ellenial-app',
      back: 'Tillbaka', appearance: 'Utseende', themes: { auto: 'Auto', light: 'Ljust', dark: 'Mörkt' },
      howTitle: 'Så funkar det', howLead: 'Jag byggde det här så att ett rum snabbt kan bestämma något, utan att någon behöver lämna ut sitt namn eller sina uppgifter.',
      points: function (n) { return [
        ['Inga namn, inga konton', 'Du går med via en länk eller en QR-kod. Ingen, inte ens jag, kan se vem som röstade på vad.'],
        ['Rösterna går igenom, sparas aldrig', 'Din röst skickas krypterad till värdens skärm och skrivs aldrig ner någonstans. När rummet stängs är den borta.'],
        ['Ingen ser en röst flytta sig', 'Medan omröstningen är öppen visas resultatet först när ' + n + ' personer har röstat. I en liten grupp kan slutresultatet ändå avslöja vem som valde vad: ni ser själva hur få ni är.'],
        ['En röst per telefon, på förtroende', 'Din telefon kommer ihåg att den har röstat. Någon skulle kunna fuska med en annan webbläsare; jag litar hellre på dig än spårar dig.'],
        ['Gratis och öppen', 'Ingen reklam, inga spårare, ingen betalvägg. Koden är öppen för alla att granska.']
      ]; },
      code: 'Koden: ',
      askTitle: 'Fråga rummet', question: 'Din fråga', questionPh: 'Var ska sommarfesten vara?', kind: 'Typ av omröstning',
      yesnoNote: 'Alternativ: Ja, Nej, Kanske.', option: function (i) { return 'Alternativ ' + i; }, removeOption: function (i) { return 'Ta bort alternativ ' + i; },
      addOption: 'Lägg till ett alternativ', rules: 'Regler',
      changeRule: 'Låt folk ändra sin röst', changeHint: 'Tills jag stänger omröstningen. Fortfarande en röst per telefon.',
      hideRule: 'Dölj resultatet tills jag stänger', hideHint: 'Andelarna syns först när jag har stängt.',
      open: 'Öppna omröstningen', needQuestion: 'Skriv en fråga först.', needOptions: 'Lägg till minst två olika alternativ.',
      whoVoted: 'Vilka har röstat', turnoutNote: 'En andel av telefonerna i rummet, aldrig en siffra.',
      qrLabel: 'QR-kod för att gå med i omröstningen', useLink: 'Använd länken', hosting: 'Du är värd', scan: 'Skanna för att rösta, eller dela länken',
      room: 'Rum ', copied: 'Länken är kopierad', copyFailed: 'Kunde inte kopiera', copy: 'Kopiera länken',
      hiddenLine: 'Resultatet är dolt tills jag stänger', close: 'Stäng och visa resultatet',
      closed: 'Omröstningen är stängd', results: 'Resultat · ', sharesNote: 'Bara andelar, aldrig namn eller antal.',
      saveImage: 'Spara som bild på min telefon', end: 'Avsluta och stäng rummet', endNote: 'När rummet stängs är allt i det borta.',
      imgTitle: 'Resultat', imgFoot: 'poll.ellenial.app · inga namn, inget sparas', imgFile: 'omrostning-resultat.png',
      ended: 'Omröstningen är avslutad', endedText: 'Rummet är stängt och allt i det är borta. Tack för att du röstade.',
      joining: 'Går med i omröstningen…', joiningNote: 'Om inget händer, kolla att värdens skärm fortfarande är öppen.',
      canChange: '✓ Du kan ändra din röst', final: 'Rösterna går inte att ändra',
      replaced: 'Din nya röst ersatte den gamla. Du kan ändra den tills värden stänger omröstningen.',
      canChangeNote: 'Du kan ändra den tills värden stänger omröstningen.', finalNote: 'Rösterna går inte att ändra i den här omröstningen.',
      yourVote: 'Din röst', sent: '✓ Rösten är skickad', sending: 'Skickar…', youPicked: 'Du valde', changeVote: 'Ändra min röst',
      pickOne: 'Välj ett alternativ först.', pickAny: 'Välj minst ett alternativ.', picked: '✓ Vald',
      sendNew: 'Skicka min nya röst', send: 'Skicka min röst',
      badLink: 'Den här länken fungerar inte', badLinkText: 'Be värden att dela länken eller visa QR-koden igen.', ownPoll: 'Starta en egen omröstning',
      help: { label: 'Så funkar det', title: 'Så funkar det', lead: 'Tre steg, ungefär en minut.', done: 'Uppfattat', close: 'Stäng',
        steps: [
          { title: 'Ställ din fråga', text: 'Välj ett, ja / nej / kanske, eller välj flera. Upp till ' + LIMITS.options + ' alternativ.' },
          { title: 'Låt rummet rösta', text: 'Alla öppnar länken eller skannar QR-koden och röstar på sin egen telefon. Inga namn.' },
          { title: 'Stäng och se resultatet', text: 'Medan den är öppen visas andelar från ' + MIN_SHARES + ' röster. När du stänger ser alla resultatet. När du avslutar omröstningen är allt borta.' }
        ],
        note: 'Rösterna skickas krypterade och sparas aldrig någonstans.', more: 'Mer om integritet' }
    }
  };
  var lang = 'en';
  function t() { return T[lang]; }
  // Saved choice first, else the phone's own language (Nordic languages get Swedish), like ellenial bingo.
  function pickLang() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem('ep:lang') || 'null'); } catch (e) {}
    if (saved === 'sv' || saved === 'en') return saved;
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    return /^(sv|nb|nn|no|da)\b/i.test(nav) ? 'sv' : 'en';
  }
  lang = pickLang();
  document.documentElement.lang = lang;
  var HELLO_FAST = 3000, HELLO_SLOW = 15000, PRESENT_MS = 40000, STATE_MS = 4000;

  var app = document.getElementById('app');
  var room = null;      // host or phone session, held in memory only
  var wakeLock = null;

  /* ---------------- small helpers ---------------- */

  function h(tag, attrs) {
    var el = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style') el.setAttribute('style', v);
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  var ICONS = {
    back: '<path d="M15 18l-6-6 6-6"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
    save: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.4 5.2A9.8 9.8 0 0 1 12 5c5 0 9 5 9 7a10.6 10.6 0 0 1-2.4 3.2M6.6 6.6C4.5 8 3 10.3 3 12c0 2 4 7 9 7a9.4 9.4 0 0 0 4.2-1"/>'
  };
  function icon(name, size) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', size || 18); s.setAttribute('height', size || 18);
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
    s.setAttribute('class', 'i');
    s.innerHTML = ICONS[name];
    return s;
  }
  function clean(s, max) {
    return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
      if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }
  // Read once at start: the address changes later (pushState) and must not switch transports.
  var LOCAL_DEMO = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') && /[?&]local\b/.test(location.search);
  function isLocalDemo() { return LOCAL_DEMO; }
  function shareOrigin() {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || /\.ellenial\.app$/.test(location.hostname) || /\.vercel\.app$/.test(location.hostname)) return location.origin;
    return CONFIG.origin;
  }
  function keepAwake() {
    if (!('wakeLock' in navigator) || wakeLock) return;
    navigator.wakeLock.request('screen').then(function (l) {
      wakeLock = l; l.addEventListener('release', function () { wakeLock = null; });
    }).catch(function () {});
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && room && room.role === 'host') keepAwake();
  });
  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(function () { return 'copied'; }, function () { return 'failed'; });
    return Promise.resolve('failed');
  }
  function themeSwitch() {
    if (!window.EllenialTheme) return null;
    return EllenialTheme.control({ label: t().appearance, labels: t().themes });
  }
  function show(view) {
    app.replaceChildren(view);
    var f = app.querySelector('[data-focus]');
    if (f) f.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  // A short, readable name for the room, so everyone can see they're in the same one.
  function roomName(roomId) {
    var abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', bytes = fromB64u(roomId) || [], out = '';
    for (var i = 0; i < 4; i++) out += abc[(bytes[i] || 0) % abc.length];
    return out;
  }

  /* ---------------- the live room (shared ellenial-room.js, same engine as ellenial quiz) ---------------- */

  var R = window.EllenialRoom;
  var fromB64u = R.fromB64u, randomB64u = R.randomB64u;
  var liveRoom = R.create({ app: 'poll', tag: 'ep1', supabaseUrl: CONFIG.supabaseUrl, supabaseKey: CONFIG.supabaseKey, local: LOCAL_DEMO, maxBytes: 60000 });
  function connect(roomId, secret, onMessage, onStatus) { return liveRoom.connect(roomId, secret, onMessage, onStatus); }
  function joinLink(roomId, secret) { return shareOrigin() + '/join#' + roomId + '.' + secret; }
  function readRoomRef(text) { return R.readRef(text); }

  /* ---------------- results: the privacy rules live here, and only here ---------------- */

  // What anyone may see, given the votes. Never counts, never who.
  //   At close: shares (rounded %), however few voted (Ellen, 4 Nov: people can see they're too few
  //             to be anonymous). No votes at all: nothing.
  //   While open: shares only from MIN_SHARES votes, so nobody can match a bar jump (or a changed
  //             vote) to whoever just tapped; nothing at all if the host chose to hide results.
  function resultsFor(poll, votes, closed) {
    var n = votes.length;
    var tally = poll.options.map(function () { return 0; });
    votes.forEach(function (v) { (Array.isArray(v) ? v : [v]).forEach(function (i) { tally[i]++; }); });
    var max = Math.max.apply(null, tally);
    var top = max > 0 ? tally.map(function (c, i) { return c === max ? i : -1; }).filter(function (i) { return i >= 0; }) : [];
    var shares = function () { return { kind: 'shares', shares: tally.map(function (c) { return Math.round((c / n) * 100); }), top: top }; };
    if (closed) return n ? shares() : { kind: 'none' };
    if (poll.hide) return { kind: 'hidden' };
    return n >= MIN_SHARES ? shares() : { kind: 'waiting' };
  }
  function turnoutStep(votedCount, present) {
    if (!votedCount) return 0;
    var s = votedCount / Math.max(present, votedCount, 1);
    if (s < 0.35) return 1;
    if (s < 0.65) return 2;
    if (s < 0.9) return 3;
    return 4;
  }

  /* ---------------- views: shared pieces ---------------- */

  function topBar(left, right, noLang) {
    return h('div', { class: 'bar' }, h('div', { class: 'bar-left' }, left),
      h('div', { class: 'bar-right' }, right || null, noLang ? null : langButton(), helpButton()));
  }
  // "Svenska" / "English", as in ellenial bingo. Not on the host's live screens: the poll's own words
  // (yes / no / maybe) are already set in the host's language by then.
  var redraw = null;
  function langButton() {
    return h('button', { class: 'lang', lang: t().otherLang, onclick: function () {
      lang = t().otherLang; document.documentElement.lang = lang;
      try { localStorage.setItem('ep:lang', JSON.stringify(lang)); } catch (e) {}
      if (room && room.role === 'phone') renderPhone(); else if (redraw) redraw(); else show(createView());
    } }, t().other);
  }

  // The shared Ellenial "?" (ellenial-help.js, decided 8 Nov 2026): help only when someone asks for it.
  function helpButton() {
    if (!window.EllenialHelp) return null;
    var hp = t().help;
    return EllenialHelp.button({ label: hp.label, onclick: function () {
      // The privacy page replaces the screen, so it's only offered when no room is running.
      var back = app.firstChild;
      EllenialHelp.open({ title: hp.title, lead: hp.lead, image: '/icons/help-tile.png', steps: hp.steps, note: hp.note, done: hp.done, close: hp.close,
        more: room ? null : { label: hp.more, onclick: function () { show(howView(function () { show(back); })); } } });
    } });
  }
  function wordmark() { return h('a', { class: 'wordmark', href: '/' }, 'poll'); }
  function backButton(onBack) {
    return h('button', { class: 'round', 'aria-label': t().back, onclick: onBack }, icon('back', 22));
  }
  function privacyLine(withLink, onHow) {
    return h('div', { class: 'privacy' }, icon('lock'),
      h('span', null, t().privacy,
        withLink ? h('button', { class: 'btn link', style: 'min-height:auto;padding:0;font-size:inherit', onclick: onHow }, t().howLink) : null));
  }
  function signature() {
    return h('p', { class: 'foot' }, t().madeBy, h('a', { href: 'https://ellenial.app' }, t().anApp));
  }
  function resultList(poll, res) {
    if (res.kind === 'shares') {
      return h('ol', { class: 'results' }, poll.options
        .map(function (o, i) { return { o: o, i: i, pct: res.shares[i] }; })
        .sort(function (a, b) { return b.pct - a.pct || a.i - b.i; })
        .map(function (r) {
          var isTop = res.top.indexOf(r.i) >= 0 && res.top.length < poll.options.length;
          return h('li', { class: 'res' + (isTop ? ' top' : '') },
            h('div', { class: 'res-head' }, h('span', { class: 'txt', text: r.o }), h('span', { class: 'pct', text: r.pct + '%' })),
            h('div', { class: 'track', 'aria-hidden': 'true' }, h('div', { class: 'fill', style: 'width:' + r.pct + '%' })),
            isTop ? h('span', { class: 'top-tag' }, res.top.length > 1 ? t().sharedTop : t().mostPicked) : null);
        }));
    }
    if (res.kind === 'none' || res.kind === 'few' || res.kind === 'top') return waitingBox(t().noVotes, t().noVotesText);
    if (res.kind === 'hidden') return waitingBox(t().hidden, t().hiddenText);
    return waitingBox(t().waiting(MIN_SHARES), t().waitingText);
  }
  function waitingBox(title, text) {
    return h('div', { class: 'waiting' }, h('strong', { text: title }), h('span', { class: 'note', text: text }));
  }
  function statusLine(online) {
    return h('span', { class: 'status', role: 'status' }, h('span', { class: 'status-dot' + (online ? '' : ' off'), 'aria-hidden': 'true' }), online ? t().connected : t().connecting);
  }

  /* ---------------- explainer ---------------- */

  function howView(onBack) {
    var points = t().points(MIN_SHARES);
    redraw = function () { show(howView(onBack)); };
    return h('div', { class: 'page' },
      topBar([backButton(onBack), wordmark()]),
      h('h1', { class: 'q', tabindex: '-1', 'data-focus': true }, t().howTitle),
      h('p', { class: 'muted', style: 'margin:0', text: t().howLead }),
      h('ul', { class: 'points' }, points.map(function (p, i) {
        return h('li', null, h('span', { class: 'n', 'aria-hidden': 'true', text: String(i + 1) }),
          h('div', null, h('strong', { text: p[0] }), h('p', { text: p[1] })));
      })),
      h('p', { class: 'note' }, t().code, h('a', { href: 'https://github.com/phoenixcyberpunk/ellenial-poll' }, 'github.com/phoenixcyberpunk/ellenial-poll'), ' (AGPL-3.0).'),
      h('div', { class: 'grow' }),
      h('div', { class: 'theme-row' }, h('span', { class: 'label', text: t().appearance }), themeSwitch()),
      signature());
  }

  /* ---------------- host: create ---------------- */

  function freshDraft() { return { type: 'single', question: '', options: ['', ''], change: true, hide: false }; }
  var draft = freshDraft();
  function ruleBox(label, hint, key) {
    return h('label', { class: 'rule' },
      h('input', { type: 'checkbox', checked: draft[key], onchange: function (e) { draft[key] = e.target.checked; } }),
      h('span', { class: 'rule-text' }, h('span', { class: 'rule-label', text: label }), h('span', { class: 'note', text: hint })));
  }

  function createView(error) {
    function opts() {
      if (draft.type === 'yesno') return h('p', { class: 'note', text: t().yesnoNote });
      return h('div', { class: 'stack' },
        draft.options.map(function (o, i) {
          return h('div', { class: 'opt-row' },
            h('label', { class: 'sr-only', for: 'opt' + i, text: t().option(i + 1) }),
            h('input', { class: 'input', id: 'opt' + i, maxlength: LIMITS.option, placeholder: t().option(i + 1), value: o,
              oninput: function (e) { draft.options[i] = e.target.value; } }),
            draft.options.length > 2 ? h('button', { class: 'round', style: 'margin:0;border:2px solid var(--edge);background:var(--surface)', 'aria-label': t().removeOption(i + 1),
              onclick: function () { draft.options.splice(i, 1); show(createView()); } }, icon('x')) : null);
        }),
        draft.options.length < LIMITS.options ? h('button', { class: 'btn ghost', onclick: function () {
          draft.options.push(''); show(createView()); var last = document.getElementById('opt' + (draft.options.length - 1)); if (last) last.focus();
        } }, icon('plus'), t().addOption) : null);
    }
    redraw = function () { show(createView()); };
    return h('div', { class: 'page' },
      topBar(wordmark()),
      h('h1', { class: 'q', text: t().askTitle }),
      h('label', { class: 'field' }, h('span', { text: t().question }),
        h('textarea', { class: 'input', maxlength: LIMITS.question, placeholder: t().questionPh, value: draft.question,
          oninput: function (e) { draft.question = e.target.value; } })),
      h('div', { class: 'field' }, h('span', { id: 'type-l', text: t().kind }),
        h('div', { class: 'seg', role: 'group', 'aria-labelledby': 'type-l' }, TYPE_KEYS.map(function (k) {
          return h('button', { type: 'button', 'aria-pressed': String(draft.type === k), onclick: function () { draft.type = k; show(createView()); } }, t().types[k].label);
        }))),
      opts(),
      h('section', { class: 'card rules', 'aria-labelledby': 'rules-h' },
        h('h2', { class: 'label', id: 'rules-h', text: t().rules }),
        ruleBox(t().changeRule, t().changeHint, 'change'),
        h('div', { class: 'rule-line', 'aria-hidden': 'true' }),
        ruleBox(t().hideRule, t().hideHint, 'hide')),
      error ? h('p', { class: 'error', role: 'alert', text: error }) : null,
      h('button', { class: 'btn', onclick: startPoll }, t().open),
      privacyLine(false),
      h('div', { class: 'grow' }),
      h('div', { class: 'theme-row' }, themeSwitch()),
      signature());
  }
  function startPoll() {
    var question = clean(draft.question, LIMITS.question);
    var options = draft.type === 'yesno' ? t().yesno.slice() : draft.options.map(function (o) { return clean(o, LIMITS.option); }).filter(Boolean);
    var seen = {};
    options = options.filter(function (o) { var k = o.toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true; });
    if (!question) return show(createView(t().needQuestion));
    if (options.length < 2) return show(createView(t().needOptions));
    var fresh = R.newRoom(), roomId = fresh.roomId, secret = fresh.secret;
    room = {
      role: 'host', roomId: roomId, secret: secret, link: joinLink(roomId, secret), online: false,
      poll: { q: question, type: draft.type, options: options, change: !!draft.change, hide: !!draft.hide },
      votes: {}, vn: {}, seen: {}, phase: 'open', timer: null
    };
    room.conn = connect(roomId, secret, hostOnMessage, function (ok) { room.online = ok; renderHost(); if (ok) broadcastState(); });
    room.timer = setInterval(function () { broadcastState(); renderTurnout(); }, STATE_MS);
    keepAwake();
    history.pushState({ v: 'host' }, '', location.pathname + location.search);
    renderHost(true);
  }

  /* ---------------- host: live room ---------------- */

  function presentCount() {
    var now = Date.now(), n = 0;
    Object.keys(room.seen).forEach(function (pid) { if (now - room.seen[pid] < PRESENT_MS || room.votes[pid] !== undefined) n++; });
    return n;
  }
  function voteList() { return Object.keys(room.votes).map(function (k) { return room.votes[k]; }); }
  function validVote(a) {
    var n = room.poll.options.length;
    function ok(i) { return typeof i === 'number' && Math.floor(i) === i && i >= 0 && i < n; }
    if (room.poll.type === 'multi') {
      if (!Array.isArray(a) || !a.length || a.length > n || !a.every(ok)) return null;
      return a.filter(function (x, i) { return a.indexOf(x) === i; }).sort(function (x, y) { return x - y; });
    }
    return ok(a) ? a : null;
  }
  function hostOnMessage(msg) {
    if (!room || room.role !== 'host' || !msg || typeof msg.pid !== 'string' || !/^[A-Za-z0-9_-]{16}$/.test(msg.pid)) return;
    var known = room.seen[msg.pid] !== undefined;
    if (!known && Object.keys(room.seen).length >= LIMITS.phones) return;
    room.seen[msg.pid] = Date.now();
    if (msg.t === 'hello') { if (!known) { queueState(); renderTurnout(); } return; }
    if (msg.t === 'vote' && room.phase === 'open') {
      // Still one vote per phone. A changed vote (only if the host allowed it) replaces the old one;
      // n counts the phone's versions so a late resend of an old vote can't undo a newer one.
      var n = typeof msg.n === 'number' && Math.floor(msg.n) === msg.n && msg.n > 0 && msg.n < 1000 ? msg.n : 1;
      var had = room.votes[msg.pid] !== undefined;
      if (had && (!room.poll.change || n <= (room.vn[msg.pid] || 1))) return;
      var v = validVote(msg.a);
      if (v === null) return;
      room.votes[msg.pid] = v;   // in memory only, gone when this tab closes
      room.vn[msg.pid] = n;
      queueState(); renderTurnout(); renderLiveResults();
    }
  }
  // Phones can make the host speak (a new phone, a vote, a changed vote). Coalesce those into at most
  // one broadcast per STATE_GAP, so a phone spamming messages can't make the host flood the shared
  // Supabase project. Closing the poll still broadcasts at once.
  var STATE_GAP = 500;
  function queueState() {
    if (!room || room.stateQueued) return;
    room.stateQueued = setTimeout(function () { if (room) { room.stateQueued = null; broadcastState(); } }, STATE_GAP);
  }
  function broadcastState() {
    if (!room || room.role !== 'host' || !room.conn) return;
    var closed = room.phase === 'closed';
    room.conn.send({
      t: 'state', phase: room.phase,
      poll: { q: room.poll.q, type: room.poll.type, options: room.poll.options, change: room.poll.change },
      seen: Object.keys(room.seen), got: Object.keys(room.votes), gv: room.poll.change ? room.vn : undefined,
      res: resultsFor(room.poll, voteList(), closed)
    });
  }
  function turnoutBox() {
    var step = turnoutStep(Object.keys(room.votes).length, presentCount());
    return h('section', { class: 'card turnout', id: 'turnout', 'aria-labelledby': 'turnout-h' },
      h('h2', { class: 'label', id: 'turnout-h', text: t().whoVoted }),
      h('div', { class: 'steps', role: 'img', 'aria-label': t().steps[step] }, [0, 1, 2, 3, 4].map(function (i) { return h('span', { class: i < STEP_FILL[step] ? 'on' : '' }); })),
      h('span', { class: 'turnout-word', 'aria-live': 'polite', text: t().steps[step] }),
      h('span', { class: 'note', text: t().turnoutNote }));
  }
  function renderTurnout() {
    var el = document.getElementById('turnout');
    if (el && room && room.phase === 'open') el.replaceWith(turnoutBox());
  }
  function renderLiveResults() {
    var el = document.getElementById('live');
    if (el && room) el.replaceChildren(resultList(room.poll, resultsFor(room.poll, voteList(), false)));
  }
  function renderHost(focus) {
    if (!room || room.role !== 'host') return;
    if (room.phase === 'closed') return show(hostResultsView());
    var qr = h('div', { class: 'qr', role: 'img', 'aria-label': t().qrLabel });
    try {
      var code = window.qrcode(0, 'M'); code.addData(room.link); code.make();
      qr.innerHTML = code.createSvgTag({ cellSize: 4, margin: 1, scalable: true });
      qr.querySelectorAll('path,rect').forEach(function (n) { var f = n.getAttribute('fill'); if (f === '#000000' || f === 'black') n.setAttribute('fill', '#1F1A2E'); });
    } catch (e) { qr.textContent = t().useLink; }
    var view = h('div', { class: 'page' },
      topBar(wordmark(), h('span', { class: 'chip', text: t().hosting }), true),
      h('h1', { class: 'q small', tabindex: '-1', 'data-focus': focus ? true : null, text: room.poll.q }),
      h('div', { class: 'card join-card' }, qr,
        h('div', { class: 'join-info' },
          h('span', { class: 'note', text: t().scan }),
          h('span', { class: 'room-name', 'aria-label': t().room + roomName(room.roomId).split('').join(' '), text: roomName(room.roomId) }),
          h('button', { class: 'btn ghost small', onclick: function (e) {
            var b = e.currentTarget;
            copyText(room.link).then(function (r) { b.lastChild.textContent = r === 'copied' ? t().copied : t().copyFailed; });
          } }, icon('copy'), h('span', { text: t().copy })),
          statusLine(room.online))),
      turnoutBox(),
      room.poll.hide
        ? h('div', { class: 'fixed-rule' }, icon('eyeOff', 20), h('span', { text: t().hiddenLine }))
        : h('div', { id: 'live' }, resultList(room.poll, resultsFor(room.poll, voteList(), false))),
      h('div', { class: 'grow' }),
      h('button', { class: 'btn', onclick: closePoll }, t().close));
    show(view);
  }
  function closePoll() {
    room.phase = 'closed';
    room.final = resultsFor(room.poll, voteList(), true);
    broadcastState();
    show(hostResultsView());
  }
  function hostResultsView() {
    var res = room.final;
    var step = turnoutStep(Object.keys(room.votes).length, presentCount());
    return h('div', { class: 'page' },
      topBar(wordmark(), h('span', { class: 'chip' }, icon('lock', 14), t().closed), true),
      h('div', { class: 'stack', style: 'gap:8px' },
        h('p', { class: 'kicker', text: t().results + t().steps[step].toLowerCase() }),
        h('h1', { class: 'q', tabindex: '-1', 'data-focus': true, text: room.poll.q })),
      resultList(room.poll, res),
      res.kind === 'shares' ? h('p', { class: 'note', text: t().sharesNote }) : null,
      h('div', { class: 'grow' }),
      res.kind === 'shares' ? h('button', { class: 'btn ghost', onclick: function () { saveImage(room.poll, res); } }, icon('save'), t().saveImage) : null,
      h('button', { class: 'btn', onclick: endRoom }, t().end),
      h('p', { class: 'foot', text: t().endNote }));
  }
  function endRoom() {
    if (room && room.conn) {
      var conn = room.conn;
      conn.send({ t: 'end' }).then(function () { setTimeout(function () { conn.close(); }, 400); });
    }
    if (room && room.timer) clearInterval(room.timer);
    room = null;
    draft = freshDraft();
    history.replaceState(null, '', location.pathname + location.search);
    show(createView());
  }
  window.addEventListener('beforeunload', function (e) {
    if (room && room.role === 'host') { e.preventDefault(); e.returnValue = ''; }
  });

  /* ---------------- save as image (drawn here, saved on this phone only) ---------------- */

  function saveImage(poll, res) {
    var css = getComputedStyle(document.documentElement);
    var c = function (n) { return css.getPropertyValue(n).trim(); };
    var W = 1080, pad = 80, rowH = res.kind === 'shares' ? 150 : 120;
    var rows = res.kind === 'shares'
      ? poll.options.map(function (o, i) { return { o: o, i: i, pct: res.shares[i] }; }).sort(function (a, b) { return b.pct - a.pct || a.i - b.i; })
      : res.top.map(function (i) { return { o: poll.options[i], i: i }; });
    var cv = document.createElement('canvas'), ctx = cv.getContext('2d');
    ctx.font = '600 64px Fraunces, Georgia, serif';
    var titleLines = wrap(ctx, poll.q, W - pad * 2);
    var H = pad + 40 + titleLines.length * 76 + 50 + rows.length * (rowH + 20) + 120;
    cv.width = W; cv.height = H;
    ctx.fillStyle = c('--ground'); ctx.fillRect(0, 0, W, H);
    var y = pad;
    ctx.fillStyle = c('--muted'); ctx.font = '500 30px "DM Sans", system-ui, sans-serif';
    ctx.fillText(t().imgTitle, pad, y + 24); y += 60;
    ctx.fillStyle = c('--ink'); ctx.font = '600 64px Fraunces, Georgia, serif';
    titleLines.forEach(function (l) { y += 64; ctx.fillText(l, pad, y); y += 12; });
    y += 40;
    rows.forEach(function (r) {
      var isTop = res.top.indexOf(r.i) >= 0;
      roundRect(ctx, pad, y, W - pad * 2, rowH, 28);
      ctx.fillStyle = isTop ? c('--peri') : c('--surface'); ctx.fill();
      ctx.fillStyle = isTop ? c('--on-peri') : c('--ink');
      ctx.font = '500 36px "DM Sans", system-ui, sans-serif';
      ctx.fillText(ellipsis(ctx, r.o, W - pad * 2 - 220), pad + 32, y + 56);
      if (res.kind === 'shares') {
        ctx.font = '600 42px Fraunces, Georgia, serif'; ctx.textAlign = 'right';
        ctx.fillText(r.pct + '%', W - pad - 32, y + 58); ctx.textAlign = 'left';
        roundRect(ctx, pad + 32, y + 88, W - pad * 2 - 64, 24, 12); ctx.fillStyle = c('--soft'); ctx.fill();
        if (r.pct > 0) { roundRect(ctx, pad + 32, y + 88, Math.max(24, (W - pad * 2 - 64) * r.pct / 100), 24, 12); ctx.fillStyle = c('--accent'); ctx.fill(); }
      } else {
        ctx.font = '700 28px "DM Sans", system-ui, sans-serif';
        ctx.fillText(t().mostPicked, pad + 32, y + 98);
      }
      y += rowH + 20;
    });
    ctx.fillStyle = c('--muted'); ctx.font = '500 28px "DM Sans", system-ui, sans-serif';
    ctx.fillText(t().imgFoot, pad, H - pad + 20);
    cv.toBlob(function (blob) {
      if (!blob) return;
      var file = new File([blob], t().imgFile, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: t().imgTitle }).catch(function () {});
        return;
      }
      var url = URL.createObjectURL(blob), a = h('a', { href: url, download: t().imgFile });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    }, 'image/png');
  }
  function wrap(ctx, text, max) {
    var words = text.split(' '), lines = [], line = '';
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t;
    });
    if (line) lines.push(line);
    return lines.slice(0, 4);
  }
  function ellipsis(ctx, text, max) {
    if (ctx.measureText(text).width <= max) return text;
    while (text.length > 1 && ctx.measureText(text + '…').width > max) text = text.slice(0, -1);
    return text + '…';
  }
  function roundRect(ctx, x, y, w, hh, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + hh, r); ctx.arcTo(x + w, y + hh, x, y + hh, r);
    ctx.arcTo(x, y + hh, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  /* ---------------- phone ---------------- */

  function joinRoom(ref) {
    var pidKey = 'ep:pid:' + ref.roomId;
    var pid = store(pidKey);
    if (typeof pid !== 'string' || !/^[A-Za-z0-9_-]{16}$/.test(pid)) { pid = randomB64u(12); store(pidKey, pid); }
    room = {
      role: 'phone', roomId: ref.roomId, secret: ref.secret, pid: pid, online: false,
      state: null, myVote: store('ep:voted:' + ref.roomId), pick: [], acked: false, ended: false, editing: false
    };
    var n = store('ep:vn:' + ref.roomId);
    room.myN = room.myVote === null ? 0 : (typeof n === 'number' && n > 0 ? n : 1);
    room.conn = connect(ref.roomId, ref.secret, phoneOnMessage, function (ok) { room.online = ok; if (ok) hello(); renderPhone(); });
    function hello() {
      if (!room || room.role !== 'phone' || room.ended) return;
      room.conn.send({ t: 'hello', pid: room.pid });
      if (room.state && voteMissing(room.state)) sendVote();
      clearTimeout(room.helloTimer);
      room.helloTimer = setTimeout(hello, room.acked ? HELLO_SLOW : HELLO_FAST);
    }
    room.hello = hello;
    renderPhone();
  }
  // Has the host got this phone's latest vote? If not, send it again.
  function voteMissing(s) {
    if (room.myVote === null || s.phase !== 'open') return false;
    if (s.got.indexOf(room.pid) < 0) return true;
    return !!(s.gv && typeof s.gv === 'object' && (Number(s.gv[room.pid]) || 1) < room.myN);
  }
  function voteArrived(s) { return s.got.indexOf(room.pid) >= 0 && !voteMissing(s); }
  function sendVote() { room.conn.send({ t: 'vote', pid: room.pid, a: room.myVote, n: room.myN }); }
  function phoneOnMessage(msg) {
    if (!room || room.role !== 'phone' || !msg) return;
    if (msg.t === 'end') { room.ended = true; clearTimeout(room.helloTimer); room.conn.close(); return renderPhone(); }
    if (msg.t !== 'state' || !msg.poll || !Array.isArray(msg.poll.options) || !Array.isArray(msg.seen) || !Array.isArray(msg.got)) return;
    var first = !room.state, wasPhase = room.state && room.state.phase;
    msg.poll.q = clean(msg.poll.q, LIMITS.question);
    msg.poll.options = msg.poll.options.slice(0, LIMITS.options).map(function (o) { return clean(o, LIMITS.option); });
    room.state = msg;
    room.acked = msg.seen.indexOf(room.pid) >= 0;
    if (voteMissing(msg)) sendVote();
    if (first || wasPhase !== msg.phase || !document.getElementById('vote-form')) renderPhone();
  }
  function renderPhone() {
    if (!room || room.role !== 'phone') return;
    var s = room.state;
    var bar = topBar(wordmark(), h('span', { class: 'chip', text: t().room + roomName(room.roomId) }));
    if (room.ended) {
      return show(h('div', { class: 'page' }, bar,
        h('h1', { class: 'q', tabindex: '-1', 'data-focus': true }, t().ended),
        h('p', { class: 'muted', style: 'margin:0', text: t().endedText }),
        h('div', { class: 'grow' }), signature()));
    }
    if (!s) {
      return show(h('div', { class: 'page' }, bar,
        h('h1', { class: 'q', tabindex: '-1', 'data-focus': true }, t().joining),
        statusLine(room.online),
        h('p', { class: 'note', text: t().joiningNote }),
        h('div', { class: 'grow' }), privacyLine(true, openHow)));
    }
    var hint = (t().types[s.poll.type] || t().types.single).hint;
    if (s.phase === 'closed') {
      return show(h('div', { class: 'page' }, bar,
        h('div', { class: 'stack', style: 'gap:8px' }, h('p', { class: 'kicker' }, t().closed),
          h('h1', { class: 'q', tabindex: '-1', 'data-focus': true, text: s.poll.q })),
        resultList(s.poll, s.res || { kind: 'few' }),
        h('div', { class: 'grow' }), privacyLine(true, openHow)));
    }
    var changeable = s.poll.change === true;
    var ruleChip = h('div', { class: 'chips' }, h('span', { class: 'chip outline', text: changeable ? t().canChange : t().final }));
    if (room.myVote !== null && !room.editing) {
      var arrived = voteArrived(s);
      var picked = (Array.isArray(room.myVote) ? room.myVote : [room.myVote]).map(function (i) { return s.poll.options[i]; }).filter(Boolean).join(', ');
      var sentNote = changeable
        ? (room.myN > 1 ? t().replaced : t().canChangeNote)
        : t().finalNote;
      return show(h('div', { class: 'page' }, bar,
        h('div', { class: 'stack', style: 'gap:8px' }, h('p', { class: 'kicker', text: t().yourVote }), h('h1', { class: 'q small', text: s.poll.q })),
        ruleChip,
        h('div', { class: 'sent card', role: 'status' },
          h('span', { class: 'label', tabindex: '-1', 'data-focus': true, text: arrived ? t().sent : t().sending }),
          h('span', { class: 'muted', text: t().youPicked }),
          h('span', { class: 'big', text: picked }),
          h('span', { class: 'note', text: sentNote })),
        h('div', { id: 'phone-live' }, resultList(s.poll, s.res || { kind: 'waiting' })),
        h('div', { class: 'grow' }),
        changeable ? h('button', { class: 'btn ghost', onclick: function () { room.editing = true; renderPhone(); } }, t().changeVote) : null,
        privacyLine(true, openHow)));
    }
    var multi = s.poll.type === 'multi';
    var before = room.myVote === null ? [] : (Array.isArray(room.myVote) ? room.myVote : [room.myVote]);
    var form = h('form', { class: 'stack', id: 'vote-form', onsubmit: function (e) {
      e.preventDefault();
      var picked = Array.prototype.slice.call(form.querySelectorAll('input:checked')).map(function (i) { return Number(i.value); });
      if (!picked.length) { var er = form.querySelector('.error'); er.textContent = multi ? t().pickAny : t().pickOne; return; }
      room.myVote = multi ? picked : picked[0];
      room.myN = (room.myN || 0) + 1;
      room.editing = false;
      store('ep:voted:' + room.roomId, room.myVote);   // this phone only: it already voted
      store('ep:vn:' + room.roomId, room.myN);
      sendVote();
      renderPhone();
    } },
      h('fieldset', { class: 'stack', style: 'margin:0;padding:0;border:0' },
        h('legend', { class: 'sr-only', text: s.poll.q }),
        s.poll.options.map(function (o, i) {
          return h('label', { class: 'option' },
            h('input', { type: multi ? 'checkbox' : 'radio', name: 'vote', value: String(i), checked: before.indexOf(i) >= 0 }),
            h('span', { class: 'txt', text: o }), h('span', { class: 'tag', text: t().picked }));
        })),
      h('p', { class: 'error', role: 'alert' }),
      h('button', { class: 'btn', type: 'submit' }, room.editing ? t().sendNew : t().send));
    show(h('div', { class: 'page' }, bar,
      h('div', { class: 'stack', style: 'gap:8px' },
        h('p', { class: 'kicker', text: t().yourVote + ' · ' + hint }),
        h('h1', { class: 'q', tabindex: '-1', 'data-focus': true, text: s.poll.q })),
      ruleChip,
      form,
      h('div', { class: 'grow' }),
      privacyLine(true, openHow)));
  }
  function openHow() {
    show(howView(function () { if (room && room.role === 'phone') renderPhone(); else show(createView()); }));
  }
  // Keep the phone's live results fresh without re-rendering a form someone is filling in.
  setInterval(function () {
    var el = document.getElementById('phone-live');
    if (el && room && room.state) el.replaceChildren(resultList(room.state.poll, room.state.res || { kind: 'waiting' }));
  }, 2000);

  /* ---------------- start ---------------- */

  function route() {
    if (location.pathname === '/join') {
      var ref = readRoomRef(location.hash.slice(1));
      if (!ref) {
        redraw = route;
        return show(h('div', { class: 'page' }, topBar(wordmark()),
          h('h1', { class: 'q', text: t().badLink }),
          h('p', { class: 'muted', text: t().badLinkText }),
          h('a', { class: 'btn', href: '/' }, t().ownPoll), h('div', { class: 'grow' }), signature()));
      }
      return joinRoom(ref);
    }
    show(createView());
  }
  window.addEventListener('popstate', function () { if (room && room.role === 'host') renderHost(); });
  route();
})();
