# TaxPak — FBR Tax Filer & Return Helper (UX Concept)

**Live demo:** https://abbasmomand98-jpg.github.io/taxpak-fbr-filer-helper/
**Code:** https://github.com/abbasmomand98-jpg/taxpak-fbr-filer-helper

TaxPak is an FBR tax filer and return helper for Pakistan. Millions of Pakistanis pay tax through salary deduction but never file a return. FBR's IRIS portal is English tax jargon, agents charge Rs 5,000–15,000 to file a return that takes about 30 minutes, and non-filers pay double withholding everywhere. The Tax Year 2026 return was due 30 Sep 2026, extended twice to 31 Oct 2026 — and there was no third extension. Returns filed from 1 Nov 2026 are late, and rejoining the Active Taxpayers List costs an individual Rs 25,000. TaxPak works out your real tax in seconds, checks whether you are on the Active Taxpayers List, walks you through the 7 steps of filing, shows what being a non-filer costs you on every bank withdrawal, and spots the four agent traps before your money moves.

## How it works

Open `index.html` in a browser — no build step, no framework, just HTML, CSS and JavaScript. The demo is split into three files so each part is easy to read and change:

- `data.js` — all the sample data: the 8 Finance Act 2026 salaried tax slabs for Tax Year 2027, the 3 worked examples, the deadline facts (due 30 Sep 2026, extended to 31 Oct 2026, late from 1 Nov 2026, Rs 25,000 ATL surcharge, 7.3 million returns by 29 Oct 2026), the sample withholding ledger (July–November 2026), the 2 sample ATL records, the 7-step return checklist, the 4 agent-spotter flags plus one safe habit, and Ahmed Raza's story.
- `logic.js` — all the rules, with no DOM code at all: the slab tax calculation, the monthly tax and take-home, the slab breakdown, the days-late and surcharge maths, the withholding maths, the refund check, the CNIC lookup, the checklist progress, and the spotter-quiz scoring. Because it touches no DOM, it can be tested in Node with `node test.js`.
- `app.js` — the page wiring only: it reads the data, calls the logic, and renders the results into the page. Demo "today" is pinned to 18 Nov 2026 so the sample figures stay stable.

Try it with the sample figures:

1. **Tax Calculator** — enter a monthly salary and TaxPak works out the annual tax, the monthly deduction and the take-home, using the Finance Act 2026 salaried slabs for Tax Year 2027. Rs 150,000 a month = Rs 1,800,000 a year → tax Rs 72,000 a year = Rs 6,000 a month, take-home Rs 144,000 a month. Rs 85,000 a month = Rs 1,020,000 a year → tax Rs 4,200 a year = Rs 350 a month, take-home Rs 84,650. Rs 45,000 a month = Rs 540,000 a year → Rs 0 tax. The slab breakdown shows where the tax comes from: on Rs 1,800,000, Rs 600,000 sits in the 0% slab (Rs 0), Rs 600,000 in the 1% slab (Rs 6,000) and Rs 600,000 in the 11% slab (Rs 66,000).
2. **ATL Check** — check a sample CNIC against the Active Taxpayers List. Ahmed Raza's sample CNIC 35202-1234567-1 is NOT on ATL — his TY2026 return was never filed, he is 17 days late, and the surcharge to rejoin is Rs 25,000 (Section 182A). Sara Malik's sample CNIC 61101-7654321-2 IS on ATL — she filed on 12 Oct 2026, before the extended deadline. The refund check compares what your employer deducted with the tax you actually owe: Ahmed's employer deducted Rs 6,000 a month — Rs 72,000 a year — and his tax is exactly Rs 72,000, so his refund is Rs 0.
3. **Return Checklist** — 7 steps to file on IRIS in about 30 minutes: register NTN, gather the salary certificate, collect bank statements, collect withholding certificates, fill the income and wealth statement, submit the return, check ATL status. Tick each step off; your progress is saved on this device.
4. **Withholding Tracker** — on a bank cash withdrawal over Rs 50,000 a day, a filer pays 0% and a non-filer pays 0.6% (sample rates from the FBR rate card — verify current rates on fbr.gov.pk). A Rs 100,000 withdrawal costs a non-filer Rs 600 and a filer Rs 0. Ahmed made 4 withdrawals of Rs 100,000 in November: as a non-filer he paid Rs 2,400. His year-to-date sample loss is Rs 18,600 — a filer would have lost Rs 0.
5. **Agent Spotter** — a 5-question quiz: four red flags (an agent charging Rs 12,000 to file a return you can file free on IRIS in about 30 minutes; "guaranteed ATL in 24 hours" when ATL updates weekly; asking for your IRIS password or OTP; an SMS saying "FBR: your ATL is cancelled, pay here" with a payment link) and one safe habit (checking your ATL status yourself on fbr.gov.pk). Score 5 of 5 and you spot them all.
6. **Deadline** — the late-filing explainer timeline: TY2026 return due 30 Sep 2026, extended twice to 31 Oct 2026 (Circulars 3 & 4 of 2026-27, Section 214A), late from 1 Nov 2026 with a Rs 25,000 ATL surcharge (Section 182A), ATL published every 1 March and updated weekly, next return (TY2027) due 30 Sep 2027. Today, 18 Nov 2026, a late filer is 17 days late.

