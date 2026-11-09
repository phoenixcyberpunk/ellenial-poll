# ellenial poll — Project Guide

Read this first in every session. Poll app under **Ellenial**, English and Swedish. Project notes and decisions also live in the claude.ai Project "Ellenial Poll" (`claude/ellenial-poll-project.md`). Approved mock-ups: https://claude.ai/artifact/GHvJP1rQrt6BtwVLBR7qm2

## Infrastructure
- **Code:** GitHub `phoenixcyberpunk/ellenial-poll` (public, AGPL-3.0).
- **Hosting:** Vercel team "The Ellenial Project" (`the-ellenial-project`), project `ellenial-poll`, domain `poll.ellenial.app`.
- **Live connection:** Supabase project `gillefeeling` (ref `knvrvmqdxvcatsrvkrgx`), **Realtime broadcast only** for the poll: no poll tables or data. **Exception (9 Nov 2026):** a daily visit counter for Ellen's Ongoing board: `api/visit.js` (Vercel function) calls `public.poll_count_visit()` once per phone per Stockholm day, which can only add 1 to `ellenial_poll.daily_visits` (migration in `supabase/migrations`). The page side is `countVisit()` at the end of `app.js`, real address only. The help text says so openly. Channel `poll:<roomId>`, event `m`, payload `{ b: "1." + base64url(iv‖ciphertext) }`. HKDF salt/info and AAD prefix `ep1|`.
- **Stack:** plain HTML/CSS/JS, no build. `vendor/` and `fonts/` copied from ellenial quiz.
- **Shared live room:** `ellenial-room.js` (window.EllenialRoom) is the quiz's encrypted broadcast engine pulled out into one reusable file, like `ellenial-theme.js`. Other apps (the turn queue first) copy it unchanged and pick their own `app` prefix and crypto `tag`. Quiz still has its own inline copy for now.

## Decisions (3 Nov 2026)
- Own app, like the quiz; listed in the ellenial.app library. Not a mode inside Quiz.
- Anonymous only. Names may come later if real users ask.
- Turnout: (3 Nov) five-step bar + words, never a number. (8 Nov, Ellen: "as a host I would be able to see exactly how many has joined and voted") The host screen now has a Statistics card instead: joined (every phone seen), here now (seen in the last 40 s), voted, not voted yet, and changed votes when changing is on. Phones never show a number.
- Results: what phones get is rounded percentages, never names or counts, all in `resultsFor()` (keep it the single place for these rules). (8 Nov, Ellen: "Host should be able to see/save both votes and shares") The host's own copy adds per-option counts (`withCounts`/`hostResults`, never broadcast): live list, closed list, kicker "5 of 6 voted", and the host's picture and PDF. Counts add nothing the shares don't once the total is known (57 % of 7 is 4); the 5-vote live threshold and hide-until-close still apply. Explainer point 1, help step 3 and the host privacy line say the host sees how many and for what, never who.
- Known, older than this: the state broadcast carries the lists of phone ids that joined and voted (`seen`, `got`), so a technical voter could count turnout from the encrypted payload. No per-option counts are ever sent.
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
- Every word on screen lives in the `T` table (`en`, `sv`); `t()` gives the current one. Nothing user-facing outside it.
- Same pattern as ellenial bingo: the saved choice (`ep:lang`) wins, else the phone's language (sv/nb/nn/no/da → Swedish, else English). A "Svenska" / "English" pill sits top-right next to the "?" (`langButton`), on every screen except the host's live and results screens.
- Each phone has its own language. The poll's own words are set by the host when it opens: yes / no / maybe becomes Ja / Nej / Kanske in a Swedish host's poll, and stays so for every phone.
- Swedish uses "värd" for host and "omröstning" for poll.

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
- (Done 8 Nov) App icon: Ellen's drawing (bar chart with little people) on a mint `#CBE7E4` tile, no name; favicon + apple-touch icon added. Home-screen name "Poll", tab "Poll · Ellenial", header has a small "Ellenial" above "Poll". A manifest is still missing.
- Pentest along with the other apps (public broadcast channel is encrypted but floodable). 8 Nov: host broadcasts are now coalesced (`queueState`, max one per 500 ms) so phones can't make the host flood the shared Supabase project. Still open: anyone with the link can add fake phones up to the 300 cap (honour-based, said openly).

## Status
- 2026-11-03: v1 built and tested locally (Playwright, see Testing), pushed to `main`, Vercel project `ellenial-poll` created (auto-deploys from `main`), live at poll.ellenial.app. Waiting for Ellen's live test with real phones (the workspace can't reach Supabase). Not listed on ellenial.app yet. Paused by Ellen at 14:24: looks good on the phone.
- 2026-11-07: Listed and linked on ellenial.app as Alpha. TRADEMARK.md added (the Ellenial name and logo are not covered by the code licence). Next gate: onboarding ('how it works in 3 steps', shared with Quiz and Party games) and the real-phone test.
- 2026-11-08 (late): Ellen approved the Swedish screens and mock-ups 7–9. English + Swedish and Keep the result (picture + PDF on every phone) merged to main and deployed.
- 2026-11-08: Ellen approved mock-ups 5 and 6. Built and deployed: Poll rules card (change vote, hide until close) on Make a poll, fixed hidden line on the host view, changeable votes, the 4 Nov results rule, explainer point 3 and the trimmed results note. Ship check (beta gate) run the same day: see the claude.ai Project notes.
- 2026-11-08 22:01: a parallel Swedish version (branch `i18n`, another chat) was merged by mistake on top of the language work already on `main`; the merge left conflict markers live for about 20 seconds, then was undone (`8a92ab6`, `a4ce91c`). Main is exactly `6d3d8ef` again. Branch `i18n` is not used; delete it when convenient.
- 2026-11-08 22:04: Ellen: as host she doesn't need "No names, ever". Make a poll now shows a host line (`hostPrivacy`, EN + SV): "Anonymous voting: as host you only see the result as shares. The poll and its result disappear when you close the room." Phones keep the voter line. Her wording said "when voting closes"; changed to "when you close the room", since the result stays on screen (and can be saved) after voting closes.
- 2026-11-08 22:15: host statistics and counts built (mock-up shown and approved in chat), tested with 6 phones in Swedish/dark and English/light: stats update live, one changed vote counted, counts on the host's lists, kicker, PDF and picture; phones and their picture show shares only; axe 0, no errors.
