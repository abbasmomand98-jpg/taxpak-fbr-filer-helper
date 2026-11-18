// TaxPak — FBR Tax Filer & Return Helper (UX Concept).
// IMPORTANT: every figure, person, CNIC, rate and deadline below
// is SAMPLE data invented for this UX concept demo, built around
// the public FBR facts named in the notes. These are NOT real
// taxpayer records. Tax slabs are from the Finance Act 2026 for
// Tax Year 2027 (salaried); withholding rates are sample rates
// from the FBR rate card — always verify current rates on
// fbr.gov.pk before you act on them.

// TAX SLABS — Finance Act 2026, Tax Year 2027, salaried income.
//   up to Rs 600,000: 0%
//   600,001–1,200,000: 1% of the amount above Rs 600,000
//   1,200,001–2,200,000: Rs 6,000 + 11% above Rs 1,200,000
//   2,200,001–3,200,000: Rs 116,000 + 20% above Rs 2,200,000
//   3,200,001–4,100,000: Rs 316,000 + 25% above Rs 3,200,000
//   4,100,001–5,600,000: Rs 541,000 + 29% above Rs 4,100,000
//   5,600,001–7,000,000: Rs 976,000 + 32% above Rs 5,600,000
//   above Rs 7,000,000: Rs 1,424,000 + 35% above Rs 7,000,000
// No surcharge on salaried income.
var TAX_SLABS = [
  { min: 0, max: 600000, base: 0, rate: 0,
    label: "Up to Rs 600,000" },
  { min: 600000, max: 1200000, base: 0, rate: 0.01,
    label: "Rs 600,001 – 1,200,000" },
  { min: 1200000, max: 2200000, base: 6000, rate: 0.11,
    label: "Rs 1,200,001 – 2,200,000" },
  { min: 2200000, max: 3200000, base: 116000, rate: 0.20,
    label: "Rs 2,200,001 – 3,200,000" },
  { min: 3200000, max: 4100000, base: 316000, rate: 0.25,
    label: "Rs 3,200,001 – 4,100,000" },
  { min: 4100000, max: 5600000, base: 541000, rate: 0.29,
    label: "Rs 4,100,001 – 5,600,000" },
  { min: 5600000, max: 7000000, base: 976000, rate: 0.32,
    label: "Rs 5,600,001 – 7,000,000" },
  { min: 7000000, max: null, base: 1424000, rate: 0.35,
    label: "Above Rs 7,000,000" }
];

// WORKED EXAMPLES (must pass in tests):
//   Rs 150,000/month = Rs 1,800,000/yr → tax Rs 72,000/yr =
//   Rs 6,000/month, take-home Rs 144,000/month.
//   Rs 85,000/month = Rs 1,020,000/yr → tax Rs 4,200/yr =
//   Rs 350/month, take-home Rs 84,650/month.
//   Rs 45,000/month = Rs 540,000/yr → Rs 0 tax.
var WORKED_EXAMPLES = [
  { monthly: 150000, annual: 1800000, tax: 72000,
    monthlyTax: 6000, takeHome: 144000 },
  { monthly: 85000, annual: 1020000, tax: 4200,
    monthlyTax: 350, takeHome: 84650 },
  { monthly: 45000, annual: 540000, tax: 0,
    monthlyTax: 0, takeHome: 45000 }
];

