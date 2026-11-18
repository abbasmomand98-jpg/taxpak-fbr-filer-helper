// TaxPak — page wiring. All rules live in logic.js; this file only renders.
// "Today" is pinned to 2026-11-18 so the sample figures (TY2026
// return 17 days late, Rs 25,000 ATL surcharge; Rs 150,000/month
// salary -> Rs 72,000/year tax, Rs 6,000/month, take-home
// Rs 144,000/month; November withholding loss Rs 2,400;
// year-to-date sample loss Rs 18,600) stay stable no matter when
// you open it.
(function () {
  var L = window.TaxPakLogic;
  var TODAY = "2026-11-18";
  var TODAY_LABEL = "18 Nov 2026";
  var STORE_CHECKLIST = "taxpak-checklist";
  var STORE_SPOTTER = "taxpak-spotter-answers";

  function el(id) { return document.getElementById(id); }
  function rs(n) { return "Rs " + L.formatPKR(n); }

  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; }
    catch (e) { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  var doneIds = loadJSON(STORE_CHECKLIST, []);
  var spotterAnswers = loadJSON(STORE_SPOTTER, {});

  // ---- Tabs ----
  var TABS = ["calculator", "atl", "checklist", "withholding", "spotter", "deadline"];
  function showTab(name) {
    TABS.forEach(function (t) {
      el("section-" + t).style.display = (t === name) ? "block" : "none";
      el("tab-" + t).className = "tab-btn" + (t === name ? " active" : "");
    });
  }
  TABS.forEach(function (t) {
    el("tab-" + t).addEventListener("click", function () { showTab(t); });
  });
  showTab("calculator");

  // ---- Tax calculator ----
  function renderCalc() {
    var monthly = parseInt(el("salary-input").value, 10);
    if (isNaN(monthly) || monthly < 0) monthly = 0;
    var annual = monthly * 12;
    var tax = L.calcTax(TAX_SLABS, annual);
    var mTax = L.monthlyTax(TAX_SLABS, monthly);
    var home = L.takeHome(TAX_SLABS, monthly);
    var slab = L.findSlab(TAX_SLABS, annual);
    el("calc-result").innerHTML =
      '<div class="total"><strong>ANNUAL TAX ' + rs(tax) + " \u00b7 " + rs(mTax) +
      " A MONTH \u00b7 TAKE-HOME " + rs(home) + " A MONTH</strong>" +
      "<p>Monthly salary " + rs(monthly) + " = annual income " + rs(annual) +
      ". Your slab: " + slab.label + ". No surcharge on salaried income. " +
      "Finance Act 2026, Tax Year 2027 — sample rates, verify on fbr.gov.pk.</p></div>";
    var box = el("examples-list");
    box.innerHTML = "";
    WORKED_EXAMPLES.forEach(function (ex) {
      var div = document.createElement("div");
      div.className = "bundle" + (ex.monthly === monthly ? " best" : "");
      div.innerHTML = "<div><h3>" + rs(ex.monthly) + " a month</h3>" +
        "<p>Annual income " + rs(ex.annual) + " \u00b7 take-home " + rs(ex.takeHome) + " a month</p></div>" +
        '<div class="recv">TAX ' + rs(ex.tax) + " A YEAR" +
        "<span>" + rs(ex.monthlyTax) + " a month</span></div>";
      box.appendChild(div);
    });
    var sbox = el("slab-list");
    sbox.innerHTML = "";
    L.slabBreakdown(TAX_SLABS, annual).forEach(function (row) {
      if (row.income <= 0) return;
      var div = document.createElement("div");
      div.className = "bundle";
      div.innerHTML = "<div><h3>" + row.label + "</h3>" +
        "<p>" + rs(row.income) + " of your income sits in this slab</p></div>" +
        '<div class="recv">' + rs(row.tax) + "<span>tax in this slab</span></div>";
      sbox.appendChild(div);
    });
    el("calc-summary").textContent = "Tax Year 2027 salaried slabs \u00b7 checked " +
      TODAY_LABEL + " \u00b7 sample rates, verify on fbr.gov.pk.";
  }
  el("salary-input").addEventListener("input", renderCalc);
  el("calc-btn").addEventListener("click", renderCalc);
  renderCalc();

  // ---- ATL checker ----
  function renderATL() {
    var raw = el("cnic-input").value || "";
    var box = el("atl-result");
    if (!raw.trim()) { box.innerHTML = ""; return; }
    var found = L.findATL(ATL_SAMPLES, raw);
    if (!found) {
      box.innerHTML = '<div class="alert notfound"><strong>NO SAMPLE RECORD FOR THAT CNIC</strong>' +
        "<p>" + raw + " is not one of the two sample CNICs. Try 35202-1234567-1 (Ahmed Raza, not on ATL) or 61101-7654321-2 (Sara Malik, on ATL).</p></div>";
      return;
    }
    if (found.onATL) {
      box.innerHTML = '<div class="alert ok"><strong>\u2713 ON THE ACTIVE TAXPAYERS LIST \u2014 ' +
        found.name + "</strong>" +
        "<p>" + found.city + " \u00b7 CNIC " + found.display + ". " + found.note + "</p></div>";
    } else {
      var late = L.daysLate(DEADLINE, TODAY);
      var sur = L.atlSurcharge(DEADLINE, TODAY);
      box.innerHTML = '<div class="alert risk"><strong>NOT ON THE ACTIVE TAXPAYERS LIST \u2014 ' +
        found.name + "</strong>" +
        "<p>" + found.city + " \u00b7 CNIC " + found.display + ". " + found.note +
        " Today is " + TODAY_LABEL + " — " + late + " days late. Surcharge to rejoin: " +
        rs(sur) + " (Section 182A).</p></div>";
    }
  }
  el("cnic-input").addEventListener("input", renderATL);
  el("atl-btn").addEventListener("click", renderATL);

  function renderRefund() {
    var monthly = parseInt(el("salary-input").value, 10);
    if (isNaN(monthly) || monthly < 0) monthly = 0;
    var deducted = parseInt(el("deduct-input").value, 10);
    if (isNaN(deducted) || deducted < 0) deducted = 0;
    var refund = L.refundCheck(TAX_SLABS, monthly, deducted);
    var owed = L.calcTax(TAX_SLABS, monthly * 12);
    var msg;
    if (refund > 0) {
      msg = "Your employer deducted " + rs(deducted * 12) + " in the year but your tax is " +
        rs(owed) + " — you overpaid " + rs(refund) + ". Claim it back when you file.";
    } else if (refund < 0) {
      msg = "Your employer deducted " + rs(deducted * 12) + " in the year but your tax is " +
        rs(owed) + " — you still owe " + rs(-refund) + ". Pay it with the return.";
    } else {
      msg = "Your employer deducted " + rs(deducted * 12) + " in the year and your tax is exactly " +
        rs(owed) + " — refund Rs 0. Nothing to claim, nothing extra due.";
    }
    el("refund-result").innerHTML =
      '<div class="alert ' + (refund > 0 ? "ok" : (refund < 0 ? "risk" : "warn")) + '"><strong>' +
      (refund > 0 ? "REFUND DUE: " + rs(refund) : (refund < 0 ? "EXTRA TAX DUE: " + rs(-refund) : "REFUND Rs 0")) +
      "</strong><p>" + msg + "</p></div>";
  }
  el("deduct-input").addEventListener("input", renderRefund);
  el("refund-btn").addEventListener("click", renderRefund);
  renderRefund();

  // ---- Return checklist (7 steps, progress, localStorage) ----
  function renderChecklist() {
    var prog = L.checklistProgress(CHECKLIST_STEPS, doneIds);
    el("checklist-progress").textContent = prog.done + " of " + prog.total +
      " steps done \u00b7 " + prog.pct + "% \u00b7 about 30 minutes to file on IRIS.";
    var box = el("checklist-list");
    box.innerHTML = "";
    CHECKLIST_STEPS.forEach(function (step, i) {
      var div = document.createElement("div");
      var isDone = doneIds.indexOf(step.id) !== -1;
      div.className = "checklist-item" + (isDone ? " done" : "");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = isDone;
      cb.addEventListener("change", function () {
        var at = doneIds.indexOf(step.id);
        if (cb.checked && at === -1) { doneIds.push(step.id); }
        if (!cb.checked && at !== -1) { doneIds.splice(at, 1); }
        saveJSON(STORE_CHECKLIST, doneIds);
        renderChecklist();
      });
      var lab = document.createElement("label");
      lab.textContent = (i + 1) + ". " + step.title + " \u2014 " + step.detail;
      div.appendChild(cb);
      div.appendChild(lab);
      box.appendChild(div);
    });
  }
  renderChecklist();

  // ---- Withholding tracker ----
  function renderWithdraw() {
    var amount = parseInt(el("withdraw-input").value, 10);
    if (isNaN(amount) || amount < 0) amount = 0;
    var filerTax = L.withholdingTax(amount, true, WITHHOLDING);
    var nonTax = L.withholdingTax(amount, false, WITHHOLDING);
    var box = el("withdraw-result");
    if (amount <= WITHHOLDING.threshold) {
      box.innerHTML = '<div class="alert ok"><strong>NO WITHHOLDING ON ' + rs(amount) + "</strong>" +
        "<p>Cash withdrawals up to " + rs(WITHHOLDING.threshold) + " a day carry no withholding — filer or non-filer.</p></div>";
    } else {
      box.innerHTML = '<div class="alert ' + (nonTax > 0 ? "warn" : "ok") + '"><strong>FILER PAYS ' +
        rs(filerTax) + " \u00b7 NON-FILER PAYS " + rs(nonTax) + "</strong>" +
        "<p>On a " + rs(amount) + " cash withdrawal: a filer pays 0%, a non-filer pays 0.6% — " +
        rs(nonTax) + " gone. That is the price of not filing.</p></div>";
    }
    var list = el("withdrawal-list");
    list.innerHTML = "";
    WITHDRAWAL_MONTHS.forEach(function (m) {
      var div = document.createElement("div");
      div.className = "bundle" + (m.month === "Nov 2026" ? " best" : "");
      div.innerHTML = "<div><h3>" + m.month + "</h3>" +
        "<p>" + m.count + " withdrawals \u00b7 " + rs(m.total) + " withdrawn</p></div>" +
        '<div class="recv">' + rs(m.loss) + "<span>non-filer loss</span></div>";
      list.appendChild(div);
    });
    el("withdrawal-summary").textContent = "Year-to-date sample loss: " +
      rs(L.ytdLoss(WITHDRAWAL_MONTHS, WITHHOLDING)) +
      " \u00b7 a filer would have lost Rs 0 \u00b7 sample rates, verify on fbr.gov.pk.";
  }
  el("withdraw-input").addEventListener("input", renderWithdraw);
  el("withdraw-btn").addEventListener("click", renderWithdraw);
  renderWithdraw();

  // ---- Agent-spotter quiz ----
  function renderSpotter() {
    var box = el("spotter-quiz");
    box.innerHTML = "";
    SPOTTER_FLAGS.forEach(function (flag, i) {
      var div = document.createElement("div");
      div.className = "spotter-q";
      var chosen = spotterAnswers[flag.id];
      var btnFlag = document.createElement("button");
      btnFlag.textContent = "Red flag";
      btnFlag.className = chosen === true ? "flag-btn chosen" : "flag-btn";
      btnFlag.addEventListener("click", function () {
        spotterAnswers[flag.id] = true;
        saveJSON(STORE_SPOTTER, spotterAnswers);
        renderSpotter();
      });
      var btnSafe = document.createElement("button");
      btnSafe.textContent = "Safe";
      btnSafe.className = "secondary" + (chosen === false ? " chosen" : "");
      btnSafe.addEventListener("click", function () {
        spotterAnswers[flag.id] = false;
        saveJSON(STORE_SPOTTER, spotterAnswers);
        renderSpotter();
      });
      var p = document.createElement("p");
      p.innerHTML = "<strong>" + (i + 1) + ". </strong>" + flag.scenario;
      div.appendChild(p);
      div.appendChild(btnFlag);
      div.appendChild(btnSafe);
      box.appendChild(div);
    });
  }
  renderSpotter();

  el("spotter-btn").addEventListener("click", function () {
    var score = L.scoreQuiz(SPOTTER_FLAGS, spotterAnswers);
    var html = '<div class="alert ' + (score.perfect ? "ok" : "warn") + '"><strong>' +
      score.correct + " OF " + score.total + " CORRECT" + "</strong><p>" +
      (score.perfect ? "Perfect — you spot all four agent traps and the safe habit."
                     : "Check the ones you missed below — the spotter catches them before the money moves.") +
      "</p></div>";
    SPOTTER_FLAGS.forEach(function (flag) {
      var right = L.spotterAnswer(flag, spotterAnswers[flag.id]);
      var answered = spotterAnswers.hasOwnProperty(flag.id);
      html += '<div class="alert ' + (!answered ? "notfound" : (right ? "ok" : "risk")) + '"><strong>' +
        (answered ? (right ? "✓ CORRECT — " : "✗ MISSED — ") : "NOT ANSWERED — ") +
        (flag.isFlag ? "RED FLAG" : "SAFE") + "</strong><p>" + flag.why + "</p></div>";
    });
    el("spotter-result").innerHTML = html;
  });

  // ---- Late-filing explainer timeline ----
  function renderDeadline() {
    var late = L.daysLate(DEADLINE, TODAY);
    var sur = L.atlSurcharge(DEADLINE, TODAY);
    var html = '<div class="total"><strong>' + late + " DAYS LATE \u00b7 ATL SURCHARGE " + rs(sur) + "</strong>" +
      "<p>Today is " + TODAY_LABEL + ". The TY2026 return was due " + DEADLINE.dueLabel +
      ", extended to " + DEADLINE.extendedLabel + ". FBR received " + DEADLINE.returnsFiled +
      " returns by " + DEADLINE.returnsFiledDate + ". Late from " + DEADLINE.lateFromLabel +
      " — rejoining the Active Taxpayers List costs an individual " + rs(sur) +
      " (Section 182A). ATL updates " + DEADLINE.atlUpdate + "; published " +
      DEADLINE.atlPublished + ".</p></div>";
    DEADLINE_EVENTS.forEach(function (ev) {
      html += '<div class="bundle"><div><h3>' + ev.date + " — " + ev.title + "</h3>" +
        "<p>" + ev.body + "</p></div></div>";
    });
    el("deadline-box").innerHTML = html;
  }
  renderDeadline();

  el("reset-demo").addEventListener("click", function () {
    doneIds = [];
    spotterAnswers = {};
    saveJSON(STORE_CHECKLIST, doneIds);
    saveJSON(STORE_SPOTTER, spotterAnswers);
    el("salary-input").value = "150000";
    el("cnic-input").value = "";
    el("atl-result").innerHTML = "";
    el("deduct-input").value = "6000";
    el("withdraw-input").value = "100000";
    el("spotter-result").innerHTML = "";
    showTab("calculator");
    renderCalc();
    renderRefund();
    renderChecklist();
    renderWithdraw();
    renderSpotter();
    renderDeadline();
  });
})();
