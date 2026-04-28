> **Draft for legal review — not for distribution until lawyer-approved.**
> This document is a template referenced by §10.1 of
> [`../consented-self-logging-plan.md`](../consented-self-logging-plan.md).

---

# Participant Information Sheet — Pokie Analyzer Consented Self-Logging Study

**Version:** `[TO BE COMPLETED BY PROJECT LEAD]`
**Date:** `[TO BE COMPLETED BY PROJECT LEAD]`
**Status:** Draft for legal review — not for distribution until lawyer-approved.

Please read this sheet carefully before deciding whether to take part.
If you have any questions, contact the project lead using the details in the
**Contact** section below.

---

## 1. What this project is and why it is being built

**Pokie Analyzer** is a web application (PWA) that helps Australian electronic gaming
machine (EGM/pokie) players track their own play — bet amounts, wins, session times,
and bonus events — directly on their own phone.

To show a Queensland gambling regulator (the Office of Liquor and Gaming Regulation,
OLGR) and a reviewing lawyer that the app works with real-world data, we need a small,
carefully supervised dataset of real sessions alongside the app's built-in simulator
and publicly available OLGR statistics.

This study captures that real-world dataset. It involves only the project lead and a
small number of consenting adult family members playing on their **own money** at
venues they **already visit**. The study does **not** create any new play.

---

## 2. Who is running it

- **Project lead:** `[Project lead name — TO BE COMPLETED]`
- **Contact email:** `[email — TO BE COMPLETED]`
- **Reviewing Queensland lawyer:** `[Lawyer name and firm — TO BE CONFIRMED BY LAWYER]`

Nothing in this information sheet is legal advice.

---

## 3. Who can take part

You are eligible to take part if **all** of the following apply:

- You are **18 years of age or older**.
- You are an **existing recreational pokie player** — this study creates no new play.
- You are **not currently on any voluntary self-exclusion register**.
- You do **not** have a financial or emotional dependency on the project lead that
  could compromise your ability to give free and voluntary consent.

Maximum participants: 6 (project lead + up to 5 family members).

---

## 4. What you will be asked to do

Each time you visit a venue you would normally visit:

1. Open the Pokie Analyzer app on your own phone.
2. Set the **session loss cap** (maximum $50) and **session time cap** (maximum 90 minutes)
   in the app's pre-commitment screen.
3. Confirm your phone is **not** screen-mirroring (AirPlay, Chromecast, etc. all off).
4. Tap **Start Session** in the app before your first spin.
5. For each spin — or each **batch of 5–10 spins** — enter the visible numbers via the
   app's Data Entry Form (see §7 below for the exact list of fields).
6. Tap **End Session** before leaving the machine.
7. Complete the short post-session note in the app (takes about 30 seconds).

Use the **Per-Session Checklist** card (the companion document) each time.

If you find manual entry too slow, you may optionally use the app's still-photo mode
to photograph your own machine screen — see §8 below for the conditions.

---

## 5. How long will it take?

Each session is up to 90 minutes (the hard time cap). Most participants will run
6–10 sessions over a 4-week window (Weeks 3–6 of the study schedule). You can stop
at any time.

---

## 6. Do you have to take part?

No. Taking part is completely voluntary. You can withdraw at any time, without giving
a reason, and all of your data will be deleted immediately on request (see §12 below).

---

## 7. Exactly what data will be recorded

Every spin (or batch of spins) you log is stored as a record with the following fields.
No other fields are stored.

| Field | Source | Notes |
|---|---|---|
| `participantId` | Generated (UUID v4) at enrolment | Opaque; not linked to name in any stored file |
| `sessionId` | Generated at session start | UUID v4 |
| `machineName` | Participant selects from machine list | Free-text fallback allowed |
| `venueLga` | Participant selects from OLGR LGA list | Coarse; never the venue address |
| `denomination` | Manual / OCR | One of the app's denomination options |
| `betAmount` | Manual / OCR | One of the app's bet amount options |
| `lines` | Manual / OCR | One of the app's line options |
| `totalBalance` | Manual / OCR | $ AUD |
| `winAmount` | Manual / OCR | $ AUD; `0` for a non-winning spin |
| `bonusHit` | Manual | Boolean |
| `jackpotTier` | Manual (if applicable) | Mini / Minor / Major / Grand |
| `spinsSinceBonus` | Computed | Reset to 0 on a `bonusHit` |
| `timestamp` | Device clock at entry | ms since epoch |
| `consented` | Always `true` | Flag the analytics pipeline can assert on |
| `simulated` | Always `false` | Distinguishes from simulator output |

---

## 8. Exactly what will NOT be recorded

The following information is **never** collected or stored under this study:

- Your **name**, date of birth, address, email address, or phone number.
- Your **payment method**, bank card details, or loyalty card number.
- The **machine serial number** or any internal machine identifier.
- The **specific venue identity** — only the Local Government Area (LGA) and suburb
  are stored, never the venue name or address.
