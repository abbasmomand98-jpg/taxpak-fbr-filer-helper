// TaxPak DOM smoke test — run with: node dom-smoke.js
// Executes data.js + logic.js + app.js in a tiny fake DOM (vm sandbox)
// and asserts the page renders the canonical figures.
var fs = require("fs");
var vm = require("vm");
var assert = require("assert");

function FakeEl(tag) {
  this.tagName = (tag || "div").toUpperCase();
  this.children = [];
  this._html = "";
  this.textContent = "";
  this.value = "";
  this.checked = false;
  this.disabled = false;
  this.className = "";
  this.style = {};
  this.listeners = {};
  this.attributes = {};
  this.type = "";
}
FakeEl.prototype.addEventListener = function (ev, fn) {
  (this.listeners[ev] = this.listeners[ev] || []).push(fn);
};
FakeEl.prototype.appendChild = function (child) { this.children.push(child); return child; };
FakeEl.prototype.setAttribute = function (k, v) { this.attributes[k] = v; };
FakeEl.prototype.getAttribute = function (k) { return this.attributes[k]; };
Object.defineProperty(FakeEl.prototype, "innerHTML", {
  get: function () { return this._html; },
  set: function (v) { this._html = String(v); this.children = []; }
});

var byId = {};
function el(id) {
  if (!byId[id]) byId[id] = new FakeEl("div");
  return byId[id];
}
var documentStub = {
  getElementById: el,
  createElement: function (tag) { return new FakeEl(tag); }
};
var store = {};
var localStorageStub = {
  getItem: function (k) { return store[k] || null; },
  setItem: function (k, v) { store[k] = String(v); }
};
function fire(id, ev, arg) {
  (byId[id].listeners[ev] || []).forEach(function (fn) { fn(arg || {}); });
}
function fireEl(node, ev, arg) {
  (node.listeners[ev] || []).forEach(function (fn) { fn(arg || {}); });
}

var sandbox = { document: documentStub, localStorage: localStorageStub, console: console,
  Date: Date, setInterval: function () { return 0; }, clearInterval: function () {} };
sandbox.window = sandbox;
vm.createContext(sandbox);
// Pre-seed the fake DOM with the defaults index.html declares in markup
// (the fake DOM does not parse value/selected attributes).
el("salary-input").value = "150000";
el("deduct-input").value = "6000";
el("withdraw-input").value = "100000";
el("cnic-input").value = "";
["data.js", "logic.js", "app.js"].forEach(function (f) {
  vm.runInContext(fs.readFileSync(f, "utf8"), sandbox, { filename: f });
});

var n = 0;
function eq(a, b, msg) { assert.strictEqual(a, b, msg); n++; }
function ok(v, msg) { assert.ok(v, msg); n++; }

// 1. Calculator tab is active on load; Rs 150,000/month renders Rs 72,000 tax.
eq(el("section-calculator").style.display, "block", "calculator section shows on load");
ok(el("calc-result").innerHTML.indexOf("Rs 72,000") !== -1, "calc shows annual tax Rs 72,000");
ok(el("calc-result").innerHTML.indexOf("Rs 6,000") !== -1, "calc shows monthly tax Rs 6,000");
ok(el("calc-result").innerHTML.indexOf("Rs 144,000") !== -1, "calc shows take-home Rs 144,000");
eq(el("examples-list").children.length, 3, "worked examples render 3 rows");
ok(el("examples-list").children[0].innerHTML.indexOf("Rs 150,000") !== -1, "first example is Rs 150,000 a month");
ok(el("examples-list").children[1].innerHTML.indexOf("Rs 4,200") !== -1, "second example shows Rs 4,200 a year");
ok(el("examples-list").children[2].innerHTML.indexOf("Rs 45,000") !== -1, "third example is Rs 45,000 a month");
eq(el("slab-list").children.length, 3, "slab breakdown renders 3 non-empty slabs for Rs 1,800,000");
ok(el("slab-list").children[2].innerHTML.indexOf("Rs 66,000") !== -1, "third slab tax is Rs 66,000");
ok(el("calc-summary").textContent.indexOf("18 Nov 2026") !== -1, "summary names 18 Nov 2026");

