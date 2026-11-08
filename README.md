# poll, by Ellenial

A free, quick poll for any room: friends, a team, an association, a classroom. The host opens a poll on their phone or laptop, everyone votes on their own phone, and the result shows when the host closes it.

Play at **https://poll.ellenial.app**

Part of [Ellenial](https://ellenial.app): free tools made by people, for people. No account, no ads, nothing tracked.

## How private is it?

- **No names, ever.** Votes are anonymous; nobody, me included, can see who voted for what.
- **Votes pass through, never saved.** Phones talk to the host's screen through Supabase Realtime *broadcast*. There is no table and nothing is stored. Every message is encrypted on the device (AES-GCM, key derived with HKDF from a random secret). The secret only lives in the join link after `#`, which browsers never send to a server, so not even Supabase can read the question or the votes.
- **Nobody sees a vote move.** While the poll is open, shares only show once 5 people have voted, so nobody can match a bar jump to whoever just tapped. When the host closes, the shares show however few voted: in a small group you can see for yourselves how few you are. The host can also choose to hide results until they close.
- **Turnout, never counts.** The host sees a five-step bar with plain words ("A few have voted", "About half the room"…), as a share of the phones in the room.
- **One vote per phone, on trust.** The phone remembers that it voted (localStorage). If the host allowed it when making the poll, people can change their vote until it closes; the new vote replaces the old one. Someone could cheat with another browser; I'd rather trust you than track you.
- When the host ends the poll or closes the tab, everything is gone. Anyone in the room can keep the result first, as a picture or a one-page PDF, made on their own phone and saved only there. Phones keep showing the final result until they leave the page.
- **English and Swedish.** Each phone picks its own language (the phone's setting first, then a Svenska / English switch).

## How it works

- A plain web app: HTML, CSS and JavaScript, no build step, no framework. The live room is the same engine as [ellenial quiz](https://github.com/phoenixcyberpunk/ellenial-quiz).
- Join link: `/join#<roomId 22>.<secret 43>`. The four-letter room name (e.g. `QZGC`) is only there so people can see they're in the same room; joining needs the link or QR code.
- Protocol (all encrypted, channel `poll:<roomId>`, event `m`):
  - phone → host: `{t:'hello', pid}` (every 3 s until seen, then every 15 s), `{t:'vote', pid, a, n}` (`a` = option index, or an array for pick-any; `n` = the phone's vote version, so a changed vote replaces the old one and a late resend can't undo it)
  - host → all: `{t:'state', phase, poll, seen, got, gv, res}` (`poll.change` says whether votes can be changed; `gv` = each phone's latest vote version, only when changing is allowed) on every change and every 4 s; `{t:'end'}`
  - `res` is computed by the host under the privacy rules above (`resultsFor` in `app.js`); phones never receive counts.
- Poll kinds: pick one, yes / no / maybe, pick any (shares are the share of voters who picked each option).
- Limits: 300 phones per room for now (free tier); the protocol itself doesn't cap it.

| Path | What it is |
| --- | --- |
| `index.html`, `styles.css`, `app.js` | The app |
| `ellenial-room.js` | The shared encrypted live room (from ellenial quiz), reusable by other Ellenial apps |
| `ellenial-theme.js` | Shared Ellenial Auto / Light / Dark switch, unchanged from ellenial maps |
| `vendor/` | supabase-js (bundled to one file) and qrcode-generator, both MIT, served from this site |
| `fonts/` | Self-hosted Fraunces and DM Sans with their licences |

## Run it locally

Any static server that sends `/join` to `index.html`. For testing without Supabase, add `?local` on localhost: tabs then talk through `BroadcastChannel` instead.

## Running cost

A static site on Vercel's free tier plus Supabase's free tier (shared with my other apps). Close to zero, stated openly as all Ellenial apps do.

## Credits

- Product and design: Ellen Nilsson. Code: written with Claude.
- Fonts: Fraunces (The Fraunces Project Authors) and DM Sans (The DM Sans Project Authors), SIL OFL 1.1, via Fontsource.
- [supabase-js](https://github.com/supabase/supabase-js) (MIT), [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) by Kazuhiko Arase (MIT).

## Licence

AGPL-3.0-only, the same as the Ellenial site. See `LICENSE`.

The Ellenial name and logo aren't covered by the code licence, see [TRADEMARK.md](TRADEMARK.md).