// DEADLINE FACTS (Tax Year 2026 return):
//   Due 30 Sep 2026 → extended twice to 31 Oct 2026
//   (Circulars 3 & 4 of 2026-27, Section 214A) → no third
//   extension → late from 1 Nov 2026 → rejoining the Active
//   Taxpayers List costs an individual Rs 25,000 ATL surcharge
//   (Section 182A). FBR received 7.3 million returns by 29 Oct 2026.
//   Next return (TY2027) due 30 Sep 2027. ATL updates weekly;
//   ATL published every 1 March.
var DEADLINE = {
  dueISO: "2026-09-30", dueLabel: "30 Sep 2026",
  extendedISO: "2026-10-31", extendedLabel: "31 Oct 2026",
  lateFromISO: "2026-11-01", lateFromLabel: "1 Nov 2026",
  surcharge: 25000,
  returnsFiled: "7.3 million",
  returnsFiledDate: "29 Oct 2026",
  nextDueISO: "2027-09-30", nextDueLabel: "30 Sep 2027",
  atlPublished: "1 Mar every year",
  atlUpdate: "weekly"
};
var DEADLINE_EVENTS = [
  { date: "30 Sep 2026", title: "TY2026 return due",
    body: "The Tax Year 2026 return was due on 30 Sep 2026." },
  { date: "31 Oct 2026", title: "Extended deadline",
    body: "Extended twice to 31 Oct 2026 — Circulars 3 & 4 of 2026-27, Section 214A. FBR received 7.3 million returns by 29 Oct 2026." },
  { date: "1 Nov 2026", title: "Late filing begins",
    body: "No third extension. Returns filed from 1 Nov 2026 are late, and rejoining the Active Taxpayers List costs an individual Rs 25,000 (Section 182A)." },
  { date: "1 Mar 2027", title: "ATL published",
    body: "The Active Taxpayers List is published every 1 March and updates weekly." },
  { date: "30 Sep 2027", title: "Next return due",
    body: "The Tax Year 2027 return is due 30 Sep 2027. File on time and the surcharge never applies." }
];

// WITHHOLDING (sample rates from the FBR rate card — verify on
// fbr.gov.pk): bank cash withdrawal over Rs 50,000/day — filer 0%,
// non-filer 0.6%. Sample ledger: 4 withdrawals of Rs 100,000 in
// November → non-filer paid Rs 2,400; a filer would pay Rs 0.
// Year-to-date sample loss Rs 18,600.
var WITHHOLDING = {
  threshold: 50000,
  filerRate: 0,
  nonFilerRate: 0.006,
  singleWithdrawal: 100000,
  singleNonFilerTax: 600,
  novemberWithdrawals: 4,
  novemberLoss: 2400
};
var WITHDRAWAL_MONTHS = [
  { month: "Jul 2026", count: 7, total: 700000, loss: 4200 },
  { month: "Aug 2026", count: 6, total: 600000, loss: 3600 },
  { month: "Sep 2026", count: 8, total: 800000, loss: 4800 },
  { month: "Oct 2026", count: 6, total: 600000, loss: 3600 },
  { month: "Nov 2026", count: 4, total: 400000, loss: 2400 }
];

// ATL CHECKER — sample CNIC lookup (these are NOT real CNICs).
//   Ahmed Raza 35202-1234567-1, Lahore — NOT ON ATL.
//   Sara Malik 61101-7654321-2, Karachi — ON ATL.
var ATL_SAMPLES = [
  { cnic: "3520212345671", display: "35202-1234567-1",
    name: "Ahmed Raza", city: "Lahore", onATL: false,
    note: "Not on the Active Taxpayers List. His TY2026 return was never filed — he is 17 days late and must pay the Rs 25,000 ATL surcharge to rejoin." },
  { cnic: "6110176543212", display: "61101-7654321-2",
    name: "Sara Malik", city: "Karachi", onATL: true,
    note: "On the Active Taxpayers List. Her TY2026 return was filed on 12 Oct 2026 — before the extended deadline." }
];

// RETURN CHECKLIST — 7 steps to file a return on IRIS.
var CHECKLIST_STEPS = [
  { id: "register-ntn", title: "Register NTN on IRIS",
    detail: "Create your IRIS account on the FBR portal and get your National Tax Number. Free — no agent needed." },
  { id: "salary-certificate", title: "Gather salary certificate from employer",
    detail: "Ask your employer for the salary certificate — it shows your annual salary and the tax already deducted." },
  { id: "bank-statements", title: "Collect bank statements",
    detail: "Download the year's statements from every bank account you hold — salary account and savings account." },
  { id: "withholding-certificates", title: "Collect withholding certificates",
    detail: "Gather the certificates for tax already withheld — bank profit, mobile bills, cash withdrawals." },
  { id: "fill-statements", title: "Fill income + wealth statement",
    detail: "Enter your salary, other income, and your wealth — bank balances, property, vehicles — in plain figures." },
  { id: "submit-return", title: "Submit return",
    detail: "Review the draft, submit on IRIS, and save the acknowledgement. The whole return takes about 30 minutes." },
  { id: "check-atl", title: "Check ATL status",
    detail: "A week after filing, check the Active Taxpayers List — your name should appear as a filer." }
];