// 2. Change salary: Rs 85,000/month -> Rs 4,200/yr, Rs 350/month, Rs 84,650 take-home.
el("salary-input").value = "85000";
fire("salary-input", "input");
ok(el("calc-result").innerHTML.indexOf("Rs 4,200") !== -1, "Rs 85,000 a month pays Rs 4,200 a year");
ok(el("calc-result").innerHTML.indexOf("Rs 350") !== -1, "Rs 85,000 a month pays Rs 350 a month");
ok(el("calc-result").innerHTML.indexOf("Rs 84,650") !== -1, "Rs 85,000 a month takes home Rs 84,650");
el("salary-input").value = "45000";
fire("salary-input", "input");
ok(el("calc-result").innerHTML.indexOf("Rs 0") !== -1, "Rs 45,000 a month pays Rs 0");
el("salary-input").value = "150000";
fire("salary-input", "input");
ok(el("calc-result").innerHTML.indexOf("Rs 72,000") !== -1, "restoring Rs 150,000 restores Rs 72,000");

// 3. ATL tab: Ahmed Raza not on ATL (17 days late, Rs 25,000); Sara Malik on ATL.
fire("tab-atl", "click");
eq(el("section-atl").style.display, "block", "ATL section shows on tab click");
eq(el("section-calculator").style.display, "none", "calculator section hides on tab click");
el("cnic-input").value = "35202-1234567-1";
fire("atl-btn", "click");
ok(el("atl-result").innerHTML.indexOf("NOT ON THE ACTIVE TAXPAYERS LIST") !== -1, "Ahmed Raza is NOT on ATL");
ok(el("atl-result").innerHTML.indexOf("Ahmed Raza") !== -1, "ATL result names Ahmed Raza");
ok(el("atl-result").innerHTML.indexOf("17 days late") !== -1, "ATL result says 17 days late");
ok(el("atl-result").innerHTML.indexOf("Rs 25,000") !== -1, "ATL result names the Rs 25,000 surcharge");
el("cnic-input").value = "61101-7654321-2";
fire("atl-btn", "click");
ok(el("atl-result").innerHTML.indexOf("ON THE ACTIVE TAXPAYERS LIST") !== -1, "Sara Malik IS on ATL");
ok(el("atl-result").innerHTML.indexOf("Sara Malik") !== -1, "ATL result names Sara Malik");
el("cnic-input").value = "12345-1234567-1";
fire("atl-btn", "click");
ok(el("atl-result").innerHTML.indexOf("NO SAMPLE RECORD") !== -1, "an unknown CNIC shows no sample record");
el("cnic-input").value = "";
fire("cnic-input", "input");
eq(el("atl-result").innerHTML, "", "clearing the CNIC clears the result");

// 4. Refund check: Rs 6,000 deducted -> Rs 0; Rs 7,000 -> Rs 12,000 refund.
ok(el("refund-result").innerHTML.indexOf("REFUND Rs 0") !== -1, "default refund is Rs 0");
el("deduct-input").value = "7000";
fire("refund-btn", "click");
ok(el("refund-result").innerHTML.indexOf("REFUND DUE: Rs 12,000") !== -1, "deducting Rs 7,000 a month refunds Rs 12,000");
el("deduct-input").value = "5000";
fire("refund-btn", "click");
ok(el("refund-result").innerHTML.indexOf("EXTRA TAX DUE: Rs 12,000") !== -1, "deducting Rs 5,000 a month leaves Rs 12,000 due");
el("deduct-input").value = "6000";
fire("refund-btn", "click");
ok(el("refund-result").innerHTML.indexOf("REFUND Rs 0") !== -1, "restoring Rs 6,000 restores refund Rs 0");

// 5. Checklist tab: 7 steps, progress 0 of 7; ticking one saves it.
fire("tab-checklist", "click");
eq(el("section-checklist").style.display, "block", "checklist section shows on tab click");
ok(el("checklist-progress").textContent.indexOf("0 of 7 steps done") !== -1, "checklist starts 0 of 7");
ok(el("checklist-progress").textContent.indexOf("0%") !== -1, "checklist starts at 0%");
eq(el("checklist-list").children.length, 7, "checklist renders 7 steps");
var firstStep = el("checklist-list").children[0];
var firstCb = firstStep.children[0];
eq(firstCb.tagName, "INPUT", "checklist step carries a checkbox");
firstCb.checked = true;
fireEl(firstCb, "change");
ok(el("checklist-progress").textContent.indexOf("1 of 7 steps done") !== -1, "ticking one step shows 1 of 7");
ok(el("checklist-progress").textContent.indexOf("14%") !== -1, "1 of 7 is 14%");
ok((store["taxpak-checklist"] || "").indexOf("register-ntn") !== -1, "ticked step persists in localStorage");

