// TaxPak smoke tests — run with: node test.js
// Every canonical figure used in the mockups, slides and copy is asserted here.
var assert = require("assert");
var fs = require("fs");
var data = require("./data.js");
var L = require("./logic.js");

var n = 0;

function eq(a, b, msg) { assert.strictEqual(a, b, msg); n++; }
function ok(v, msg) { assert.ok(v, msg); n++; }
function deep(a, b, msg) { assert.deepStrictEqual(a, b, msg); n++; }

// 1. The 8 TY2027 salaried slabs (Finance Act 2026).
eq(data.TAX_SLABS.length, 8, "there are 8 tax slabs");
deep(data.TAX_SLABS[0], { min: 0, max: 600000, base: 0, rate: 0,
  label: "Up to Rs 600,000" }, "slab 1: up to Rs 600,000 at 0%");
deep(data.TAX_SLABS[1], { min: 600000, max: 1200000, base: 0, rate: 0.01,
  label: "Rs 600,001 – 1,200,000" }, "slab 2: 1% above Rs 600,000");
deep(data.TAX_SLABS[2], { min: 1200000, max: 2200000, base: 6000, rate: 0.11,
  label: "Rs 1,200,001 – 2,200,000" }, "slab 3: Rs 6,000 + 11% above Rs 1,200,000");
deep(data.TAX_SLABS[7], { min: 7000000, max: null, base: 1424000, rate: 0.35,
  label: "Above Rs 7,000,000" }, "slab 8: Rs 1,424,000 + 35% above Rs 7,000,000");

// 2. Slab boundaries: the tax at each boundary is the next slab's base.
eq(L.calcTax(data.TAX_SLABS, 0), 0, "Rs 0 income pays Rs 0");
eq(L.calcTax(data.TAX_SLABS, 600000), 0, "Rs 600,000 pays Rs 0");
eq(L.calcTax(data.TAX_SLABS, 600001), 0, "Rs 600,001 rounds to Rs 0");
eq(L.calcTax(data.TAX_SLABS, 1200000), 6000, "Rs 1,200,000 pays Rs 6,000");
eq(L.calcTax(data.TAX_SLABS, 2200000), 116000, "Rs 2,200,000 pays Rs 116,000");
eq(L.calcTax(data.TAX_SLABS, 3200000), 316000, "Rs 3,200,000 pays Rs 316,000");
eq(L.calcTax(data.TAX_SLABS, 4100000), 541000, "Rs 4,100,000 pays Rs 541,000");
eq(L.calcTax(data.TAX_SLABS, 5600000), 976000, "Rs 5,600,000 pays Rs 976,000");
eq(L.calcTax(data.TAX_SLABS, 7000000), 1424000, "Rs 7,000,000 pays Rs 1,424,000");
eq(L.calcTax(data.TAX_SLABS, 8000000), 1774000, "Rs 8,000,000 pays Rs 1,774,000");
eq(L.calcTax(data.TAX_SLABS, 1500000), 39000, "Rs 1,500,000 pays Rs 39,000");
eq(L.calcTax(data.TAX_SLABS, 3000000), 276000, "Rs 3,000,000 pays Rs 276,000");

// 3. The 3 worked examples.
eq(data.WORKED_EXAMPLES.length, 3, "there are 3 worked examples");
deep(data.WORKED_EXAMPLES[0], { monthly: 150000, annual: 1800000, tax: 72000,
  monthlyTax: 6000, takeHome: 144000 },
     "Rs 150,000/month: tax Rs 72,000/yr, Rs 6,000/month, take-home Rs 144,000/month");
deep(data.WORKED_EXAMPLES[1], { monthly: 85000, annual: 1020000, tax: 4200,
  monthlyTax: 350, takeHome: 84650 },
     "Rs 85,000/month: tax Rs 4,200/yr, Rs 350/month, take-home Rs 84,650/month");
deep(data.WORKED_EXAMPLES[2], { monthly: 45000, annual: 540000, tax: 0,
  monthlyTax: 0, takeHome: 45000 },
     "Rs 45,000/month: Rs 0 tax, take-home Rs 45,000/month");
data.WORKED_EXAMPLES.forEach(function (ex) {
  eq(L.calcTax(data.TAX_SLABS, ex.annual), ex.tax,
     "calcTax matches the worked example at " + ex.annual);
  eq(L.monthlyTax(data.TAX_SLABS, ex.monthly), ex.monthlyTax,
     "monthlyTax matches the worked example at " + ex.monthly);
  eq(L.takeHome(data.TAX_SLABS, ex.monthly), ex.takeHome,
     "takeHome matches the worked example at " + ex.monthly);
});

