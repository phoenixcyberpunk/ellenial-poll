# ellenial poll — Project Guide

<<<<<<< HEAD
Read this first in every session. Poll app under **Ellenial**, English and Swedish. Project notes and decisions also live in the claude.ai Project "Ellenial Poll" (`claude/ellenial-poll-project.md`). Approved mock-ups: https://claude.ai/artifact/GHvJP1rQrt6BtwVLBR7qm2
=======
Read this first in every session. Poll app in English and Swedish, under **Ellenial**. Project notes and decisions also live in the claude.ai Project "Ellenial Poll" (`claude/ellenial-poll-project.md`). Approved mock-ups: https://claude.ai/artifact/GHvJP1rQrt6BtwVLBR7qm2
>>>>>>> i18n

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
  - At close (Ellen, 4 Nov, replaces the 3 Nov top-pick-only rule): show the shares however few voted. People can see they're too few to be anonymous; no "Small group" setting. The explainer says so honestly. 0 votes: "No votes came in". Built 8 Nov.
- One vote per phone (localStorage `ep:voted:<roomId>`, pid in `ep:pid:<roomId>`, vote version in `ep:vn:<roomId>`), honour-based and said openly.
- Host choices on Make a poll, in a "Poll rules" card (mock-ups 5 and 6, approved 8 Nov): "Let people change their vote" (on by default, as in the mock-up) and "Hide results until I close" (off by default). Neither can be changed once the poll is open; the host view shows a fixed "Results hidden until I close" line. A changed vote replaces the old one: phones send `n` (version), the host keeps the highest per phone and broadcasts `gv` so phones know it arrived. The vote screen shows "✓ You can change your vote" or "Votes are final".
- Keep the result (mock-ups 7–9, approved 8 Nov): the host and every voter get "As a picture" / "As a PDF" on the closed screen. Both are made on the phone and handed over by `handOver` (share sheet, else download); nothing is sent anywhere. After the host ends the room, a phone keeps showing the final result and the two buttons (from `room.state`, in memory only) until the page is left. Ending sends `end`.
- PDF: `drawPdfPage` draws one A4 page (595×842 pt at 2.5×) on white, Bingo's print palette; `buildPdf` is ellenial bingo's hand-written PDF trimmed to one page and one JPEG. Date/time of closing in the phone's language, kind of poll + turnout words (`T.done`, host sends `step`, never a number), shares with bars, "✓ Most picked", footer "A quick poll, shown in shares" (Ellen's wording, 8 Nov).
- Room name (4 letters from the room id) is only a visual check; joining needs the link/QR (a typed code would need a server lookup).

## Help "?" (8 Nov 2026)
- Shared `ellenial-help.js` + `.css` copied unchanged from ellenial-bingo. "?" sits top-right on every screen (`topBar` adds it), opens "How it works" in 3 steps. Replaced the old "How this works" link; `howView` (the privacy page) is now the sheet's "More about privacy" link, offered only when no room is running so the host is never pulled out of a live poll.
- Ellen (8 Nov): every Ellenial app must be in English and Swedish. Help step 3 updated 8 Nov to the new results rule (EN + SV).

## Languages (8 Nov 2026)
<<<<<<< HEAD
- Every word on screen lives in the `T` table (`en`, `sv`); `t()` gives the current one. Nothing user-facing outside it.
- Same pattern as ellenial bingo: the saved choice (`ep:lang`) wins, else the phone's language (sv/nb/nn/no/da → Swedish, else English). A "Svenska" / "English" pill sits top-right next to the "?" (`langButton`), on every screen except the host's live and results screens.
- Each phone has its own language. The poll's own words are set by the host when it opens: yes / no / maybe becomes Ja / Nej / Kanske in a Swedish host's poll, and stays so for every phone.
- Swedish uses "värd" for host and "omröstning" for poll.
=======
- `ellenial-lang.js` (loaded before app.js, not deferred): the code is written in English and every visible text goes through `tx('English text')`; the file holds the Swedish dictionary keyed by the English. Add a new text = wrap it in `tx()` AND add its Swedish there.
- Language = `?lang=sv|en` (testing, not saved) → saved choice `ep:lang` → the phone's language (sv, nb, nn, no, da give Swedish). So every phone in a room reads its own language.
- The switch ("Svenska" / "English") sits only on Make a poll, because switching reloads the page; a running room is never reloaded. The typed draft survives the reload via sessionStorage `ep:draft`.
- Yes / No / Maybe options are written in the host's language when the poll opens.
- Tested 8 Nov in Playwright, Swedish phone: create, switch and back (draft kept), host, phone vote, close, results on both, help sheet. No English left, axe 0, no errors. English phone gets English.
>>>>>>> i18n

