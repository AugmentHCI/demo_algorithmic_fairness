# Sending votes from the physical buttons

The results screens ("Dit is wat anderen vonden") show the votes stored in the
Supabase table `public.votes`. The buttons on the table can write there in two ways.

## Option A — through the app (recommended)

`POST https://<your-app>.vercel.app/api/votes`

```http
Authorization: Bearer <VOTE_INGEST_TOKEN>
Content-Type: application/json

{ "rule": "bare_box", "choice": "very_unfair", "station": "table-1" }
```

| field     | values                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------ |
| `rule`    | the round: `bare_box`, `counterfactual`, `parity` or `opportunity`                                     |
| `choice`  | `very_unfair`, `unfair`, `fair` or `very_fair` (zeer oneerlijk → zeer eerlijk)                         |
| `station` | optional, free text (max 64 chars) to tell tables apart                                                |
| `id`      | optional UUID chosen by the sender; a vote with an `id` already stored is ignored, so retries are safe |

Responses: `201` stored · `400` invalid body · `401` wrong token · `503` Supabase or
token not configured. The vote is stored under the deployment's `EVENT_ID`.

Test from a terminal:

```sh
curl -X POST https://<your-app>.vercel.app/api/votes \
  -H "Authorization: Bearer $VOTE_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rule":"bare_box","choice":"fair","station":"test"}'
```

## Option B — directly into Supabase

Insert rows into `public.votes` with the Supabase REST API and the **secret** key
(Row Level Security blocks the public key on purpose):

```sh
curl -X POST "https://<project-ref>.supabase.co/rest/v1/votes" \
  -H "apikey: $SUPABASE_SECRET_KEY" \
  -H "Authorization: Bearer $SUPABASE_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event_id":"2026-10-02-gent","rule":"bare_box","choice":"unfair"}'
```

Make sure `event_id` matches the `EVENT_ID` of the deployment, otherwise the votes
will not show up in the app.

## Which rule is being voted on?

Participants vote once per rule, in this order: `bare_box` (het kale algoritme) →
`counterfactual` (thermometer 1, je vorm alleen) → `parity` (thermometer 2, gelijk deel)
→ `opportunity` (thermometer 3, wie het verdient). The button box needs to know which
round it is in, e.g. with a small round selector or one set of buttons per rule.

The results screen shows each vote as the persona of the participant who most likely
cast it: the one whose phone reached that round's vote screen closest in time (see
"Who voted what" in the README). Votes sent straight into Supabase are matched the same
way, as long as `created_at` is the moment of the vote.

"Twee manieren vooruit" at the end is answered on paper (participants hang their card
on one side of the board), so it needs no buttons or tablet.

## Vote tablets

Instead of (or next to) physical buttons, a tablet can show the four buttons for one
round. Each tablet sends its votes through Option A, so they appear on that round's
"Dit is wat anderen vonden" screen within a few seconds.

| round                            | tablet page              |
| -------------------------------- | ------------------------ |
| het kale algoritme               | `/tablet/bare_box`       |
| thermometer 1 · je vorm alleen   | `/tablet/counterfactual` |
| thermometer 2 · gelijk deel      | `/tablet/parity`         |
| thermometer 3 · wie het verdient | `/tablet/opportunity`    |

**Setup, once per tablet:** open any tablet page and fill in the tablet password,
`fti-demo` (set `TABLET_PASSWORD` in Vercel to change it). The tablet remembers it for all
four pages, also after a reload, so the plain links (or home-screen shortcuts) are enough
after that. If the password is changed later, the tablet asks for the new one and keeps
its votes until then.

Opening `/tablet/<round>#token=<VOTE_INGEST_TOKEN>` works too and skips the question.

- **Fast:** a tap counts on screen immediately; the vote is sent in the background.
- **Feel:** every counted vote gives a short buzz on tablets that support vibration
  (Android). iPads and iPhones offer websites no vibration, so there only the screen
  reacts.
- **Double taps:** presses less than 0.6 s apart count as one vote
  (`TABLET_DOUBLE_PRESS_MS` in `src/lib/config.ts`).
- **No wifi:** a tablet that opened its page once keeps an offline copy of all four tablet
  pages, so it also loads and asks for the password without wifi. A password entered
  offline is accepted straight away and checked once the wifi is back; if it was wrong,
  the tablet asks again and keeps the votes. Open each tablet page once on the venue
  wifi (or before) to be safe.
- **Bad wifi:** votes that cannot be sent wait on the tablet (also across a reload) and
  are retried until the server confirms them; the page then shows how many are waiting.
  Each vote has its own id, so a retry is never counted twice.
- **Wrong password:** the page asks for it again; the votes are kept until it is right.
- The screen stays on while the page is open, where the browser allows it.
- Votes are stored with `station` set to `tablet-<round>`.
