# Consented Self-Logging Test Plan — Pokie Analyzer App

**Status:** draft for legal review
**Owner:** Pokie Analyzer project lead
**Goal:** produce a small (~30–60 hours), defensible, real-feel dataset that
the lawyer and the regulator (OLGR) can trust, captured *only* from the
project lead and consenting family members playing on their own money,
without involving any venue, third-party patron, or unconsented person.

> This plan is the **third leg** of the demo-data strategy:
> 1. RTP-accurate simulator (`lib/spinSimulator.js`) — large-N synthetic data.
> 2. Public QLD OLGR monthly CSV (`lib/olgrLoader.js`) — context graphs.
> 3. **Consented self-logged sessions** (this document) — small, real, lawful.
>
> Together these give the regulator a layered evidence pack without
> requiring unsupervised live capture in a venue.

---

## 1. Scope and non-scope

### In scope
- Sessions played by the **project lead** and **explicitly consenting adult
  family members** on their own money, in venues they would normally visit.
- Logging of **only the data fields** the player can see on the screen in
  front of them (balance, bet, lines, win, bonus trigger).
- Aggregation of those logs into the same record shape the simulator emits
  (`machineName`, `denomination`, `betAmount`, `lines`, `totalBalance`,
  `winAmount`, `bonusHit`, `spinsSinceBonus`, `timestamp`), so they can flow
  through the existing `SpinHistory` and `heatAnalysis` pipelines unchanged.

### Out of scope (do not do)
- Recording, photographing, or filming **any other patron** in a venue.
- Recording **any audio** at any time.
- Capturing **the venue interior**, staff, machine internals, security
  cameras, or anything other than the player's own machine screen.
- Capturing **other people's machines** or their play.
- Sharing raw screen captures with anyone outside the consenting tester
  group.
- Telling venue staff the test is happening (it is the participant's
  personal play; no venue involvement is needed *or* permitted under this
  plan).
- Using any form of automated input or machine modification.

---

## 2. Legal and policy frame

The plan is designed to fit inside the limits of:

- **Gaming Machine Act 1991 (Qld)** — players may observe and note their
  own play; they may not modify, attach to, or interfere with the machine.
- **Surveillance Devices Act 2007 (Qld)** — no audio recording; visual
  capture limited to the participant's own screen, no third parties.
- **Privacy Act 1988 (Cth)** and the Australian Privacy Principles —
  participants are identified only by an opaque participant ID; no name,
  address, DOB, or contact info stored alongside session data.
