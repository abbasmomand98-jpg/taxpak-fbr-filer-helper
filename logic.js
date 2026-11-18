// TaxPak — pure logic, no DOM here, so it can be unit-tested in Node.
(function (root) {
  // Thousands grouping, matching the figures used in the mockups,
  // slides and copy: 72000 -> "72,000", 25000 -> "25,000".
  function formatPKR(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Days between two ISO dates. 1 Nov -> 18 Nov is 17 days;
  // 30 Sep -> 31 Oct is 31 days.
  function daysBetween(fromISO, toISO) {
    var ms = Date.parse(toISO) - Date.parse(fromISO);
    return Math.round(ms / 86400000);
  }

  // Find the slab an annual income falls in. The top slab has no max.
  function findSlab(slabs, annual) {
    var found = slabs[slabs.length - 1];
    slabs.forEach(function (s) {
      if (annual > s.min && (s.max === null || annual <= s.max)) found = s;
    });
    if (annual <= 0) found = slabs[0];
    return found;
  }

  // Annual tax under the Finance Act 2026 TY2027 salaried slabs:
  // base + rate x (annual - slab min). Boundaries: 600,000 -> 0;
  // 1,200,000 -> 6,000; 2,200,000 -> 116,000; 3,200,000 ->
  // 316,000; 4,100,000 -> 541,000; 5,600,000 -> 976,000;
  // 7,000,000 -> 1,424,000.
  function calcTax(slabs, annual) {
    if (!annual || annual <= 0) return 0;
    var slab = findSlab(slabs, annual);
    return Math.round(slab.base + slab.rate * (annual - slab.min));
  }

  // Monthly tax from a monthly salary: 150,000/month -> 72,000/yr
  // -> 6,000/month. 85,000/month -> 4,200/yr -> 350/month.
  // 45,000/month -> 0.
  function monthlyTax(slabs, monthly) {
    if (!monthly || monthly <= 0) return 0;
    return Math.round(calcTax(slabs, monthly * 12) / 12);
  }

  // Take-home pay: salary minus monthly tax. 150,000 - 6,000 =
  // 144,000. 85,000 - 350 = 84,650. 45,000 - 0 = 45,000.
  function takeHome(slabs, monthly) {
    if (!monthly || monthly <= 0) return 0;
    return monthly - monthlyTax(slabs, monthly);
  }

  // Slab-by-slab breakdown of an annual tax bill, for the chart:
  // each slab shows the income inside it and the tax on it.
  // 1,800,000 breaks into 600,000 at 0% (Rs 0) + 600,000 at 1%
  // (Rs 6,000) + 600,000 at 11% (Rs 66,000) = Rs 72,000.
  function slabBreakdown(slabs, annual) {
    var rows = [];
    slabs.forEach(function (s) {
      var inSlab = 0;
      if (annual > s.min) {
        var top = s.max === null ? annual : Math.min(annual, s.max);
        inSlab = Math.max(0, top - s.min);
      }
      rows.push({ label: s.label, income: inSlab,
                  tax: Math.round(inSlab * s.rate) });
    });
    return rows;
  }

  // How many days late a TY2026 return is on "today": 1 Nov 2026
  // to 18 Nov 2026 is 17 days. On or before 31 Oct 2026 it is 0.
  function daysLate(deadline, todayISO) {
    if (Date.parse(todayISO) <= Date.parse(deadline.extendedISO)) return 0;
    return daysBetween(deadline.lateFromISO, todayISO);
  }

  // The ATL surcharge applies only to late individual filers:
  // Rs 25,000 when days late > 0, otherwise Rs 0.
  function atlSurcharge(deadline, todayISO) {
    return daysLate(deadline, todayISO) > 0 ? deadline.surcharge : 0;
  }

  // Withholding on one bank cash withdrawal over Rs 50,000/day
  // (sample FBR rate card): filer 0%, non-filer 0.6%.
  // Rs 100,000 -> non-filer pays Rs 600, filer pays Rs 0.
  // At or below Rs 50,000, nobody pays.
  function withholdingTax(amount, isFiler, rates) {
    if (!amount || amount <= rates.threshold) return 0;
    return Math.round(amount * (isFiler ? rates.filerRate : rates.nonFilerRate));
  }

  // A month's withholding loss: the rate applied to the month's
  // total withdrawals. Nov 2026: 4 withdrawals totalling
  // Rs 400,000 -> non-filer loss Rs 2,400.
  function monthlyLoss(month, rates) {
    return Math.round(month.total * rates.nonFilerRate);
  }

  // Year-to-date loss across the sample months: 4,200 + 3,600 +
  // 4,800 + 3,600 + 2,400 = Rs 18,600.
  function ytdLoss(months, rates) {
    var total = 0;
    months.forEach(function (m) { total += monthlyLoss(m, rates); });
    return total;
  }

  // Refund check: what the employer deducted in a year minus the
  // tax actually owed. Ahmed Raza: deducted 12 x Rs 6,000 =
  // Rs 72,000, tax Rs 72,000 -> refund Rs 0, nothing to claim.
  // A positive result is a refund; a negative one is extra tax due.
  function refundCheck(slabs, monthlySalary, deductedPerMonth) {
    var deducted = deductedPerMonth * 12;
    var owed = calcTax(slabs, monthlySalary * 12);
    return deducted - owed;
  }

  // Normalise a CNIC so "35202-1234567-1", "35202 1234567 1" and
  // "3520212345671" all match the same sample record.
  function normalizeCNIC(raw) {
    return String(raw || "").replace(/[^0-9]/g, "");
  }

  // Find a sample ATL record by CNIC. Returns the record or null.
  // "35202-1234567-1" finds Ahmed Raza (not on ATL);
  // "61101-7654321-2" finds Sara Malik (on ATL);
  // "12345-1234567-1" finds nothing.
  function findATL(samples, raw) {
    var q = normalizeCNIC(raw);
    if (q.length !== 13) return null;
    var found = null;
    samples.forEach(function (s) {
      if (normalizeCNIC(s.cnic) === q) found = s;
    });
    return found;
  }

  // Checklist progress: how many of the 7 steps are done.
  // 3 of 7 done is 43% (rounded).
  function checklistProgress(steps, doneIds) {
    var done = 0;
    steps.forEach(function (s) {
      if (doneIds.indexOf(s.id) !== -1) done++;
    });
    return { done: done, total: steps.length,
             pct: steps.length ? Math.round(done / steps.length * 100) : 0 };
  }

  // Agent-spotter quiz: each flag has isFlag true/false. Answering
  // "flag" for a real flag (or "safe" for the safe habit) is correct.
  function spotterAnswer(flag, saidFlag) {
    return flag.isFlag === saidFlag;
  }

  function scoreQuiz(flags, answers) {
    var correct = 0;
    flags.forEach(function (f) {
      if (answers[f.id] === f.isFlag) correct++;
    });
    return { correct: correct, total: flags.length,
             perfect: correct === flags.length };
  }

  var api = { formatPKR: formatPKR,
              daysBetween: daysBetween,
              findSlab: findSlab,
              calcTax: calcTax,
              monthlyTax: monthlyTax,
              takeHome: takeHome,
              slabBreakdown: slabBreakdown,
              daysLate: daysLate,
              atlSurcharge: atlSurcharge,
              withholdingTax: withholdingTax,
              monthlyLoss: monthlyLoss,
              ytdLoss: ytdLoss,
              refundCheck: refundCheck,
              normalizeCNIC: normalizeCNIC,
              findATL: findATL,
              checklistProgress: checklistProgress,
              spotterAnswer: spotterAnswer,
              scoreQuiz: scoreQuiz };
  if (typeof module !== "undefined") { module.exports = api; }
  else { root.TaxPakLogic = api; }
})(typeof window !== "undefined" ? window : globalThis);