// 6. Withholding tab: Rs 100,000 -> filer Rs 0, non-filer Rs 600; ledger Rs 18,600.
fire("tab-withholding", "click");
eq(el("section-withholding").style.display, "block", "withholding section shows on tab click");
ok(el("withdraw-result").innerHTML.indexOf("FILER PAYS Rs 0") !== -1, "filer pays Rs 0 on Rs 100,000");
ok(el("withdraw-result").innerHTML.indexOf("NON-FILER PAYS Rs 600") !== -1, "non-filer pays Rs 600 on Rs 100,000");
eq(el("withdrawal-list").children.length, 5, "withdrawal ledger renders 5 months");
ok(el("withdrawal-list").children[4].innerHTML.indexOf("Rs 2,400") !== -1, "November loss is Rs 2,400");
ok(el("withdrawal-summary").textContent.indexOf("Rs 18,600") !== -1, "year-to-date loss is Rs 18,600");
el("withdraw-input").value = "40000";
fire("withdraw-input", "input");
ok(el("withdraw-result").innerHTML.indexOf("NO WITHHOLDING") !== -1, "Rs 40,000 carries no withholding");
el("withdraw-input").value = "100000";
fire("withdraw-input", "input");
ok(el("withdraw-result").innerHTML.indexOf("NON-FILER PAYS Rs 600") !== -1, "restoring Rs 100,000 restores Rs 600");

// 7. Spotter tab: 5 questions, perfect score after correct answers.
fire("tab-spotter", "click");
eq(el("section-spotter").style.display, "block", "spotter section shows on tab click");
eq(el("spotter-quiz").children.length, 5, "spotter quiz renders 5 questions");
fire("spotter-btn", "click");
ok(el("spotter-result").innerHTML.indexOf("0 OF 5 CORRECT") !== -1, "no answers score 0 of 5");
var qs = el("spotter-quiz").children;
for (var i = 0; i < 4; i++) {
  fireEl(qs[i].children[1], "click"); // "Red flag" for the 4 real flags
}
fireEl(qs[4].children[2], "click"); // "Safe" for the safe habit
fire("spotter-btn", "click");
ok(el("spotter-result").innerHTML.indexOf("5 OF 5 CORRECT") !== -1, "correct answers score 5 of 5");
ok(el("spotter-result").innerHTML.indexOf("Rs 12,000") !== -1, "spotter result explains the Rs 12,000 agent fee");

// 8. Deadline tab: 17 days late, Rs 25,000 surcharge, next due 30 Sep 2027.
fire("tab-deadline", "click");
eq(el("section-deadline").style.display, "block", "deadline section shows on tab click");
ok(el("deadline-box").innerHTML.indexOf("17 DAYS LATE") !== -1, "deadline shows 17 DAYS LATE");
ok(el("deadline-box").innerHTML.indexOf("Rs 25,000") !== -1, "deadline names the Rs 25,000 surcharge");
ok(el("deadline-box").innerHTML.indexOf("7.3 million") !== -1, "deadline names 7.3 million returns");
ok(el("deadline-box").innerHTML.indexOf("30 Sep 2027") !== -1, "deadline names the next due date 30 Sep 2027");

// 9. Reset restores the canonical defaults.
fire("reset-demo", "click");
eq(el("section-calculator").style.display, "block", "reset returns to the calculator tab");
ok(el("calc-result").innerHTML.indexOf("Rs 72,000") !== -1, "reset restores Rs 72,000 tax");
ok(el("checklist-progress").textContent.indexOf("0 of 7 steps done") !== -1, "reset clears the checklist");
ok(el("spotter-result").innerHTML === "", "reset clears the spotter result");
eq(el("salary-input").value, "150000", "reset restores salary Rs 150,000");

console.log("\n" + n + " DOM assertions passed.");
