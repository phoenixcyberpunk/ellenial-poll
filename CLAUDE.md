# ellenial poll — Project Guide

Read this first in every session. English-language poll app under **Ellenial**. Project notes and decisions also live in the claude.ai Project "Ellenial Poll" (`claude/ellenial-poll-project.md`). Approved mock-ups: https://claude.ai/artifact/GHvJP1rQrt6BtwVLBR7qm2

## Infrastructure
- **Code:** GitHub `phoenixcyberpunk/ellenial-poll` (public, AGPL-3.0).
- **Hosting:** Vercel team "The Ellenial Project" (`the-ellenial-project`), project `ellenial-poll`, domain `poll.ellenial.app`.
- **Live connection:** Supabase project `gillefeeling` (ref `knvrvmqdxvcatsrvkrgx`), **Realtime broadcast only**: no tables, no functions, no migrations. Channel `poll:<roomId>`, event `m`, payload `{ b: "1." + base64url(iv‖ciphertext) }`. HKDF salt/info and AAD prefix `ep1|`.
- **Stack:** plain HTML/CSS/JS, no build. `vendor/` and `fonts/` copied from ellenial quiz.
- **Shared live room:** `ellenial-room.js` (window.EllenialRoom) is the quiz's encrypted broadcast engine pulled out into one reusable file, like `ellenial-theme.js`. Other apps (the turn queue first) copy it unchanged and pick their own `app` prefix and crypto `tag`. Quiz still has its own inline copy for now.

## Decisions (3 Nov 2026)
- Own app, like the quiz; listed in the ellenial.app library. Not a mode inside Quiz.
- Anonymous only. Names may come later if real users ask.
- Turnout: five-step bar (fills 0/1/3/4/5 segments) + words, as a share of phones seen in the last 40 s (plus everyone who voted). Never a number.
- Results: rounded percentages, never names or counts. All in `resultsFor()`; keep it the single place for these rules.
  - While open: live shares only from 5 votes (so nobody can match a bar jump to whoever just tapped), or hidden entirely if the host chose "Hide results until I close".
  - At close (Ellen, 4 Nov, replaces the 3 Nov top-pick-only rule): show the shares however few voted. People can see they're too few to be anonymous; no "Small group" setting. The explainer says so honestly. NOT BUILT YET: v1 still shows only the top pick at 2–4 votes.
- One vote per phone (localStorage `ep:voted:<roomId>`, pid in `ep:pid:<roomId>`), honour-based and said openly. Votes are final.
- Host can save the result as a PNG (canvas, share sheet on phones, download elsewhere). Ending sends `end` and the room is gone.
- Room name (4 letters from the room id) is only a visual check; joining needs the link/QR (a typed code would need a server lookup).

## Brand
- Final Ellenial brand, no exceptions: same tokens, fonts and theme switch as ellenial quiz (see its CLAUDE.md). Theme key `ep:theme-pref`. Test with `?theme=light|dark`. Copy in first person ("I").
- Accessibility: text ≥ 4.5:1, controls ≥ 3:1, never colour alone (✓ Picked, ✓ Most picked, words on the turnout bar).

## Testing
- Local: serve with `/join` rewritten to `index.html`, open with `?local`. Each phone needs its own localStorage for its own pid (in Playwright: clear localStorage per page).
- 3 Nov 2026: Playwright, 6 phones (pick one) and 3 phones (yes/no/maybe), dark and light: turnout steps, shares at 6 votes, top pick only at 3, phone results after close, end closes phones. No console errors except the missing favicon.
- The workspace cannot reach supabase.co: live tests happen in Ellen's browser.

## Open
- Build the 4 Nov results rule plus the host choices (change vote, hide until close at creation) once Ellen approves mock-ups 5 and 6.
- Change your vote (Ellen, 3 Nov): host decides at creation whether votes can be changed. Not built; v1 votes are final. When built: a changed vote replaces the old one (still one per phone), "Change my vote" only when allowed, and the poll kind is shown on the vote screen.
- App icon (Ellen's own art, per the Ellenial icon template) and manifest.
- Listing on ellenial.app.
- Pentest along with the other apps (public broadcast channel is encrypted but floodable).

## Status
- 2026-11-03: v1 built and tested locally (Playwright, see Testing), pushed to `main`, Vercel project `ellenial-poll` created (auto-deploys from `main`), live at poll.ellenial.app. Waiting for Ellen's live test with real phones (the workspace can't reach Supabase). Not listed on ellenial.app yet. Paused by Ellen at 14:24: looks good on the phone.
