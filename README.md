# Is the algorithm fair? — fairness demo

An interactive, bilingual (NL/EN) phone app for the fairness workshop. Participants
become an abstract persona, send their CV into a hiring "box", and experience three fairness
"thermometers" (counterfactual fairness, statistical parity, equal opportunity) while
voting (optionally on the table, with physical buttons or a vote tablet per round).
The PDF with all the information in the demo can be found in static/.

There are two versions of the app:

| URL      | version                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`      | **workshop**: The default, which is with the full stand (physical persona blocks, colour stickers, vote tablets and paper cards). Default is in Dutch.  |
| `/solo`  | **solo**: The version to do on your own. The app gives you the persona, the vote buttons are on the same screen and every instruction about the stand is left out. Opens in English, switchable to Dutch |
| `/start` | the start page: "by myself" (→ `/solo`) or "as part of a workshop" (→ `/`). Opens in English, switchable to Dutch   |

**Stack:** SvelteKit 2 + Svelte 5 · Supabase (free tier) · Vercel (free tier)
**Libraries:** @neodrag/svelte (drag the CV into the box),
Lucide (icons, and the base of the thermometer, box and globe illustrations), zod (API validation), Fontsource (self-hosted fonts).

---

## 1. Run it locally

```sh
npm install
cp .env.example .env      # optional: without Supabase the app runs in offline mode
npm run dev               # http://localhost:5173
```

Offline mode (no Supabase configured) is fully usable for rehearsing: personas are
random and the results screens say that no votes are available.

Useful scripts:

| command          | what it does                          |
| ---------------- | ------------------------------------- |
| `npm run check`  | Svelte + TypeScript type check        |
| `npm test`       | unit tests (Vitest)                   |
| `npm run format` | format everything with Prettier       |
| `npm run lint`   | Prettier check + ESLint               |
| `npm run verify` | check, lint, test and build in one go |

## 2. Create the Supabase project

1. Create a free project at [supabase.com](https://supabase.com) (region: _West EU (Ireland)_,
   close to the Vercel region `dub1`).
2. Open **SQL Editor**, paste every file in `supabase/migrations/` and run them in order
   of their names (or `npx supabase link` + `npx supabase db push`).
3. Copy **Project URL** and the **Secret key** (Project Settings → API Keys) into `.env`
   as `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.

All tables have Row Level Security enabled without policies: only the app's server can
read or write. The browser never sees a Supabase key.

## 3. Deploy on Vercel

1. Push the project to GitHub and import it in Vercel (framework preset: SvelteKit).
2. Add the environment variables from `.env.example` (Project → Settings → Environment Variables).
3. Deploy, then open `https://<your-app>.vercel.app/api/health`. It should report
   `"database": "ok"`.

## 4. Before every event

- [ ] Set a new `EVENT_ID` (e.g. `2026-10-02-gent`) and redeploy, so votes don't mix with test runs.
- [ ] Open `/api/health`. **Free Supabase projects pause after 7 days without traffic**:
      if it reports an error, un-pause the project in the Supabase dashboard.
- [ ] A new `EVENT_ID` also starts with every persona in the box. To empty the box
      without one (e.g. after a rehearsal): `select public.empty_persona_holds();`
- [ ] Open each vote tablet's link once (see [docs/vote-buttons.md](docs/vote-buttons.md#vote-tablets)),
      tap a test vote and check it appears on that round's results screen.
- [ ] Put a QR code to the app URL on the tables (`/`, the workshop version; share `/start` with
      anyone who wants to try the demo on their own).

## How it works

### The flow

`src/lib/state/steps.ts` lists every screen in order. The page (`src/lib/pages/JourneyPage.svelte`)
renders one step at a time and gives each step its own browser-history entry, so the
phone's back button works. Progress is kept in `sessionStorage`, so a refresh or a
locked phone never loses a participant's place.

### Personas and scores

- `src/lib/data/personas.ts` (from `fairness-workshop-ds.xlsx`) and `src/lib/data/colours.ts`
  contain the lists. Edit them in there.
- The original dataset worked with three sizes, but for clarity (three sizes where difficult to distinguish in the blocks), the demo uses only small and big: the original dataset's medium personas were made large or small, following the algorithm's bias for large groups.
  The "what if" in thermometer 1 only offers sizes someone has.