// 4. Slab breakdown for Rs 1,800,000: 0 + 6,000 + 66,000 = 72,000.
var bd = L.slabBreakdown(data.TAX_SLABS, 1800000);
eq(bd[0].income, 600000, "first slab holds Rs 600,000 of the income");
eq(bd[0].tax, 0, "first slab tax is Rs 0");
eq(bd[1].income, 600000, "second slab holds Rs 600,000");
eq(bd[1].tax, 6000, "second slab tax is Rs 6,000");
eq(bd[2].income, 600000, "third slab holds Rs 600,000");
eq(bd[2].tax, 66000, "third slab tax is Rs 66,000");
eq(bd[3].income, 0, "fourth slab holds nothing");
var bdTotal = 0;
bd.forEach(function (r) { bdTotal += r.tax; });
eq(bdTotal, 72000, "breakdown sums to Rs 72,000");

// 5. Deadline facts: due 30 Sep, extended to 31 Oct, late from 1 Nov.
deep(data.DEADLINE, { dueISO: "2026-09-30", dueLabel: "30 Sep 2026",
  extendedISO: "2026-10-31", extendedLabel: "31 Oct 2026",
  lateFromISO: "2026-11-01", lateFromLabel: "1 Nov 2026",
  surcharge: 25000, returnsFiled: "7.3 million",
  returnsFiledDate: "29 Oct 2026",
  nextDueISO: "2027-09-30", nextDueLabel: "30 Sep 2027",
  atlPublished: "1 Mar every year", atlUpdate: "weekly" },
     "deadline facts: due 30 Sep, extended 31 Oct, late 1 Nov, surcharge Rs 25,000");
eq(data.DEADLINE_EVENTS.length, 5, "deadline timeline has 5 events");
eq(L.daysBetween("2026-09-30", "2026-10-31"), 31, "30 Sep to 31 Oct is 31 days");
eq(L.daysLate(data.DEADLINE, "2026-10-31"), 0, "31 Oct is not late");
eq(L.daysLate(data.DEADLINE, "2026-11-01"), 0, "1 Nov is 0 days late");
eq(L.daysLate(data.DEADLINE, "2026-11-18"), 17, "18 Nov is 17 days late");
eq(L.atlSurcharge(data.DEADLINE, "2026-10-31"), 0, "no surcharge before the deadline");
eq(L.atlSurcharge(data.DEADLINE, "2026-11-18"), 25000, "surcharge is Rs 25,000 on 18 Nov");

// 6. Withholding: filer 0%, non-filer 0.6% over Rs 50,000/day.
deep(data.WITHHOLDING, { threshold: 50000, filerRate: 0, nonFilerRate: 0.006,
  singleWithdrawal: 100000, singleNonFilerTax: 600,
  novemberWithdrawals: 4, novemberLoss: 2400 },
     "withholding: threshold Rs 50,000, filer 0%, non-filer 0.6%");
eq(L.withholdingTax(100000, false, data.WITHHOLDING), 600,
   "Rs 100,000 withdrawal costs a non-filer Rs 600");
eq(L.withholdingTax(100000, true, data.WITHHOLDING), 0,
   "Rs 100,000 withdrawal costs a filer Rs 0");
eq(L.withholdingTax(50000, false, data.WITHHOLDING), 0,
   "Rs 50,000 is at the threshold — no withholding");
eq(L.withholdingTax(40000, false, data.WITHHOLDING), 0,
   "Rs 40,000 is under the threshold — no withholding");
eq(L.withholdingTax(200000, false, data.WITHHOLDING), 1200,
   "Rs 200,000 costs a non-filer Rs 1,200");
eq(data.WITHDRAWAL_MONTHS.length, 5, "ledger has 5 months");
eq(L.monthlyLoss(data.WITHDRAWAL_MONTHS[4], data.WITHHOLDING), 2400,
   "November loss is Rs 2,400");
eq(L.ytdLoss(data.WITHDRAWAL_MONTHS, data.WITHHOLDING), 18600,
   "year-to-date loss is Rs 18,600");
var ytdCheck = 0;
data.WITHDRAWAL_MONTHS.forEach(function (m) { ytdCheck += m.loss; });
eq(ytdCheck, 18600, "the stored monthly losses sum to Rs 18,600");

