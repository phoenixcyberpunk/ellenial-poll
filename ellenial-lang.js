/*! ellenial-lang.js for ellenial poll · AGPL-3.0
 * Every Ellenial app comes in Swedish and English (decided by Ellen, 8 Nov 2026).
 * Poll is written in English; this file holds the Swedish. tx('English text') returns the text in the
 * chosen language. The choice follows the phone's language until someone taps the switch, and is then
 * saved on this phone only (localStorage `ep:lang`). Test with ?lang=sv or ?lang=en (not saved).
 * Switching reloads the page, so it's only offered when no poll is running.
 */
;(function () {
  'use strict'
  var KEY = 'ep:lang'
  function saved() { try { var v = localStorage.getItem(KEY); return v === 'sv' || v === 'en' ? v : null } catch (e) { return null } }
  function fromPhone() {
    var n = (navigator.languages && navigator.languages[0]) || navigator.language || 'en'
    return /^(sv|nb|nn|no|da)\b/i.test(n) ? 'sv' : 'en'
  }
  var url = null
  try { url = new URLSearchParams(location.search).get('lang') } catch (e) {}
  var lang = url === 'sv' || url === 'en' ? url : saved() || fromPhone()
  document.documentElement.lang = lang

  var SV = {
    'Start my own poll': 'Starta en egen omröstning',
    'Ask the host to share the link or show the QR code again.': 'Be den som håller i omröstningen att dela länken eller visa QR-koden igen.',
    'This link doesn’t work': 'Den här länken fungerar inte',
    'Your vote · ': 'Din röst · ',
    'Send my vote': 'Skicka min röst',
    'Send my new vote': 'Skicka min nya röst',
    '✓ Picked': '✓ Vald',
    'Pick an option first.': 'Välj ett alternativ först.',
    'Pick at least one option.': 'Välj minst ett alternativ.',
    'Change my vote': 'Ändra min röst',
    'You picked': 'Du valde',
    'Sending…': 'Skickar…',
    '✓ Vote sent': '✓ Rösten är skickad',
    'Your vote': 'Din röst',
    'Votes are final in this poll.': 'Rösterna går inte att ändra i den här omröstningen.',
    'You can change it until the host closes the poll.': 'Du kan ändra den tills omröstningen stängs.',
    'Your new vote replaced the old one. You can change it until the host closes the poll.': 'Din nya röst ersatte den gamla. Du kan ändra den tills omröstningen stängs.',
    'Votes are final': 'Rösterna går inte att ändra',
    '✓ You can change your vote': '✓ Du kan ändra din röst',
    'Poll closed': 'Omröstningen är stängd',
    'If nothing happens, check that the host’s screen is still open.': 'Händer inget? Kolla att skärmen hos den som håller i omröstningen fortfarande är öppen.',
    'Joining the poll…': 'Går med i omröstningen…',
    'The room is closed and everything in it is gone. Thanks for voting.': 'Rummet är stängt och allt i det är borta. Tack för att du röstade.',
    'The poll has ended': 'Omröstningen är slut',
    'Room ': 'Rum ',
    'Poll results': 'Resultat',
    'poll.ellenial.app · no names, nothing saved': 'poll.ellenial.app · inga namn, inget sparas',
    '✓ Most picked': '✓ Flest valde',
    'When the room closes, everything in it is gone.': 'När rummet stängs är allt i det borta.',
    'End poll and close the room': 'Avsluta och stäng rummet',
    'Save as image on my phone': 'Spara som bild på min telefon',
    'Shares only, never names or counts.': 'Bara andelar, aldrig namn eller antal.',
    'Results · ': 'Resultat · ',
    'Close poll and show results': 'Stäng och visa resultatet',
    'Results hidden until I close': 'Resultatet är dolt tills jag stänger',
    'Copy the link': 'Kopiera länken',
    'Copy failed': 'Det gick inte att kopiera',
    'Link copied': 'Länken är kopierad',
    'Scan to vote, or share the link': 'Skanna för att rösta, eller dela länken',
    'You’re hosting': 'Du håller i omröstningen',
    'Use the link': 'Använd länken',
    'QR code to join the poll': 'QR-kod för att gå med i omröstningen',
    'A share of the phones in the room, never a number.': 'En andel av telefonerna i rummet, aldrig ett antal.',
    'Who has voted': 'Hur många som har röstat',
    'Add at least two different options.': 'Lägg till minst två olika alternativ.',
    'Write a question first.': 'Skriv en fråga först.',
    'Maybe': 'Kanske',
    'No': 'Nej',
    'Yes': 'Ja',
    'Open the poll': 'Öppna omröstningen',
    'People see the shares only after I close.': 'Alla ser andelarna först när jag stänger.',
    'Hide results until I close': 'Dölj resultatet tills jag stänger',
    'Until I close the poll. Still one vote per phone.': 'Tills jag stänger. Fortfarande en röst per telefon.',
    'Let people change their vote': 'Låt alla ändra sin röst',
    'Poll rules': 'Regler',
    'Kind of poll': 'Sorts omröstning',
    'Where should the summer party be?': 'Var ska sommarfesten vara?',
    'Your question': 'Din fråga',
    'Ask the room': 'Fråga rummet',
    'Add an option': 'Lägg till ett alternativ',
    'Remove option ': 'Ta bort alternativ ',
    'Option ': 'Alternativ ',
    'Options: Yes, No, Maybe.': 'Alternativ: Ja, Nej, Kanske.',
    'Appearance': 'Utseende',
    ' (AGPL-3.0).': ' (AGPL-3.0).',
    'The code: ': 'Koden: ',
    'I built this so a room can decide something quickly, without anyone handing over their name or data.': 'Jag byggde det här så att ett rum snabbt kan bestämma något, utan att någon lämnar ut sitt namn eller sina uppgifter.',
    'How this works': 'Så fungerar det',
    'No ads, no trackers, no paywall. The code is public for anyone to check.': 'Ingen reklam, ingen spårning, ingen betalvägg. Koden är öppen för alla att granska.',
    'Free and open': 'Gratis och öppet',
    'Your phone remembers that it voted. Someone could cheat with another browser; I’d rather trust you than track you.': 'Din telefon kommer ihåg att den har röstat. Någon skulle kunna fuska med en annan webbläsare, men jag litar hellre på dig än spårar dig.',
    'One vote per phone, on trust': 'En röst per telefon, på förtroende',
    ' people have voted. In a small group, the final result can still show who’s who: you’ll see how few you are.': ' personer har röstat. I en liten grupp kan slutresultatet ändå visa vem som röstade på vad: ni ser hur få ni är.',
    'While the poll is open, results only show once ': 'Medan omröstningen är öppen visas resultatet först när ',
    'Nobody sees a vote move': 'Ingen ser en röst komma in',
    'Your vote travels encrypted to the host’s screen and is never written down anywhere. When the room closes, it’s gone.': 'Din röst skickas krypterad till skärmen hos den som håller i omröstningen och skrivs aldrig ner någonstans. När rummet stängs är den borta.',
    'Votes pass through, never saved': 'Rösterna passerar, sparas aldrig',
    'You join with a link or a QR code. Nobody, me included, can see who voted for what.': 'Du går med via en länk eller en QR-kod. Ingen, inte ens jag, kan se vem som röstade på vad.',
    'No names, no accounts': 'Inga namn, inga konton',
    'Connecting…': 'Ansluter…',
    'Connected': 'Ansluten',
    'So no one can work out who picked what.': 'Så att ingen kan räkna ut vem som valde vad.',
    ' votes': ' röster',
    'Results show from ': 'Resultatet visas från ',
    'They show when the host closes the poll.': 'Det visas när omröstningen stängs.',
    'Results are hidden': 'Resultatet är dolt',
    'Nobody voted before the poll closed.': 'Ingen röstade innan omröstningen stängdes.',
    'No votes came in': 'Inga röster kom in',
    '✓ Shared top pick': '✓ Delad förstaplats',
    'An Ellenial app': 'En Ellenial-app',
    'Made by me, with the help of AI · ': 'Gjord av mig, med hjälp av AI · ',
    'No names, ever. Your vote passes through to the host’s screen and is never saved. ': 'Aldrig några namn. Din röst går vidare till skärmen hos den som håller i omröstningen och sparas aldrig. ',
    'Back': 'Tillbaka',
    'Dark': 'Mörkt',
    'Light': 'Ljust',
    'Auto': 'Auto',
    'pick as many as you like': 'välj så många du vill',
    'Pick any': 'Välj flera',
    'pick one': 'välj ett',
    'Yes / no / maybe': 'Ja / nej / kanske',
    'Pick one': 'Välj ett',
    'Almost everyone': 'Nästan alla',
    'Most have voted': 'De flesta har röstat',
    'About half the room': 'Ungefär halva rummet',
    'A few have voted': 'Några har röstat',
    'Waiting for the first votes': 'Väntar på de första rösterna'
  }

  window.EllenialLang = {
    lang: lang,
    other: lang === 'sv' ? 'en' : 'sv',
    otherLabel: lang === 'sv' ? 'English' : 'Svenska',
    otherAria: lang === 'sv' ? 'Switch to English' : 'Byt till svenska',
    set: function (l) { try { localStorage.setItem(KEY, l) } catch (e) {} location.reload() },
    missing: function () { return [] }
  }
  window.tx = function (s) { return lang === 'sv' && Object.prototype.hasOwnProperty.call(SV, s) ? SV[s] : s }
  window.tx.has = function (s) { return Object.prototype.hasOwnProperty.call(SV, s) }
})()