- Any recording, photograph, or screenshot of **any other patron**, staff member,
  other machine, or venue interior/signage.
- Any **audio** of any kind.

---

## 9. Optional: still-photo capture of your own machine screen

By default, you enter spin data manually. If you choose to opt in to still-photo
capture, the following conditions apply:

- Only your **own** machine screen appears in any photo.
- No other patron, staff member, other machine, or venue signage is in frame.
- The venue's house rules do not prohibit phone use at the machine.
- The app's recording-policy guard must report no person or venue interior detected.
- The raw photo is **discarded from the device within 5 seconds** of the numbers
  being extracted. It is never stored or sent anywhere.

You can choose to opt in or opt out on your consent form, and you can change your
mind at any time by contacting the project lead.

---

## 10. Storage, retention, and security

- **Where data is stored:** On your own device only, in the app's encrypted local
  storage (the `pokie-session-state` key, encrypted using `lib/dataEncryption.js`).
- **Off-device sync:** Disabled for the duration of this study. Your session data
  is never uploaded to any server, analytics service, or third-party app.
- **How long data is kept:** A maximum of **12 weeks** from the date it was
  collected. After 12 weeks, the data is automatically deleted.
- **Deletion on request:** You can ask for all of your data to be deleted at any
  time — just send a one-line message to the project lead. Deletion is immediate.
- **Backups:** None. If your device is lost or replaced, your contribution to the
  study simply ends. You will never be asked to recreate a session from memory.

---

## 11. Risks and harm minimisation

Pokie machines carry a real risk of financial harm and problem gambling. The study
does not create any new play — you will only log sessions you would have anyway.
However, the following **binding safeguards** apply to every participant:

- **Session loss cap:** $50 maximum per session, set in the app before the first spin.
- **Monthly loss cap:** $200 maximum per month across all sessions.
- **Session time cap:** 90 minutes maximum per session.
- **Reality-check prompt:** The app alerts you every 30 minutes during a session.
- **No chasing:** If you hit the session loss cap, that day's participation ends.
  No second session the same day.
- **Post-session check-in:** The project lead checks in with you after every session.
- **Weekly check-in:** The project lead contacts you weekly throughout the study.
- **Distress protocol:** If you show any signs of distress, chasing, or guilt, your
  participation is paused immediately.

**Gambling Help Queensland is available 24/7 on 1800 858 858.**

If you are concerned about your gambling at any time — before, during, or after the
study — please call or visit [gamblinghelp.nsw.gov.au/finding-help/help-lines/](https://www.gamblinghelp.nsw.gov.au).

---

## 12. Your rights

- **Withdraw at any time:** You can stop participating at any point, without giving
  a reason. Simply tell the project lead verbally or by message.
- **Data deletion:** On withdrawal (or at any time on request), all of your session
  records will be permanently deleted. Send a one-line message to the project lead.
- **Access your own records:** You can ask the project lead for a copy of the data
  recorded under your participant ID at any time.

---

## 13. How your data may be used

Your data will be used only in the following ways:

- **Aggregated and anonymised** results may be presented to the reviewing Queensland
  lawyer and to OLGR as part of a briefing pack.
- Any briefing export replaces your participant ID with a fresh per-export pseudonym,
  so re-identification across different briefings is not possible.
- **No individual session** of yours will be identified or attributed to you in any
  publication, briefing, or report.
- Your data will not be sold, shared with advertisers, or used for any purpose outside
  this study.

---

## 14. What we will not do

- No recording, photographing, or filming of any other patron in a venue.
- No audio recording of any kind.
- No capture of the venue interior, staff, other machines, or venue signage.
- No venue cooperation — this is your personal play and venue staff are not told the
  study is happening.
- No automated input or machine modification of any kind.

---

## 15. Stop conditions

The entire study will be paused immediately if any of the following occur:

- A venue staff member objects to a participant's use of the app.
- A participant reports any sign of distress, chasing, or guilt.
- The reviewing lawyer raises any concern about the protocol.
- OLGR signals (formally or informally) that the protocol is unwelcome.
- Any data appears in the export that should not be there (a face, a name, another
  patron's screen).

If the study is paused, no further sessions will run until written sign-off from the
lawyer resumes the protocol.

---

## 16. Contact for questions or complaints

**Project lead:**
`[Project lead name — TO BE COMPLETED]`
`[email — TO BE COMPLETED]`

**Independent contact for complaints:**
`[Independent contact name and details — TO BE CONFIRMED BY LAWYER]`

**Reviewing Queensland lawyer:**
`[Lawyer name and firm — TO BE CONFIRMED BY LAWYER]`

**Gambling Help Queensland:** 1800 858 858 (24/7, free call)

---

*This document is a draft for legal review. Do not sign or distribute until the
reviewing Queensland lawyer has approved the final version.*

*Source of truth: [`../consented-self-logging-plan.md`](../consented-self-logging-plan.md)*