Run the tests with `node test.js` — they assert every canonical figure above, plus that all element IDs referenced by `app.js` exist in `index.html` and that the HTML tags balance. `node dom-smoke.js` renders the whole page in a fake DOM and asserts the canonical figures appear on load.

## What you can learn from this project

- **Separating data, logic, and rendering.** `data.js` holds facts, `logic.js` holds rules, `app.js` holds rendering. When the facts change (a new slab, a new deadline), only `data.js` changes. When a rule changes (how the tax is computed), only `logic.js` changes. This is the single most useful habit in front-end work.
- **Pure functions are testable functions.** Every rule in `logic.js` takes inputs and returns outputs — no DOM, no dates from the clock, no hidden state. That is why `node test.js` can check the slab boundaries (Rs 600,000 → Rs 0; Rs 1,200,000 → Rs 6,000; Rs 7,000,000 → Rs 1,424,000) and the withholding maths (Rs 100,000 → Rs 600) without opening a browser.
- **A tax table is a list of slabs, not a pile of ifs.** `calcTax` finds the slab the income falls in and applies one formula — base + rate × (income − slab minimum). Adding a new slab, or a new year's rates, means adding one row to `TAX_SLABS`, not rewriting the maths.
- **A breakdown makes a total believable.** `slabBreakdown` splits Rs 72,000 into Rs 0 + Rs 6,000 + Rs 66,000, so the taxpayer sees where every rupee of tax comes from instead of being handed one number to trust.
- **Dates are just subtraction.** `daysBetween` subtracts two ISO dates, so "17 days late" and "the deadline was 31 days after the due date" come from the same function — and `daysLate` reuses it against the pinned "today". Pin "today" to a fixed date in a demo so the numbers never drift.
- **Normalise input before you look it up.** `normalizeCNIC` strips dashes and spaces, so "35202-1234567-1" finds the same record as "3520212345671". Users type CNICs in all kinds of formats; the lookup should never fail because of a dash.
- **A comparison beats a lecture.** The withholding tracker never tells the user to file — it shows Rs 600 gone on one withdrawal and Rs 18,600 gone in five months, next to a filer's Rs 0. The numbers do the persuading.
- **Number formatting that matches everywhere.** `formatPKR` groups digits in thousands — 72,000 stays "72,000" and 25,000 stays "25,000" — the exact figures the mockups, slides and copy use, so a taxpayer sees the same number on every surface. One formatter, used by every render, is what keeps them identical.
- **localStorage for checklist progress and quiz answers.** Your 7-step progress and your spotter answers survive a page refresh because `app.js` saves them under two keys (`taxpak-checklist`, `taxpak-spotter-answers`) and loads them back on start.

## Sample-data honesty note

Every figure, person, CNIC, rate and deadline in this demo is invented sample data for an unofficial UX concept, built around public FBR facts. These are NOT real taxpayer records. Tax slabs are from the Finance Act 2026 for Tax Year 2027 (salaried); withholding rates are sample rates from the FBR rate card — always verify current rates on fbr.gov.pk before you act on them.

## Fork it and make it yours

This project is a pattern, not just a demo: a **work out what you owe → check your status → follow the steps → count what delay costs you → spot the traps** tool for any process where the deadline just passed, the jargon hides the truth, and middlemen charge for a form you can file yourself. Fork the repo and adapt it to a problem people face where you live — tracking a government application through its stages, working out a utility bill from its slab rates, checking a scholarship deadline and its late fee, or counting what a missed renewal costs in fines. Keep the data in `data.js`, the rules in `logic.js`, and the honesty note — and the same pattern will work for your problem too.

---

TaxPak is an unofficial UX concept by Muhammad Abbas Khan.
Available for new projects: abbasmomand98@gmail.com