- Four colours: yellow (+8), green (+4), blue (−4) and red (−8).
- Score = persona base score + colour modifier.
- **Blocks:** participants get a physical block (a shape in a size) at the table and tap
  the same one in the app (`src/lib/domain/blocks.ts`). The app offers every shape and size
  in the persona list. Several personas share a block, so the server picks one of them that is currently not used yet.
- **Persona box:** every persona also exists as a block in one box at the entrance; starting
  participants take one, and whoever finishes throws theirs back in. Postgres mirrors that
  box (`persona_holds`): tapping a block takes a persona of it that nobody is playing, and
  reaching the thanks screen (or starting over) puts it back. Among the personas in the box,
  the one taken out the longest ago goes first, then the order of
  `src/lib/domain/handOutOrder.ts` (alternating low and high scores). A hold expires after
  `PERSONA_HOLD_MINUTES`, so an abandoned phone does not keep a persona for the whole event (although we put that number pretty high);
  when a block's personas are all taken, the one taken out the longest ago is shared. If the
  database is unreachable, a random persona of the block is used so that the demo never blocks.
- **Same crowd for everyone:** the participant only fills in their persona's spot, so the
  applicant pool (and the blind-spot crowd) always holds the same number of each shape and
  size, whatever block they tapped.

### The rounds (`src/lib/domain/rules.ts`, `src/lib/domain/scenario.ts`)

The applicant pool is the 20 personas, the participant's own persona carries their colour
(the others get a display colour only). The top 6 (`INTERVIEW_SLOTS`) get an interview.

| round                                 | what happens                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| het kale algoritme (`bare_box`)       | the highest scores win; you find your place on the table                                                                                                                                                                                                                                                                                                                                               |
| 1 · je vorm alleen (`counterfactual`) | you change one thing (colour, shape or size), your CV goes through the box again and you see whether you would now get an interview. The app offers the change that flips your outcome if there is one, otherwise the one that moves your score most. A changed shape or size keeps your standing: your CV lands at the same relative place among that group's scores in the dataset, plus your colour |
| 2 · gelijk deel (`parity`)            | slots per shape in proportion to how many applicants have that shape, best scores within each shape                                                                                                                                                                                                                                                                                                    |
| 3 · wie het verdient (`opportunity`)  | only qualified applicants; slots per shape in proportion to their qualified count                                                                                                                                                                                                                                                                                                                      |

Each thermometer has a fixed identity colour (1 green, 2 blue, 3 orange, see
`src/lib/data/thermometers.ts`): the colour only serves to easily distinguish between metrics.

The ranking screen asks every pair of thermometers once (`RANKING_ROUNDS`), which
gives 3 questions. Each pair's sides are random, so a preference for the left or
right option averages out across participants.

### The epilogue: beyond fair sorting

After the ranking, six screens (their own chapter of progress dashes) widen the view:

| step           | what it shows                                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `intersection` | you belong to a shape, a size and a colour group at once                                                                                                                                          |
| `blindSpot`    | the participant's own "equal share" outcome per shape × size: fair per shape, yet one subgroup is left out (`src/lib/domain/intersections.ts` picks the worst-served subgroup: intersectionality) |
| `equity`       | the rules gave low-scoring shapes a boost: equality (the same crate for everyone) versus equity (the crates each one needs), toggled on a fence scene                                             |
| `history`      | low scores come from the past the box learned from; the crates help, but the fence is still there                                                                                                 |
| `repair`       | justice: the fence comes down (remove the cause instead of compensating for it)                                                                                                                   |
| `twoWays`      | sort fairly or repair first; participants fill in their paper card and hang it on that side of the board                                                                                          |

The last screen (`thanks`) offers everything the demo explains as a PDF, credits the
research groups (both in `src/lib/data/credits.ts`; one PDF per language, which go in `static/`)
and reminds participants to hand back their block.

### Workshop and solo

The page (`src/lib/pages/JourneyPage.svelte`) runs in one of two modes (`Mode` in
`src/lib/domain/types.ts`); `/` and `/solo` only pick one. Both tell the same story
(`STEPS_BY_MODE`), and each keeps its own progress in `sessionStorage`. The solo version:

