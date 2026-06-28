/* cycle — a gentle period & cycle tracker
 * Vanilla JS, no dependencies. Data lives in localStorage on the device.
 */
(function () {
  "use strict";

  // ---------- App meta ----------
  const APP_VERSION = "0.1";

  // ---------- Storage ----------
  const KEY = "cycle.data.v1";
  const DEFAULTS = { periods: [], logs: {}, settings: { cycleLength: 28, periodLength: 5 }, pcos: {} };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(DEFAULTS);
      const d = JSON.parse(raw);
      return Object.assign(structuredClone(DEFAULTS), d);
    } catch (e) {
      return structuredClone(DEFAULTS);
    }
  }
  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  let state = load();

  // ---------- Date helpers (work in local time, key by YYYY-MM-DD) ----------
  const MS_DAY = 86400000;
  function iso(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function parse(s) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  function addDays(s, n) {
    const d = parse(s);
    d.setDate(d.getDate() + n);
    return iso(d);
  }
  function daysBetween(a, b) {
    return Math.round((parse(b) - parse(a)) / MS_DAY);
  }
  function todayISO() { return iso(new Date()); }
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function prettyDate(s) {
    const d = parse(s);
    const wd = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()];
    return `${wd}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
  }

  // ---------- Catalogs ----------
  const SYMPTOMS = [
    ["🩸","Cramps"],["🤕","Headache"],["💢","Backache"],["🫨","Bloating"],
    ["🍈","Tender breasts"],["😴","Fatigue"],["🥴","Dizziness"],["🌡️","Hot flashes"],
    ["🤧","Acne"],["🍫","Cravings"],["💤","Insomnia"],["🥵","Sweating"],
    ["🤢","Nausea"],["💩","Diarrhea"],["🚽","Constipation"],["🦵","Leg pain"],
    ["😖","Pelvic pain"],["💧","Spotting"],["🌀","Brain fog"],["🫠","Low energy"]
  ];
  const MOODS = [
    ["😄","Happy"],["😌","Calm"],["⚡","Energetic"],["🥰","Loving"],
    ["🤩","Confident"],["😍","Excited"],["😐","Neutral"],["😴","Tired"],
    ["😢","Sad"],["😭","Tearful"],["😠","Irritable"],["😤","Frustrated"],
    ["😰","Anxious"],["😟","Worried"],["🥺","Sensitive"],["😶‍🌫️","Foggy"],
    ["🙃","Moody"],["😩","Overwhelmed"],["🫥","Numb"],["💪","Motivated"]
  ];

  const EXERCISES = [
    ["Menstrual (days 1–5)", "Energy is lowest — be kind to yourself.", [
      "Gentle yoga & restorative stretching",
      "Slow walks in fresh air",
      "Light Pilates or mobility work",
      "Deep-breathing & meditation",
      "Rest is productive too — honor it"
    ]],
    ["Follicular (days 6–13)", "Energy rising — a great time to build.", [
      "Cardio: running, cycling, dance",
      "Strength training (progressive)",
      "HIIT or boot-camp classes",
      "Try a new, challenging workout",
      "Hiking & longer sessions"
    ]],
    ["Ovulation (~day 14)", "Peak energy & strength.", [
      "High-intensity intervals (HIIT)",
      "Heavy lifting / personal bests",
      "Group sports & spin classes",
      "Sprints & power moves"
    ]],
    ["Luteal (days 15–28)", "Energy tapers — ease off gradually.", [
      "Moderate strength training",
      "Steady-state cardio (zone 2)",
      "Yoga, Pilates & barre",
      "Swimming & longer walks",
      "Wind down as your period nears"
    ]]
  ];

  const FOODS = [
    ["Iron-rich foods 🥩", "You lose iron with menstrual blood — top it back up.", [
      "Leafy greens (spinach, kale)",
      "Lentils, beans & tofu",
      "Red meat & poultry",
      "Pumpkin seeds & dark chocolate",
      "Pair with vitamin C for absorption"
    ]],
    ["Anti-cramp & magnesium 🍌", "Helps relax muscles and ease cramps.", [
      "Bananas & avocados",
      "Almonds & cashews",
      "Dark chocolate (70%+)",
      "Whole grains & oats"
    ]],
    ["Hydration & comfort 🍵", "Reduce bloating and stay steady.", [
      "Plenty of water",
      "Ginger or peppermint tea",
      "Chamomile to relax",
      "Warm soups & broths"
    ]],
    ["Omega-3 & mood 🐟", "May ease pain and lift mood.", [
      "Salmon, sardines, mackerel",
      "Walnuts & chia seeds",
      "Flaxseed",
      "Berries & citrus for antioxidants"
    ]],
    ["Go easy on 🚫", "These can worsen bloating & cramps for some.", [
      "Excess salt & processed snacks",
      "Too much caffeine",
      "Alcohol",
      "Lots of refined sugar"
    ]]
  ];

  const PCOS_QUESTIONS = [
    "My periods are often irregular, infrequent, or absent",
    "I have cycles longer than 35 days, or fewer than 8 periods a year",
    "I have excess hair growth on the face, chest, or back (hirsutism)",
    "I experience persistent acne or very oily skin",
    "I've noticed hair thinning or male-pattern hair loss",
    "I find it difficult to lose weight, or have gained weight easily",
    "I have darkened patches of skin (neck, armpits, groin)",
    "I've had difficulty getting pregnant",
    "I have frequent sugar cravings or energy crashes",
    "A close relative has been diagnosed with PCOS or type 2 diabetes"
  ];

  // ---------- Predictions ----------
  function sortedPeriods() {
    return [...state.periods].sort((a, b) => parse(a.start) - parse(b.start));
  }
  function avgCycleLength() {
    const ps = sortedPeriods();
    if (ps.length < 2) return state.settings.cycleLength || 28;
    const gaps = [];
    for (let i = 1; i < ps.length; i++) {
      const g = daysBetween(ps[i - 1].start, ps[i].start);
      if (g >= 18 && g <= 60) gaps.push(g); // ignore outliers
    }
    if (!gaps.length) return state.settings.cycleLength || 28;
    return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  }
  function avgPeriodLength() {
    const ps = sortedPeriods().filter(p => p.end);
    if (!ps.length) return state.settings.periodLength || 5;
    const lens = ps.map(p => Math.max(1, daysBetween(p.start, p.end) + 1)).filter(l => l <= 14);
    if (!lens.length) return state.settings.periodLength || 5;
    return Math.round(lens.reduce((a, b) => a + b, 0) / lens.length);
  }

  // Returns prediction object based on the most recent period start.
  function predict() {
    const ps = sortedPeriods();
    if (!ps.length) return null;
    const cycle = avgCycleLength();
    const periodLen = avgPeriodLength();
    const last = ps[ps.length - 1].start;
    const today = todayISO();

    // Project forward until predicted start is in the future (next cycle).
    let nextStart = last;
    let guard = 0;
    while (daysBetween(today, nextStart) < 0 && guard < 60) {
      nextStart = addDays(nextStart, cycle);
      guard++;
    }
    // The cycle "anchor" is the start of the current cycle (most recent start ≤ today).
    let cycleStart = last;
    while (daysBetween(cycleStart, today) >= cycle) cycleStart = addDays(cycleStart, cycle);

    const ovulation = addDays(nextStart, -14);
    const fertileStart = addDays(ovulation, -5);
    const fertileEnd = addDays(ovulation, 1);

    // Current cycle's ovulation (for phase display)
    const curOvulation = addDays(cycleStart, cycle - 14);
    const curFertileStart = addDays(curOvulation, -5);
    const curFertileEnd = addDays(curOvulation, 1);

    return {
      cycle, periodLen, cycleStart, nextStart,
      ovulation, fertileStart, fertileEnd,
      curOvulation, curFertileStart, curFertileEnd,
      cycleDay: daysBetween(cycleStart, today) + 1
    };
  }

  function phaseFor(p) {
    if (!p) return { name: "Welcome", sub: "Log your first period to begin", chips: [] };
    const today = todayISO();
    const dayInPeriod = daysBetween(p.cycleStart, today);
    const chips = [];
    let name, sub;

    const toNext = daysBetween(today, p.nextStart);
    const toOvul = daysBetween(today, p.curOvulation);

    if (dayInPeriod < p.periodLen) {
      name = "Menstrual phase";
      sub = "Rest, warmth, and iron-rich food. 💗";
    } else if (today >= p.curFertileStart && today <= p.curFertileEnd) {
      name = today === p.curOvulation ? "Ovulation 🌸" : "Fertile window";
      sub = today === p.curOvulation ? "Your most fertile day." : "Higher chance of conception now.";
    } else if (dayInPeriod < daysBetween(p.cycleStart, p.curOvulation)) {
      name = "Follicular phase";
      sub = "Energy is building — a great time to move. ⚡";
    } else {
      name = "Luteal phase";
      sub = "Wind down gently as your period approaches. 🌙";
    }

    if (toNext >= 0) chips.push({ t: toNext === 0 ? "Period due today" : `Period in ${toNext}d` });
    if (toOvul >= 0) chips.push({ t: toOvul === 0 ? "Ovulating today" : `Ovulation in ${toOvul}d`, ov: true });
    chips.push({ t: `~${p.cycle}d cycle` });
    return { name, sub, chips };
  }

  // Classify a given date for the calendar.
  function classify(dateStr, p) {
    const cls = [];
    // Logged actual period days
    for (const per of state.periods) {
      const end = per.end || addDays(per.start, (state.settings.periodLength || 5) - 1);
      if (dateStr >= per.start && dateStr <= end) { cls.push("period"); break; }
    }
    if (p && !cls.includes("period")) {
      // Predicted next period
      const predEnd = addDays(p.nextStart, p.periodLen - 1);
      if (dateStr >= p.nextStart && dateStr <= predEnd) cls.push("predicted");
      // Fertile / ovulation (use the cycle relevant to this date)
      // Check both current and next cycle fertile windows
      if (dateStr === p.curOvulation || dateStr === p.ovulation) cls.push("ovul");
      else if ((dateStr >= p.curFertileStart && dateStr <= p.curFertileEnd) ||
               (dateStr >= p.fertileStart && dateStr <= p.fertileEnd)) cls.push("fertile");
    }
    return cls;
  }
  function hasLog(dateStr) {
    const l = state.logs[dateStr];
    if (!l) return false;
    return !!(l.flow || (l.symptoms && l.symptoms.length) || (l.moods && l.moods.length) ||
      l.sex || l.sexDrive || l.discharge || l.digestion || (l.notes && l.notes.trim()));
  }

  // ---------- DOM helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 1800);
  }

  // ---------- Navigation ----------
  function go(screen) {
    $$(".screen").forEach(s => (s.hidden = s.dataset.screen !== screen));
    $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.go === screen));
    const titles = { home: "cycle", log: "Daily log", insights: "Your review", learn: "Learn" };
    $("#topbarTitle").textContent = titles[screen] || "cycle";
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (screen === "insights") renderReview();
    if (screen === "log") renderLog();
  }
  $$(".tab").forEach(t => t.addEventListener("click", () => go(t.dataset.go)));

  // ---------- Calendar ----------
  let calYear, calMonth;
  function renderCalendar() {
    const p = predict();
    const grid = $("#calGrid");
    grid.innerHTML = "";
    $("#calMonth").textContent = `${MONTHS[calMonth]} ${calYear}`;
    const first = new Date(calYear, calMonth, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const today = todayISO();

    for (let i = 0; i < startDow; i++) grid.appendChild(el("div", "cal-cell empty"));
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = iso(new Date(calYear, calMonth, d));
      const cell = el("button", "cal-cell", String(d));
      cell.style.animationDelay = (d * 0.008) + "s";
      const cls = classify(ds, p);
      cls.forEach(c => cell.classList.add(c));
      if (ds === today) cell.classList.add("today");
      if (hasLog(ds)) {
        const marks = el("div", "marks");
        marks.appendChild(el("i"));
        cell.appendChild(marks);
      }
      cell.addEventListener("click", () => {
        logDateStr = ds;
        go("log");
      });
      grid.appendChild(cell);
    }
    renderHero(p);
  }

  function renderHero(p) {
    const ph = phaseFor(p);
    $("#heroPhase").textContent = ph.name;
    $("#heroSub").textContent = ph.sub;
    const chipsWrap = $("#heroChips");
    chipsWrap.innerHTML = "";
    ph.chips.forEach(c => {
      const pill = el("span", "pill" + (c.ov ? " ov" : ""), c.t);
      chipsWrap.appendChild(pill);
    });

    const ring = $("#ringFg");
    const dayEl = $("#ringDay");
    if (p) {
      const day = Math.max(1, Math.min(p.cycle, p.cycleDay));
      dayEl.textContent = day;
      $("#ringLabel").textContent = "cycle day";
      const frac = Math.min(1, day / p.cycle);
      const circ = 2 * Math.PI * 52;
      ring.style.strokeDasharray = circ;
      requestAnimationFrame(() => (ring.style.strokeDashoffset = circ * (1 - frac)));
      ring.style.stroke = ph.name.startsWith("Ovulation") ? "var(--ovul)" : "var(--pink-500)";
    } else {
      dayEl.textContent = "–";
      $("#ringLabel").textContent = "no data";
      ring.style.strokeDashoffset = 2 * Math.PI * 52;
    }
  }

  $("#prevMonth").addEventListener("click", () => {
    calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar();
  });
  $("#nextMonth").addEventListener("click", () => {
    calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar();
  });
  $("#todayBtn").addEventListener("click", () => {
    const n = new Date(); calYear = n.getFullYear(); calMonth = n.getMonth();
    go("home"); renderCalendar();
  });

  // ---------- Log period modal ----------
  const periodModal = $("#periodModal");
  function openPeriodModal() {
    $("#pmStart").value = todayISO();
    $("#pmEnd").value = "";
    renderExistingPeriods();
    periodModal.hidden = false;
  }
  function renderExistingPeriods() {
    const wrap = $("#pmExisting");
    wrap.innerHTML = "";
    const ps = sortedPeriods().reverse().slice(0, 6);
    if (!ps.length) return;
    wrap.appendChild(el("div", null, "<strong style='color:var(--ink)'>Recent periods</strong>"));
    ps.forEach(per => {
      const row = el("div", "pm-row");
      const label = per.end
        ? `${prettyDate(per.start)} → ${prettyDate(per.end)}`
        : `${prettyDate(per.start)}`;
      row.appendChild(el("span", null, label));
      const del = el("button", "pm-del", "Remove");
      del.addEventListener("click", () => {
        state.periods = state.periods.filter(x => !(x.start === per.start && x.end === per.end));
        save(); renderExistingPeriods(); renderCalendar(); toast("Period removed");
      });
      row.appendChild(del);
      wrap.appendChild(row);
    });
  }
  $("#logPeriodCta").addEventListener("click", openPeriodModal);
  $("#pmCancel").addEventListener("click", () => (periodModal.hidden = true));
  periodModal.addEventListener("click", (e) => { if (e.target === periodModal) periodModal.hidden = true; });
  $("#pmSave").addEventListener("click", () => {
    const start = $("#pmStart").value;
    let end = $("#pmEnd").value || "";
    if (!start) { toast("Pick a start date"); return; }
    if (end && parse(end) < parse(start)) { toast("End can't be before start"); return; }
    // Avoid exact duplicates
    state.periods = state.periods.filter(p => p.start !== start);
    state.periods.push({ start, end });
    save();
    periodModal.hidden = true;
    renderCalendar();
    toast("Period saved 💗");
  });

  // ---------- Daily log ----------
  let logDateStr = todayISO();

  function buildChips(wrapId, list, type) {
    const wrap = $("#" + wrapId);
    wrap.innerHTML = "";
    list.forEach(([emo, label]) => {
      const c = el("button", "chip", `<span class="emo">${emo}</span>${label}`);
      c.dataset.val = label;
      c.dataset.type = type;
      c.addEventListener("click", () => {
        c.classList.toggle("active");
        c.style.transform = "scale(1.12)";
        setTimeout(() => (c.style.transform = ""), 130);
      });
      wrap.appendChild(c);
    });
  }
  buildChips("symptomWrap", SYMPTOMS, "symptom");
  buildChips("moodWrap", MOODS, "mood");

  function setSeg(group, val) {
    $$(`.seg[data-group="${group}"] button`).forEach(b =>
      b.classList.toggle("active", (b.dataset.val || "") === (val || "")));
  }
  function getSeg(group) {
    const a = $(`.seg[data-group="${group}"] button.active`);
    return a ? a.dataset.val : "";
  }
  $$(".seg[data-group]").forEach(seg => {
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      $$("button", seg).forEach(x => x.classList.toggle("active", x === b));
    });
  });

  function renderLog() {
    $("#logDate").value = logDateStr;
    $("#logDatePretty").textContent = logDateStr === todayISO() ? "Today" : prettyDate(logDateStr);
    const l = state.logs[logDateStr] || {};
    setSeg("flow", l.flow || "");
    setSeg("sex", l.sex || "");
    setSeg("sexDrive", l.sexDrive || "");
    setSeg("discharge", l.discharge || "");
    setSeg("digestion", l.digestion || "");
    $("#logNotes").value = l.notes || "";
    const syms = new Set(l.symptoms || []);
    $$("#symptomWrap .chip").forEach(c => c.classList.toggle("active", syms.has(c.dataset.val)));
    const moods = new Set(l.moods || []);
    $$("#moodWrap .chip").forEach(c => c.classList.toggle("active", moods.has(c.dataset.val)));
  }

  function collectLog() {
    return {
      flow: getSeg("flow"),
      sex: getSeg("sex"),
      sexDrive: getSeg("sexDrive"),
      discharge: getSeg("discharge"),
      digestion: getSeg("digestion"),
      notes: $("#logNotes").value.trim(),
      symptoms: $$("#symptomWrap .chip.active").map(c => c.dataset.val),
      moods: $$("#moodWrap .chip.active").map(c => c.dataset.val)
    };
  }

  $("#logDate").addEventListener("change", (e) => { logDateStr = e.target.value || todayISO(); renderLog(); });
  $("#logPrevDay").addEventListener("click", () => { logDateStr = addDays(logDateStr, -1); renderLog(); });
  $("#logNextDay").addEventListener("click", () => { logDateStr = addDays(logDateStr, 1); renderLog(); });

  $("#saveLog").addEventListener("click", () => {
    const data = collectLog();
    state.logs[logDateStr] = data;
    // If flow was logged and no period covers this day, gently extend/create one.
    if (data.flow && data.flow !== "" && data.flow !== "spotting") {
      const covered = state.periods.some(p => {
        const end = p.end || addDays(p.start, (state.settings.periodLength || 5) - 1);
        return logDateStr >= p.start && logDateStr <= end;
      });
      if (!covered) {
        // attach to an adjacent period or create a 1-day entry
        const adj = state.periods.find(p => Math.abs(daysBetween(p.end || p.start, logDateStr)) <= 1
          || Math.abs(daysBetween(p.start, logDateStr)) <= 1);
        if (adj) {
          if (parse(logDateStr) < parse(adj.start)) adj.start = logDateStr;
          else adj.end = logDateStr;
        } else {
          state.periods.push({ start: logDateStr, end: "" });
        }
      }
    }
    save();
    renderCalendar();
    toast("Saved 💗");
  });
  $("#clearDay").addEventListener("click", () => {
    delete state.logs[logDateStr];
    save();
    renderLog();
    renderCalendar();
    toast("Day cleared");
  });

  // ---------- Insights / Review ----------
  let reviewMode = "month";
  $$("#reviewSwitch button").forEach(b => b.addEventListener("click", () => {
    $$("#reviewSwitch button").forEach(x => x.classList.toggle("active", x === b));
    reviewMode = b.dataset.val;
    renderReview();
  }));

  function logsInRange(start, end) {
    return Object.entries(state.logs).filter(([d]) => d >= start && d <= end);
  }
  function tally(entries, field) {
    const counts = {};
    entries.forEach(([, l]) => {
      const v = l[field];
      if (Array.isArray(v)) v.forEach(x => (counts[x] = (counts[x] || 0) + 1));
      else if (v) counts[v] = (counts[v] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }
  function barList(title, data, max) {
    if (!data.length) return "";
    const cap = Math.max(...data.map(d => d[1]));
    const rows = data.slice(0, max || 6).map(([name, n]) => `
      <div class="bar-row">
        <span class="name">${name}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${Math.round((n / cap) * 100)}%"></span></span>
        <span class="cnt">${n}</span>
      </div>`).join("");
    return `<div class="card section"><h3>${title}</h3>${rows}</div>`;
  }

  function renderReview() {
    const body = $("#reviewBody");
    if (reviewMode === "month") {
      const start = iso(new Date(calYear, calMonth, 1));
      const end = iso(new Date(calYear, calMonth + 1, 0));
      const entries = logsInRange(start, end);
      const p = predict();
      const cycle = p ? p.cycle : avgCycleLength();
      const periodDays = countPeriodDaysInRange(start, end);

      let html = `
        <div class="card section" style="display:flex;align-items:center;justify-content:space-between">
          <h3 style="margin:0">${MONTHS[calMonth]} ${calYear}</h3>
          <div style="display:flex;gap:8px">
            <button class="cal-nav" id="rvPrev">‹</button>
            <button class="cal-nav" id="rvNext">›</button>
          </div>
        </div>
        <div class="stat-grid">
          <div class="stat"><div class="num">${periodDays}</div><div class="lbl">Period days logged</div></div>
          <div class="stat"><div class="num">${entries.length}</div><div class="lbl">Days tracked</div></div>
          <div class="stat"><div class="num">${cycle}</div><div class="lbl">Avg cycle length</div></div>
          <div class="stat"><div class="num">${tally(entries, "sex").reduce((a, b) => a + (b[0] !== "none" ? b[1] : 0), 0)}</div><div class="lbl">Intimacy logged</div></div>
        </div>`;

      const sym = tally(entries, "symptoms");
      const mood = tally(entries, "moods");
      html += barList("Top symptoms", sym, 8) || "";
      html += barList("Mood breakdown", mood, 8) || "";
      const disc = tally(entries, "discharge");
      const dig = tally(entries, "digestion");
      html += barList("Discharge", disc) || "";
      html += barList("Digestion", dig) || "";
      const drive = tally(entries, "sexDrive");
      html += barList("Sex drive", drive) || "";

      if (!entries.length && !periodDays) {
        html += `<div class="empty-note">No data for this month yet.<br/>Start logging to see your review. 🌸</div>`;
      }
      body.innerHTML = html;
      $("#rvPrev").addEventListener("click", () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderReview(); renderCalendar(); });
      $("#rvNext").addEventListener("click", () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderReview(); renderCalendar(); });
    } else {
      renderYearReview(body);
    }
  }

  function countPeriodDaysInRange(start, end) {
    let count = 0;
    let d = start;
    while (d <= end) {
      const inPeriod = state.periods.some(p => {
        const pe = p.end || addDays(p.start, (state.settings.periodLength || 5) - 1);
        return d >= p.start && d <= pe;
      });
      const flow = state.logs[d] && state.logs[d].flow && state.logs[d].flow !== "spotting";
      if (inPeriod || flow) count++;
      d = addDays(d, 1);
    }
    return count;
  }

  function renderYearReview(body) {
    const year = calYear;
    let html = `
      <div class="card section" style="display:flex;align-items:center;justify-content:space-between">
        <h3 style="margin:0">${year}</h3>
        <div style="display:flex;gap:8px">
          <button class="cal-nav" id="yrPrev">‹</button>
          <button class="cal-nav" id="yrNext">›</button>
        </div>
      </div>`;

    const yStart = `${year}-01-01`, yEnd = `${year}-12-31`;
    const entries = logsInRange(yStart, yEnd);
    const periodStarts = sortedPeriods().filter(p => p.start >= yStart && p.start <= yEnd);
    const totalPeriodDays = countPeriodDaysInRange(yStart, yEnd);

    html += `
      <div class="stat-grid">
        <div class="stat"><div class="num">${periodStarts.length}</div><div class="lbl">Periods this year</div></div>
        <div class="stat"><div class="num">${totalPeriodDays}</div><div class="lbl">Total period days</div></div>
        <div class="stat"><div class="num">${avgCycleLength()}</div><div class="lbl">Avg cycle</div></div>
        <div class="stat"><div class="num">${avgPeriodLength()}</div><div class="lbl">Avg period length</div></div>
      </div>`;

    // Month grid
    html += `<div class="card section"><h3>Period days by month</h3><div class="year-grid">`;
    for (let m = 0; m < 12; m++) {
      const s = iso(new Date(year, m, 1));
      const e = iso(new Date(year, m + 1, 0));
      const days = countPeriodDaysInRange(s, e);
      html += `<div class="ym ${days ? "has" : ""}"><div class="m">${MONTHS_SHORT[m]}</div><div class="d">${days ? days + "d" : "–"}</div></div>`;
    }
    html += `</div></div>`;

    html += barList("Most common symptoms", tally(entries, "symptoms"), 8) || "";
    html += barList("Mood through the year", tally(entries, "moods"), 8) || "";

    if (!entries.length && !periodStarts.length) {
      html += `<div class="empty-note">No data for ${year} yet. 🌸</div>`;
    }
    body.innerHTML = html;
    $("#yrPrev").addEventListener("click", () => { calYear--; renderReview(); });
    $("#yrNext").addEventListener("click", () => { calYear++; renderReview(); });
  }

  // ---------- Learn ----------
  function buildAccordion(id, items) {
    const wrap = $("#" + id);
    items.forEach(([title, sub, points]) => {
      const item = el("div", "acc-item");
      const head = el("button", "acc-head", `<span>${title}</span><span class="chev">▾</span>`);
      const bodyEl = el("div", "acc-body");
      bodyEl.innerHTML = `<div class="acc-body-inner"><p class="lead" style="margin:0 0 8px">${sub}</p><ul>${points.map(p => `<li>${p}</li>`).join("")}</ul></div>`;
      head.addEventListener("click", () => item.classList.toggle("open"));
      item.appendChild(head); item.appendChild(bodyEl);
      wrap.appendChild(item);
    });
  }
  buildAccordion("exerciseAcc", EXERCISES);
  buildAccordion("foodAcc", FOODS);

  // PCOS quiz
  function renderPcos() {
    const wrap = $("#pcosQuiz");
    wrap.innerHTML = "";
    PCOS_QUESTIONS.forEach((q, i) => {
      const row = el("div", "pcos-q");
      const check = el("div", "pcos-check" + (state.pcos[i] ? " on" : ""), state.pcos[i] ? "✓" : "");
      row.appendChild(check);
      row.appendChild(el("span", null, q));
      row.addEventListener("click", () => {
        state.pcos[i] = !state.pcos[i];
        check.classList.toggle("on", state.pcos[i]);
        check.textContent = state.pcos[i] ? "✓" : "";
        save();
        updatePcosResult();
      });
      wrap.appendChild(row);
    });
    const result = el("div", "pcos-result");
    result.id = "pcosResult";
    wrap.appendChild(result);
    updatePcosResult();
  }
  function updatePcosResult() {
    const n = PCOS_QUESTIONS.reduce((a, _, i) => a + (state.pcos[i] ? 1 : 0), 0);
    const res = $("#pcosResult");
    let msg;
    if (n === 0) msg = "Tap any statements that apply to you to see a general awareness summary.";
    else if (n <= 2) msg = `<strong>${n} selected.</strong> A few of these can be totally normal. Keep tracking your cycle — patterns are the most useful thing to share with a doctor.`;
    else if (n <= 4) msg = `<strong>${n} selected.</strong> Some of these symptoms overlap with PCOS, but many other things cause them too. It may be worth mentioning to a healthcare professional.`;
    else msg = `<strong>${n} selected.</strong> You've noted several signs commonly associated with PCOS. This is <em>not</em> a diagnosis — please consider booking a check-up with a doctor or gynecologist who can run proper tests.`;
    res.innerHTML = msg + `<br/><br/><span style="color:var(--muted);font-size:12px">Remember: cycle is an app, not a medical professional. 💗</span>`;
  }
  renderPcos();

  // ---------- Install prompt ----------
  let deferredPrompt = null;
  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }
  function isiOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
  function maybeShowInstall() {
    if (isStandalone()) return;
    if (localStorage.getItem("cycle.installDismissed")) return;
    const toastEl = $("#installToast");
    const steps = $("#installSteps");
    if (isiOS()) {
      steps.innerHTML = `Tap the Share button <span class="ios-share">⬆️</span> at the bottom of Safari, then choose <strong>“Add to Home Screen.”</strong>`;
      $("#installAndroid").hidden = true;
    } else if (deferredPrompt) {
      steps.textContent = "Install cycle for a full-screen, app-like experience.";
      $("#installAndroid").hidden = false;
    } else {
      steps.innerHTML = `Open your browser menu and choose <strong>“Add to Home Screen”</strong> or <strong>“Install.”</strong>`;
      $("#installAndroid").hidden = true;
    }
    setTimeout(() => (toastEl.hidden = false), 2500);
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = $("#installAndroid");
    if (!isStandalone() && !localStorage.getItem("cycle.installDismissed")) {
      btn.hidden = false;
      $("#installSteps").textContent = "Install cycle for a full-screen, app-like experience.";
    }
  });
  $("#installAndroid").addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $("#installToast").hidden = true;
  });
  $("#installClose").addEventListener("click", () => {
    $("#installToast").hidden = true;
    localStorage.setItem("cycle.installDismissed", "1");
  });

  // ---------- Import / Export ----------
  function download(filename, text, mime) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = el("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function stamp() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function exportJSON() {
    const payload = {
      app: "cycle",
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        periods: state.periods,
        logs: state.logs,
        settings: state.settings,
        pcos: state.pcos
      }
    };
    download(`cycle-data-${stamp()}.json`, JSON.stringify(payload, null, 2), "application/json");
    toast("JSON exported");
  }

  function exportTXT() {
    const L = [];
    L.push("cycle — data export");
    L.push("Version " + APP_VERSION);
    L.push("Exported: " + prettyDate(todayISO()) + ", " + new Date().getFullYear());
    L.push("");
    L.push("=== SETTINGS ===");
    L.push("Average cycle length: " + avgCycleLength() + " days");
    L.push("Average period length: " + avgPeriodLength() + " days");
    L.push("");

    const ps = sortedPeriods();
    L.push(`=== PERIODS (${ps.length}) ===`);
    if (!ps.length) L.push("(none logged yet)");
    ps.forEach(p => {
      if (p.end) {
        const len = daysBetween(p.start, p.end) + 1;
        L.push(`- ${prettyDate(p.start)} -> ${prettyDate(p.end)} (${len} day${len === 1 ? "" : "s"})`);
      } else {
        L.push(`- ${prettyDate(p.start)} (start only)`);
      }
    });
    L.push("");

    const days = Object.keys(state.logs).filter(d => hasLog(d)).sort();
    L.push(`=== DAILY LOGS (${days.length}) ===`);
    if (!days.length) L.push("(none logged yet)");
    days.forEach(d => {
      const l = state.logs[d];
      L.push(`[${prettyDate(d)}]`);
      if (l.flow) L.push("  Flow: " + l.flow);
      if (l.symptoms && l.symptoms.length) L.push("  Symptoms: " + l.symptoms.join(", "));
      if (l.moods && l.moods.length) L.push("  Moods: " + l.moods.join(", "));
      if (l.sex) L.push("  Sex: " + l.sex);
      if (l.sexDrive) L.push("  Sex drive: " + l.sexDrive);
      if (l.discharge) L.push("  Discharge: " + l.discharge);
      if (l.digestion) L.push("  Digestion: " + l.digestion);
      if (l.notes && l.notes.trim()) L.push("  Notes: " + l.notes.trim());
      L.push("");
    });

    const picked = PCOS_QUESTIONS.filter((_, i) => state.pcos[i]);
    L.push(`=== PCOS SELF-CHECK ===`);
    L.push(`Selected ${picked.length} of ${PCOS_QUESTIONS.length} statements` + (picked.length ? ":" : "."));
    picked.forEach(q => L.push("- " + q));
    L.push("(Reminder: this is an awareness checklist, not a diagnosis.)");
    L.push("");

    L.push("This file is a human-readable summary. To transfer your data to");
    L.push("another app, use the JSON export instead.");

    download(`cycle-data-${stamp()}.txt`, L.join("\n"), "text/plain");
    toast("TXT exported");
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const d = parsed.data || parsed; // accept raw or wrapped
        if (!d || typeof d !== "object" || (!d.periods && !d.logs)) {
          toast("Not a valid cycle file");
          return;
        }
        if (!confirm("Import will replace your current data on this device. Continue?")) return;
        state = Object.assign(structuredClone(DEFAULTS), {
          periods: Array.isArray(d.periods) ? d.periods : [],
          logs: d.logs && typeof d.logs === "object" ? d.logs : {},
          settings: Object.assign(structuredClone(DEFAULTS.settings), d.settings || {}),
          pcos: d.pcos && typeof d.pcos === "object" ? d.pcos : {}
        });
        save();
        renderCalendar();
        renderLog();
        renderPcos();
        toast("Data imported 💗");
      } catch (e) {
        toast("Couldn't read that file");
      }
    };
    reader.onerror = () => toast("Couldn't read that file");
    reader.readAsText(file);
  }

  $("#exportTxt").addEventListener("click", exportTXT);
  $("#exportJson").addEventListener("click", exportJSON);
  $("#importBtn").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) importJSON(f);
    e.target.value = ""; // allow re-importing the same file
  });

  // ---------- Boot ----------
  function boot() {
    const n = new Date();
    calYear = n.getFullYear();
    calMonth = n.getMonth();
    logDateStr = todayISO();
    $("#appVersion").textContent = "v" + APP_VERSION;
    $("#copyYear").textContent = n.getFullYear();
    renderCalendar();
    renderLog();
    // Hide splash
    setTimeout(() => {
      $("#splash").classList.add("hide");
      $("#app").hidden = false;
    }, 1400);
    maybeShowInstall();
  }
  boot();
})();