## Brand
- Final Ellenial brand, no exceptions: same tokens, fonts and theme switch as ellenial quiz (see its CLAUDE.md). Theme key `ep:theme-pref`. Test with `?theme=light|dark`. Copy in first person ("I").
- Accessibility: text ≥ 4.5:1, controls ≥ 3:1, never colour alone (✓ Picked, ✓ Most picked, words on the turnout bar).

## Testing
- Local: serve with `/join` rewritten to `index.html`, open with `?local`. Each phone needs its own localStorage for its own pid (in Playwright: clear localStorage per page).
- 8 Nov 2026 (saving): Playwright, dark English and light Swedish, 7 and 2 voters: host and voter get both buttons, the voter's kicker shows turnout words, PDF is one A4 page that opens in pdftoppm/pdfinfo with the right title, the picture is a PNG, and after the host ends the room the result and buttons stay and the PDF still saves. All passed.
- 8 Nov 2026 (Swedish): Playwright with a Swedish-language phone, dark and light: opens in Swedish by itself, switching keeps a typed question, no switch on the live host screen, Ja/Nej/Kanske reach every phone, an English phone in a Swedish poll sees English screens, a phone can switch mid-poll, Swedish results. All passed.
- 8 Nov 2026: Playwright (`/usr/bin/google-chrome`), dark and light: 6 phones pick-one with change on (live shares from 5, a changed vote moves the shares, old pick pre-selected), 3 phones yes/no/maybe with change off and hide on (fixed hidden line, "Votes are final", no change button, shares at close), 0 votes ("No votes came in"), 2 phones with a change (nothing moves while open, shares at close). All passed; only the missing favicon 404.
- 3 Nov 2026: Playwright, 6 phones (pick one) and 3 phones (yes/no/maybe), dark and light: turnout steps, shares at 6 votes, top pick only at 3, phone results after close, end closes phones. No console errors except the missing favicon.
- The workspace cannot reach supabase.co: live tests happen in Ellen's browser.

## Open
- Live test with real phones of the 8 Nov build.
- App icon: Ellen has made it (8 Nov), adding it soon. Then manifest and favicon.
- Pentest along with the other apps (public broadcast channel is encrypted but floodable). 8 Nov: host broadcasts are now coalesced (`queueState`, max one per 500 ms) so phones can't make the host flood the shared Supabase project. Still open: anyone with the link can add fake phones up to the 300 cap (honour-based, said openly).

## Status
- 2026-11-03: v1 built and tested locally (Playwright, see Testing), pushed to `main`, Vercel project `ellenial-poll` created (auto-deploys from `main`), live at poll.ellenial.app. Waiting for Ellen's live test with real phones (the workspace can't reach Supabase). Not listed on ellenial.app yet. Paused by Ellen at 14:24: looks good on the phone.
- 2026-11-07: Listed and linked on ellenial.app as Alpha. TRADEMARK.md added (the Ellenial name and logo are not covered by the code licence). Next gate: onboarding ('how it works in 3 steps', shared with Quiz and Party games) and the real-phone test.
- 2026-11-08 (late): Ellen approved the Swedish screens and mock-ups 7–9. English + Swedish and Keep the result (picture + PDF on every phone) merged to main and deployed.
- 2026-11-08: Ellen approved mock-ups 5 and 6. Built and deployed: Poll rules card (change vote, hide until close) on Make a poll, fixed hidden line on the host view, changeable votes, the 4 Nov results rule, explainer point 3 and the trimmed results note. Ship check (beta gate) run the same day: see the claude.ai Project notes.
- 2026-11-08: Swedish added on branch `i18n` (preview); Ellen said go 8 Nov 22:01 with no changes, merged to `main` and live.