- **Venue licence conditions** — most venues prohibit photography/video
  on the gaming floor. The protocol therefore uses **manual entry**
  (typed into the app on the participant's own phone) as the default
  capture mode. Photo capture is opt-in per venue and only of the
  participant's own machine, with an immediate destroy-after-extract
  step.

**Before any session is run, this plan must be reviewed and signed off
by a gambling-regulatory-experienced Queensland lawyer.** Nothing in this
document is legal advice.

---

## 3. Participants

### Eligibility
- 18 years or older.
- Existing recreational pokie player (this study creates **no new** play).
- Has read and signed the participant information sheet and consent form
  (templates in §10).
- Not currently on any voluntary self-exclusion register.
- Not financially or emotionally dependent on the project lead in a way
  that could compromise consent.

### Cap and recruitment
- **Maximum 6 participants** (project lead + up to 5 family members).
- Recruited only by direct conversation; no public callout.
- Each participant may withdraw at any time, with all of their data
  deleted on request.

### Harm-minimisation safeguards (binding on every participant)
- Hard **session loss cap** of $50 per session, configured up-front in
  the app's pre-commitment screen.
- Hard **monthly loss cap** of $200 per participant.
- Hard **session length cap** of 90 minutes; the app's reality-check
  prompt fires every 30 minutes.
- No "chasing" sessions: a session ended by hitting the loss cap closes
  participation for that day.
- The project lead checks in with each participant after every session
  and weekly thereafter.
- If any participant shows signs of distress, the protocol is paused
  for that participant and Gambling Help Queensland (1800 858 858) is
  proactively offered.

---

## 4. Capture method

### Primary: manual entry on the participant's own phone
- Participant opens the Pokie Analyzer app and taps **Start Session**.
- For each spin (or, more realistically, each **batch** of 5–10 spins),
  the participant enters the visible numbers via the existing
  `DataEntryForm` component:
  `denomination`, `betAmount`, `lines`, `totalBalance`, `winAmount`,
  `bonusHit`, `spinsSinceBonus`.
- A **session note** field allows the participant to record context
  (e.g. "noisy floor", "switched machines", "bonus felt overdue").

### Optional: still-photo of own machine screen (opt-in)
- Only if the venue's posted house rules do **not** prohibit phone use
  at the machine.
- A single still photo of the participant's **own** machine screen,
  taken with the app's `AIVideoCapture` component in `still` mode.
- The on-device `recordingPolicy` guard (`data/recordingPolicy.js`)
  must report `GUARD_STATUS.OK` — i.e. no person detected, no venue
  interior, single machine only.
- Numeric fields are extracted by OCR; the raw image is **discarded
  within 5 seconds of extraction** and never written to permanent
  storage. This matches the existing `POLICY.rawFramesDiscarded` flag.

### Forbidden capture modes
- Continuous video.
- Audio of any kind.
- Photos that include any other patron, any staff member, any other
  machine, or any identifying venue signage.
- Screenshots of other players' loyalty cards, bank cards, or phones.

---

## 5. Data model

Each logged spin matches the existing app spin record:

| Field | Source | Notes |
|---|---|---|
| `participantId` | Generated (UUID v4) at enrolment | Opaque; not linked to name in any stored file |
| `sessionId` | Generated at session start | UUID v4 |
| `machineName` | Participant selects from `data/qldVenues.js#ALL_QLD_MACHINES` | Free-text fallback allowed |
| `venueLga` | Participant selects from OLGR LGA list | Coarse; never the venue address |
| `denomination` | Manual / OCR | One of `DENOMINATIONS` |
| `betAmount` | Manual / OCR | One of `BET_AMOUNTS` |
| `lines` | Manual / OCR | One of `LINE_OPTIONS` |
| `totalBalance` | Manual / OCR | $ AUD |
| `winAmount` | Manual / OCR | $ AUD; `0` for a non-winning spin |
| `bonusHit` | Manual | Boolean |
| `jackpotTier` | Manual (if applicable) | Mini / Minor / Major / Grand |
| `spinsSinceBonus` | Computed | Reset to 0 on a `bonusHit` |
| `timestamp` | Device clock at entry | ms since epoch |
| `consented` | Always `true` | Flag the analytics pipeline can assert on |
| `simulated` | Always `false` | Distinguishes from simulator output |

**Explicitly never captured:** participant name, DOB, address, email,
phone number, payment method, loyalty card number, machine serial
number, or the **specific venue identity** (only LGA + suburb).

---

## 6. Storage, retention, and security

- **On device:** `localStorage` under the existing `pokie-session-state`
  key (per `lib/sessionManager.js`), encrypted at rest using
  `lib/dataEncryption.js`.
- **Off-device sync:** disabled for the duration of this plan. No
  Supabase upload, no analytics beacon, no third-party SDK calls
  carry session data. Participants confirm before each session that
  their device is not screen-mirroring.
- **Retention:** 12 weeks from collection, then automatic deletion.
  Any participant may request immediate deletion of all of their
  records by sending a one-line message to the project lead.
- **Export for the lawyer / regulator briefing:** a single CSV is
  produced per briefing, with `participantId` replaced by a new
  per-export pseudonym so re-identification across briefings is not
  possible.
- **Backups:** none. The dataset is small enough that loss of a device
  simply ends that participant's contribution; recreating a "lost"
  session from memory is forbidden.

---

## 7. Target dataset (the 30–60 hour figure)

| Variable | Target |
|---|---|
| Sessions per participant | 6 – 10 |
| Session length | 30 – 90 minutes |
| Spins per session (typical) | 200 – 600 |
| Total participants | 2 – 6 |
| **Total play time** | **30 – 60 hours** |
| **Total spins** | **~6 000 – 20 000** |
| Distinct machines covered | ≥ 8 |
| Distinct venues (LGA + suburb only) | ≥ 3 |

This is **not** a statistically powered study — RTP convergence comes from
the simulator. The self-logged set exists to demonstrate *real-world feel*
(timing patterns, bet-size adjustment behaviour, bonus-chasing patterns)
that the simulator deliberately does not model.

---

## 8. Schedule

| Week | Activity |
|---|---|
| 0 | Lawyer review of this plan and the consent form |
| 0 | Lawyer-approved final version checked into `docs/` |
| 1 | Project lead self-runs 2 pilot sessions, end-to-end |
| 1 | Adjust forms / friction points based on pilot |
| 2 | Recruit and brief family participants 1-on-1 |
| 2 | Sign consent forms; issue participant IDs |
| 3 – 6 | Sessions run, weekly check-in calls |
| 7 | Data freeze; produce briefing CSV + chart pack |
| 7 | Brief OLGR (informal pre-engagement, with lawyer) |
| 8+ | If OLGR responds positively, *only then* approach the local MP |

---

## 9. Reporting

The end-of-period briefing pack contains, at most:

1. A one-page methodology summary (this document, condensed).
2. The simulator's calibration report (RTP, hit frequency, bonus rate).
3. OLGR public-data charts via `lib/olgrLoader.js#aggregateByLga` and
   `topVenues` — labelled clearly as **OLGR public data**.
4. Self-logged charts produced from the consented dataset, labelled
   clearly as **consented participant data, n = X participants,
   Y sessions, Z spins**.
5. The signed consent forms, redacted of names, available on request
   to the regulator.
6. A statement of what was **not** done (no patron capture, no audio,
   no venue cooperation, no automated scraping).

---

## 10. Templates

### 10.1 Participant information sheet (summary)
- What the project is and why it is being built.
- Exactly what data will be recorded (the table in §5).
- Exactly what will *not* be recorded (the list in §1 "Out of scope").
- Storage, retention, deletion-on-request.
- Risks: this study creates no new play, but pokie play itself carries
  risk of harm; Gambling Help Queensland 1800 858 858, available 24/7.
- The right to withdraw at any time, with all data destroyed.
- Contact details for the project lead and the reviewing lawyer.

### 10.2 Consent form (summary)
- I am 18+.
- I have read the information sheet.
- I understand that my data may be presented in **aggregated and
  anonymised** form to a lawyer and to OLGR.
- I understand that no individual session of mine will be identified
  in any publication.
- I consent / I do not consent (tick) to optional still-photo capture
  of my own screen.
- I can withdraw at any time by contacting the project lead.
- Signature, date, witness signature.

### 10.3 Per-session checklist (printed card the participant carries)
1. Loss cap set in the app.
2. Time cap set in the app.
3. Phone is NOT screen-mirroring.
4. No one else is in the photo frame (if using still capture).
5. Tap **Start Session** before the first spin.
6. Tap **End Session** before leaving the machine.
7. Complete the 30-second post-session note.

---

## 11. Stop conditions

The whole plan is paused immediately if any of the following occur:

- A venue staff member objects to the participant's use of the app.
- A participant reports any sign of distress, chasing, or guilt.
- The lawyer raises any concern about the protocol.
- OLGR signals (formally or informally) that the protocol is unwelcome.
- Any data appears in the export that should not be there (a face, a
  name, another patron's screen).

In every stop case, the dataset collected to that point is preserved
for review with the lawyer; no further sessions run until written
sign-off resumes the protocol.
