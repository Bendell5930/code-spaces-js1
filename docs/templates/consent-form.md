> **Draft for legal review — final wording subject to lawyer approval.**
> This document is a template referenced by §10.2 of
> [`../consented-self-logging-plan.md`](../consented-self-logging-plan.md).

---

# Consent Form — Pokie Analyzer Consented Self-Logging Study

**Study ID:** `[Study ID — TO BE COMPLETED]`
**Version:** `1.0.0`
**Date:** `28/04/2026`
**Status:** Draft for legal review — final wording subject to lawyer approval.

---

## Instructions

Please read the **Participant Information Sheet** (version `1.0.0`,
dated `28/04/2026`) before completing this form.

Place a tick (✓) in the box next to each statement to confirm you agree.
All boxes must be ticked before you sign this form.

---

## Part A — Main consent statements

- [ ] I confirm I am **18 years of age or older**.

- [ ] I have read and understood the Participant Information Sheet (version
  `1.0.0`, dated `28/04/2026`).

- [ ] I have had the opportunity to ask questions about the study, and any questions
  I had have been answered to my satisfaction.

- [ ] I understand **exactly what data will be recorded**: the 15 fields listed in
  the data-model table in §5 of the plan and in §7 of the Participant Information
  Sheet (`participantId`, `sessionId`, `machineName`, `venueLga`, `denomination`,
  `betAmount`, `lines`, `totalBalance`, `winAmount`, `bonusHit`, `jackpotTier`,
  `spinsSinceBonus`, `timestamp`, `consented`, `simulated`). No other fields will
  be stored.

- [ ] I understand **what will not be recorded**: my name, date of birth, address,
  email address, phone number, payment method, loyalty card number, machine serial
  number, or the specific venue identity (only LGA + suburb are stored). No audio,
  no photos of other patrons, staff, other machines, or venue signage.

- [ ] I understand that my data will be stored **encrypted on my own device** under
  the `pokie-session-state` localStorage key and will **not** be synced off-device
  to any server, analytics service, or third-party application.

- [ ] I understand that my data will be retained for **no more than 12 weeks** from
  the date it was collected, after which it will be automatically deleted.

- [ ] I understand that my data may be presented in **aggregated and anonymised** form
  to a reviewing Queensland lawyer and to the Queensland Office of Liquor and Gaming
  Regulation (OLGR), with my participant ID replaced by a fresh per-export pseudonym.

- [ ] I understand that **no individual session** of mine will be identified or
  attributed to me in any publication, briefing, or report.

- [ ] I understand that participation in this study creates **no new play** — I will
  only log sessions I would have played anyway, on my own money, at venues I already
  visit.

- [ ] I understand and agree to the **binding harm-minimisation caps**:
  - Session loss cap: **$50 maximum per session**.
  - Monthly loss cap: **$200 maximum per month**.
  - Session time cap: **90 minutes maximum per session**.
  - Reality-check prompts fire every **30 minutes** during a session.
  - **No chasing:** if the session loss cap is hit, participation ends for that day
    and no second session is run.

- [ ] I understand that I can **withdraw at any time**, without giving a reason, and
  have all of my data permanently deleted by sending a one-line message to the
  project lead.

- [ ] I confirm I am **not currently on any voluntary self-exclusion register**.

---

## Part B — Optional still-photo capture

You must tick **exactly one** of the two boxes below.

- [ ] **I CONSENT** to the optional still-photo capture of my own machine screen,
  on the conditions described in §4 of the plan and §9 of the Participant Information
  Sheet:
  - Only my own machine screen will be in the photo frame.
  - No other patron, staff member, other machine, or identifying venue signage will
    be in frame.
  - The raw photo will be discarded from the device within 5 seconds of the
    numbers being extracted, and will never be stored or sent anywhere.
  - The app's recording-policy guard must report `GUARD_STATUS.OK` before each photo.
  - I will only use still-photo capture at venues whose house rules permit phone use
    at the machine.

- [ ] **I DO NOT CONSENT** to still-photo capture. I will use **manual entry only**
  for all spin data.

---

## Part C — Signature block

By signing below, I confirm that I have read this form, I understand its contents,
and I freely and voluntarily agree to take part in the study on the terms described.

---

**Participant name (printed):** ____________________

**Participant ID (UUID — assigned by project lead):** ____________________

**Participant signature:** ____________________ &nbsp;&nbsp; **Date:** __________

---

**Witness name (printed):** ____________________

**Witness signature:** ____________________ &nbsp;&nbsp; **Date:** __________

---

**Project lead signature:** ____________________ &nbsp;&nbsp; **Date:** __________

---

## Contact for withdrawal or deletion

To withdraw from the study or request immediate deletion of your data, contact:

**Project lead:** `benjamin@pokieanalyzer.com.au`

A one-line message is sufficient. Deletion will be carried out immediately.

---

**Gambling Help Queensland — 1800 858 858 (free call, 24/7)**

---

*This form is a draft for legal review. Do not use with participants until the
reviewing Queensland lawyer has approved the final version.*

*Source of truth: [`../consented-self-logging-plan.md`](../consented-self-logging-plan.md)*