- **persona:** the identity screen hands out a random persona (`SoloIdentityStep`) instead of
  asking which block the participant got; the persona box is left alone;
- **votes:** each round's vote screen shows the four answers itself, sent to
  `/api/participant-votes` (see "Who voted what" below);
- **the stand:** no block, sticker, tablet, stamps, bench or arrow. Screens that mention them
  read `journey.mode` and leave those parts out (in `src/lib/i18n`, a screen's `stand` text);
- **two ways forward:** the participant taps their choice instead of hanging a card on the
  board. It is stored as a vote in the poll `two_ways` (`sort` or `repair`).

### Who voted what

Votes from the solo version are cast in the app, so they know their voter: they are stored
with the participant, persona and colour (`station` = `app`, one per participant and poll;
voting again changes it) and shown as that persona. Solo phones report no arrivals.

Votes from shared tablets and buttons carry no identity. When a phone
reaches a round's vote screen it reports an _arrival_ (`/api/arrivals`: its persona and
colour). The results screen shows every vote as the persona of the participant who
arrived closest in time to it (`src/lib/domain/voters.ts`, each arrival used once,
window in `VOTER_ATTRIBUTION_WINDOW`). It is a best guess; a vote without a nearby
arrival is drawn as an outline.

### Timing and downloads

Each phone logs three moments of a participant's run in `participant_events`: `opened`
(the demo opened, or a new participant started over), `finished` (the thanks screen) and
`pdf_download` (the PDF tapped there). Each counts once per participant and is timed by the
phone, so a late delivery does not skew it. The moments wait in an outbox on the phone
(`src/lib/state/eventOutbox.ts`) and go out in the background a few seconds later, batched,
with growing pauses while the wifi is down. The view `participant_durations` puts them
together per participant:

```sql
select count(*) filter (where finished_at is not null) as finished,
       percentile_cont(0.5) within group (order by duration) as median_duration,
       count(*) filter (where downloaded_pdf) as downloaded_pdf
from public.participant_durations
where event_id = '2026-10-02-gent';
```

### Robustness for a crowded room

- The page is prerendered and served from Vercel's CDN; only small API calls hit the server.
- The results screens poll `/api/votes` every 2 seconds and its responses are CDN-cached for
  1 second, so a vote shows up within a few seconds while 30 phones polling the results
  cause at most one database query per rule per second. The ranking screen polls
  `/api/rankings` (everyone's first and second places) the same way.
- The vote tablets register a tap at once and deliver it in the background: votes wait in
  an outbox on the tablet (surviving a reload) until the server confirms them, and their
  own id makes a retry count only once. A double tap is one vote, and a counted vote
  buzzes where the device supports vibration (Android; not iOS).
- Every network call has a timeout and a retry; the results are plain SVG, no chart library.
- Animations respect "reduce motion"; all controls work by tap and keyboard (the CV can be
  dragged into the box _or_ sent with a button, both the first time and in thermometer 1).

## Project structure

```
src/
  lib/
    domain/      pure fairness logic + unit tests (no Svelte, no network)
    data/        persona and colour lists from the spreadsheet
    i18n/        nl.ts (source copy) and en.ts; TypeScript enforces identical keys
    pages/       the demo page, shared by the workshop and solo versions
    state/       the participant's journey (Svelte 5 runes), the list of steps and the drag-into-the-box interaction
    steps/       one component per screen (rules/ for the four rule screens)
    components/  reusable UI: guide "Pim", shapes (with faces), thermometers, applicant rows, vote results, illustrations
    api/         request/response contracts and the browser API client
    server/      Supabase client, env handling, persona rotation, votes, rankings
  params/        route matcher for the round ids
  routes/
    +page.svelte the workshop version
    solo/        the solo version
    start/       the start page: by myself or as part of a workshop
    tablet/      the vote tablet, one page per round
    api/         persona · votes · participant-votes · arrivals · rankings · health
static/                PDF handout, logos, icons
supabase/migrations/   database schema
docs/                  vote-button integration
```

## Configuration

`src/lib/config.ts` holds the tunables: number of interview slots, the rows of the vote
results, which thermometers are ranked and how often each pair is asked, and polling/timeouts.