// AGENT SPOTTER: 4 red flags, plus one safe habit as a control.
//   1. Agent charges Rs 5,000–15,000 to file a return you can
//      file free on IRIS in ~30 minutes.
//   2. "Guaranteed ATL in 24 hours" — ATL updates weekly; nobody
//      can guarantee it.
//   3. Agent asks for your IRIS password or OTP — never share it.
//   4. SMS saying "FBR: your ATL is cancelled, pay here" with a
//      link — FBR never asks for payment by SMS link.
//   Safe habit: check your ATL status yourself on fbr.gov.pk
//   before paying any agent.
var SPOTTER_FLAGS = [
  { id: "agent-fee", scenario: "An agent charges Rs 12,000 to file your return.",
    isFlag: true, why: "RED FLAG — a return you can file free on IRIS in about 30 minutes. Agents charge Rs 5,000–15,000 for the same form. File it yourself and keep the Rs 12,000." },
  { id: "guaranteed-atl", scenario: "An agent promises \u201cguaranteed ATL in 24 hours\u201d.",
    isFlag: true, why: "RED FLAG — the Active Taxpayers List updates weekly. Nobody can guarantee ATL in 24 hours. A guarantee like that is a sales line, not a fact." },
  { id: "iris-password", scenario: "The agent asks for your IRIS password or OTP to file for you.",
    isFlag: true, why: "RED FLAG — never share your IRIS password or OTP with anyone. With them, an agent can file in your name, change your details, or lock you out." },
  { id: "sms-payment-link", scenario: "You get an SMS: \u201cFBR: your ATL is cancelled, pay here\u201d with a payment link.",
    isFlag: true, why: "RED FLAG — FBR never asks for payment by SMS link. That message is a scam. Delete it and check your ATL status on fbr.gov.pk yourself." },
  { id: "check-atl-yourself", scenario: "You check your ATL status yourself on fbr.gov.pk before paying any agent.",
    isFlag: false, why: "SAFE — checking the Active Taxpayers List yourself on fbr.gov.pk takes a minute and tells you the truth before any money moves. That is exactly what TaxPak\u2019s ATL checker does." }
];

// PERSONA: Ahmed Raza, 38, Lahore, accounts officer,
// Rs 150,000/month. Employer deducts Rs 6,000/month tax but he
// has never filed a return; paid Rs 600 on a Rs 100,000 cash
// withdrawal as a non-filer; an agent quoted Rs 12,000 to file
// his return. Illustrative proto-persona — a design hypothesis,
// not an interviewed participant.
var PERSONA = { name: "Ahmed Raza", age: 38, city: "Lahore",
  job: "Accounts officer", monthly: 150000, annual: 1800000,
  taxPerYear: 72000, deductedPerMonth: 6000,
  withdrawalTaxPaid: 600, agentQuote: 12000, filed: false };

if (typeof module !== "undefined") {
  module.exports = { TAX_SLABS: TAX_SLABS,
    WORKED_EXAMPLES: WORKED_EXAMPLES, DEADLINE: DEADLINE,
    DEADLINE_EVENTS: DEADLINE_EVENTS, WITHHOLDING: WITHHOLDING,
    WITHDRAWAL_MONTHS: WITHDRAWAL_MONTHS,
    ATL_SAMPLES: ATL_SAMPLES, CHECKLIST_STEPS: CHECKLIST_STEPS,
    SPOTTER_FLAGS: SPOTTER_FLAGS, PERSONA: PERSONA };
}
