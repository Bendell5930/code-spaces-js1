> **Draft for legal review.**
> This document is a template referenced by §10.3 of
> [`../consented-self-logging-plan.md`](../consented-self-logging-plan.md).

---

# Per-Session Checklist — Pokie Analyzer Consented Self-Logging

**Status:** Draft for legal review.

*Print this card, fold it, and keep it on your phone or in your wallet.
Work through it every session — top to bottom.*

---

## Before you sit down at the machine

- [ ] **Loss cap set in the app** — $50 maximum per session (go to the
  pre-commitment screen and confirm it is active before tapping Start).
- [ ] **Time cap set in the app** — 90 minutes maximum per session.
- [ ] **Monthly loss cap not yet hit** — check that you have not yet
  reached $200 total loss across all sessions this month. If you have,
  do not start a session today.
- [ ] **Phone is NOT screen-mirroring** — AirPlay, Chromecast, and all
  cast/mirror options are switched off on your phone.
- [ ] *(Still-photo mode only)* **Venue house rules permit phone use** at
  the machine, and the app's recording-policy guard reports `GUARD_STATUS.OK`.
- [ ] *(Still-photo mode only)* **Frame check** — no other person, no other
  machine, and no venue interior or signage will be in any photo frame.

---

## At the start of the session

- [ ] Tap **Start Session** in the Pokie Analyzer app **before your first spin**.
  This generates a new session ID automatically.

---

## For each spin (or each batch of 5–10 spins)

Enter the following fields via the **Data Entry Form** in the app.
Read the values from the machine screen in front of you — do not guess.
(Your `participantId` was assigned at enrolment; `sessionId` was generated when you
tapped Start Session — neither needs to be entered per spin.)

| Field | What to enter |
|---|---|
| `denomination` | Coin denomination shown on screen |
| `betAmount` | Total bet for the spin |
| `lines` | Number of active lines |
| `totalBalance` | Your current account balance |
| `winAmount` | Win amount for this spin (enter `0` for no win) |
| `bonusHit` | Tick if a bonus feature triggered this spin |
| `jackpotTier` | If a jackpot hit: Mini, Minor, Major, or Grand |
| `machineName` | Machine name (select from list or type free text) |
| `venueLga` | LGA + suburb only — **never** the venue name or address |

The following fields are **filled in automatically** — do not enter them manually:

- `spinsSinceBonus` — computed by the app; resets on every bonus hit.
- `timestamp` — set from your device clock at the moment of entry.
- `consented` — always stamped `true` for your records.
- `simulated` — always stamped `false` for your records.

---

## Forbidden during the session

Read these once before every session and keep them in mind throughout.

- **No continuous video. No audio. Ever.**
- No photos containing any other patron, any staff member, any other
  machine, or any identifying venue signage.
- No screenshots of other players' loyalty cards, bank cards, or phones.
- Do not tell venue staff the test is happening — this is your personal play.
- No automated input or machine modification of any kind.
- Do not recreate a session from memory if you forget to log it.

---

## At the end of the session

- [ ] Tap **End Session** in the app **before leaving the machine**.
- [ ] Complete the **30-second post-session note** (e.g. "noisy floor",
  "switched machines once", "bonus felt overdue").
- [ ] **If the session loss cap was hit ($50): stop for the day.**
  No chasing. No second session today. Close the app and leave the venue.

---

## If anything goes wrong

**Pause and do not run further sessions if any of these occur:**

- A venue staff member objects to your use of the app.
- You notice any sign of distress, chasing, or guilt — in yourself or
  another participant.
- Any photo accidentally captures another patron, staff member, or
  identifying venue detail — report it to the project lead immediately
  (the whole study pauses until the lawyer reviews the situation).
- The project lead tells you the study has been paused for any reason.

In all cases, **preserve your device as-is** so the data collected can
be reviewed with the lawyer. Do not delete anything yourself without
checking with the project lead first.

---

**Gambling Help Queensland — 1800 858 858 (free call, 24/7)**

---

**Project lead contact:** `benjamin@pokieanalyzer.com.au`

---

*This card is a draft for legal review. Do not distribute to participants
until the reviewing Queensland lawyer has approved the final version.*

*Source of truth: [`../consented-self-logging-plan.md`](../consented-self-logging-plan.md)*