// 7. Refund check: deducted minus owed.
eq(L.refundCheck(data.TAX_SLABS, 150000, 6000), 0,
   "Ahmed Raza: deducted Rs 72,000, owed Rs 72,000, refund Rs 0");
eq(L.refundCheck(data.TAX_SLABS, 150000, 7000), 12000,
   "deducting Rs 7,000 a month overpays by Rs 12,000");
eq(L.refundCheck(data.TAX_SLABS, 150000, 5000), -12000,
   "deducting Rs 5,000 a month underpays by Rs 12,000");

// 8. ATL checker: sample CNIC lookup.
eq(data.ATL_SAMPLES.length, 2, "ATL checker has 2 sample records");
eq(L.normalizeCNIC("35202-1234567-1"), "3520212345671", "dashes are stripped from a CNIC");
eq(L.normalizeCNIC("35202 1234567 1"), "3520212345671", "spaces are stripped from a CNIC");
eq(L.findATL(data.ATL_SAMPLES, "35202-1234567-1").name, "Ahmed Raza",
   "35202-1234567-1 finds Ahmed Raza");
eq(L.findATL(data.ATL_SAMPLES, "3520212345671").onATL, false,
   "Ahmed Raza is NOT on ATL");
eq(L.findATL(data.ATL_SAMPLES, "61101-7654321-2").name, "Sara Malik",
   "61101-7654321-2 finds Sara Malik");
eq(L.findATL(data.ATL_SAMPLES, "61101-7654321-2").onATL, true,
   "Sara Malik IS on ATL");
eq(L.findATL(data.ATL_SAMPLES, "12345-1234567-1"), null,
   "an unknown 13-digit CNIC finds nothing");
eq(L.findATL(data.ATL_SAMPLES, "35202"), null,
   "a short CNIC finds nothing");
eq(L.findATL(data.ATL_SAMPLES, ""), null, "an empty CNIC finds nothing");

// 9. Return checklist: 7 steps, progress maths.
eq(data.CHECKLIST_STEPS.length, 7, "checklist has 7 steps");
eq(data.CHECKLIST_STEPS[0].id, "register-ntn", "step 1 is Register NTN on IRIS");
eq(data.CHECKLIST_STEPS[6].id, "check-atl", "step 7 is Check ATL status");
deep(L.checklistProgress(data.CHECKLIST_STEPS, []),
     { done: 0, total: 7, pct: 0 }, "nothing done is 0 of 7, 0%");
deep(L.checklistProgress(data.CHECKLIST_STEPS,
     ["register-ntn", "salary-certificate", "bank-statements"]),
     { done: 3, total: 7, pct: 43 }, "3 of 7 done is 43%");
deep(L.checklistProgress(data.CHECKLIST_STEPS,
     data.CHECKLIST_STEPS.map(function (s) { return s.id; })),
     { done: 7, total: 7, pct: 100 }, "all 7 done is 100%");

// 10. Agent-spotter quiz: 4 red flags + 1 safe habit.
eq(data.SPOTTER_FLAGS.length, 5, "spotter quiz has 5 scenarios");
eq(data.SPOTTER_FLAGS.filter(function (f) { return f.isFlag; }).length, 4,
   "spotter quiz has 4 red flags");
eq(L.spotterAnswer(data.SPOTTER_FLAGS[0], true), true, "a Rs 12,000 agent fee is a red flag");
eq(L.spotterAnswer(data.SPOTTER_FLAGS[0], false), false, "calling it safe is wrong");
eq(L.spotterAnswer(data.SPOTTER_FLAGS[1], true), true, "guaranteed ATL in 24 hours is a red flag");
eq(L.spotterAnswer(data.SPOTTER_FLAGS[2], true), true, "asking for an IRIS password or OTP is a red flag");
eq(L.spotterAnswer(data.SPOTTER_FLAGS[3], true), true, "an FBR SMS payment link is a red flag");
eq(L.spotterAnswer(data.SPOTTER_FLAGS[4], false), true, "checking ATL yourself is safe");
eq(L.spotterAnswer(data.SPOTTER_FLAGS[4], true), false, "calling the safe habit a flag is wrong");
var perfect = {};
data.SPOTTER_FLAGS.forEach(function (f) { perfect[f.id] = f.isFlag; });
var sPerfect = L.scoreQuiz(data.SPOTTER_FLAGS, perfect);
eq(sPerfect.correct, 5, "perfect answers score 5 of 5");
eq(sPerfect.perfect, true, "perfect answers are perfect");
var sNone = L.scoreQuiz(data.SPOTTER_FLAGS, {});
eq(sNone.correct, 0, "no answers score 0 of 5");
eq(sNone.perfect, false, "no answers are not perfect");
var sHalf = L.scoreQuiz(data.SPOTTER_FLAGS, { "agent-fee": true, "guaranteed-atl": true });
eq(sHalf.correct, 2, "two right answers score 2 of 5");

// 11. Pakistani digit grouping.
eq(L.formatPKR(500), "500", "Rs 500");
eq(L.formatPKR(600), "600", "Rs 600");
eq(L.formatPKR(2400), "2,400", "Rs 2,400");
eq(L.formatPKR(6000), "6,000", "Rs 6,000");
eq(L.formatPKR(12000), "12,000", "Rs 12,000");
eq(L.formatPKR(18600), "18,600", "Rs 18,600");
eq(L.formatPKR(25000), "25,000", "Rs 25,000");
eq(L.formatPKR(72000), "72,000", "Rs 72,000");
eq(L.formatPKR(144000), "144,000", "Rs 144,000");
eq(L.formatPKR(1424000), "1,424,000", "Rs 1,424,000");

// 12. Persona: the canonical facts.
deep(data.PERSONA, { name: "Ahmed Raza", age: 38, city: "Lahore",
  job: "Accounts officer", monthly: 150000, annual: 1800000,
  taxPerYear: 72000, deductedPerMonth: 6000,
  withdrawalTaxPaid: 600, agentQuote: 12000, filed: false },
     "Ahmed Raza, 38, Lahore, accounts officer, Rs 150,000/month, Rs 6,000/month deducted, Rs 600 withdrawal tax, Rs 12,000 agent quote, never filed");

// 13. Every element id referenced by app.js exists in index.html.
var html = fs.readFileSync(__dirname + "/index.html", "utf8");
var appJs = fs.readFileSync(__dirname + "/app.js", "utf8");
var ids = {};
var m;
var idRe = /el\("([^"]+)"\)/g;
while ((m = idRe.exec(appJs)) !== null) ids[m[1]] = true;
var idList = Object.keys(ids);
ok(idList.length >= 20, "app.js references at least 20 element ids (" + idList.length + " found)");
idList.forEach(function (id) {
  ok(html.indexOf('id="' + id + '"') !== -1, "index.html defines id " + id);
});
["data.js", "logic.js", "app.js"].forEach(function (f) {
  ok(html.indexOf('src="' + f + '"') !== -1, "index.html loads " + f);
});
ok(html.indexOf('href="style.css"') !== -1, "index.html loads style.css");
// Tab buttons and sections exist for all six tabs.
["calculator", "atl", "checklist", "withholding", "spotter", "deadline"].forEach(function (t) {
  ok(html.indexOf('id="tab-' + t + '"') !== -1, "index.html defines tab " + t);
  ok(html.indexOf('id="section-' + t + '"') !== -1, "index.html defines section " + t);
});
// No phone number and no leftover text from previous projects.
ok(html.indexOf("0342") === -1 && html.indexOf("9011609") === -1, "index.html carries no phone number");
["MobilePak", "NetPak", "Challan", "Kiraya", "Silinder", "RemitPak", "Adalat"].forEach(function (word) {
  ok(html.indexOf(word) === -1, "index.html has no leftover " + word + " text");
});
// The pinned date is 18 Nov 2026.
ok(appJs.indexOf('"2026-11-18"') !== -1, "app.js pins today to 2026-11-18");

// 14. HTML tag balance: every opened tag is closed (void elements excluded).
var voidTags = { meta: 1, link: 1, input: 1, br: 1, hr: 1, img: 1 };
var stack = [];
var tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/g;
while ((m = tagRe.exec(html)) !== null) {
  var tag = m[1].toLowerCase();
  var raw = m[0];
  if (voidTags[tag]) continue;
  if (raw[1] === "/") {
    eq(stack.pop(), tag, "closing tag </" + tag + "> matches the last opened tag");
  } else if (raw[raw.length - 2] !== "/") {
    stack.push(tag);
  }
}
eq(stack.length, 0, "no unclosed tags remain (stack empty)");

console.log("\n" + n + " assertions passed.");
