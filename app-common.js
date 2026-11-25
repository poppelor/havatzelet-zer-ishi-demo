(function (global) {
  const ENDPOINT = "https://script.google.com/macros/s/AKfycbx_rw-0YHxxMUjzj9jWMwgHt2yuS_n0qVqTIUBeFQWG_nuCkBcdkqJCp2GbyLt1gjA/exec";

  const BOUQUETS = [
    { id: "roses", name: "זר ורדים אדומים", costs: { small: 80, medium: 120, large: 180 } },
    { id: "field", name: "זר שדה", costs: { small: 70, medium: 100, large: 150 } },
    { id: "white", name: "זר לבן", costs: { small: 90, medium: 140, large: 200 } }
  ];
  const SIZES = [
    { id: "small", name: "קטן" },
    { id: "medium", name: "בינוני" },
    { id: "large", name: "גדול" }
  ];
  const STEMS = [
    { id: "rose", name: "ורד אדום", price: 15 },
    { id: "lisianthus", name: "ליזיאנטוס", price: 15 },
    { id: "greenery", name: "ירק", price: 6 }
  ];

  function todayISO() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jerusalem",
      year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date());
    const map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });
    return map.year + "-" + map.month + "-" + map.day;
  }

  function money(n) {
    const x = Number(n) || 0;
    if (Number.isInteger(x)) return String(x);
    return (Math.round(x * 100) / 100).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  }

  function bouquetKey(b, s) { return b.name + " - " + s.name; }

  function emptyBouquetQty() {
    const q = {};
    BOUQUETS.forEach(function (b) {
      SIZES.forEach(function (s) { q[bouquetKey(b, s)] = 0; });
    });
    return q;
  }

  function emptyStemQty() {
    const q = {};
    STEMS.forEach(function (s) { q[s.name] = 0; });
    return q;
  }

  function bindWho(getWho, setWho) {
    document.querySelectorAll(".who button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setWho(btn.getAttribute("data-who") || "");
        document.querySelectorAll(".who button").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        hideError();
      });
    });
  }

  function renderBouquetSteppers(container, qty, options) {
    options = options || {};
    container.innerHTML = "";
    container.classList.add("grid-bq");
    const head = ["", "קטן", "בינוני", "גדול"];
    head.forEach(function (t, i) {
      const el = document.createElement("div");
      el.className = "th" + (i === 0 ? " name" : "");
      el.textContent = t;
      container.appendChild(el);
    });
    BOUQUETS.forEach(function (b) {
      const name = document.createElement("div");
      name.className = "td name";
      name.textContent = b.name;
      container.appendChild(name);
      SIZES.forEach(function (s) {
        const key = bouquetKey(b, s);
        const cell = document.createElement("div");
        cell.className = "td cell size-row";
        cell.setAttribute("data-key", key);
        cell.setAttribute("data-bouquet", b.id);
        cell.setAttribute("data-size", s.id);
        const stepper = makeStepper(qty[key], function (next) {
          qty[key] = next;
          if (options.onChange) options.onChange();
        }, "הוספת " + b.name + " " + s.name, "הורדת " + b.name + " " + s.name);
        cell.appendChild(stepper);
        container.appendChild(cell);
      });
    });
  }

  function renderStemSteppers(container, qty, options) {
    options = options || {};
    container.innerHTML = "";
    container.classList.add("grid-stem");
    ["", "כמות", options.showPrices ? "עלות" : ""].forEach(function (t, i) {
      const el = document.createElement("div");
      el.className = "th" + (i === 0 ? " name" : "") + (i === 2 ? " sum" : "");
      el.textContent = t;
      container.appendChild(el);
    });
    STEMS.forEach(function (s) {
      const name = document.createElement("div");
      name.className = "td name stem";
      name.setAttribute("data-stem", s.id);
      name.textContent = s.name;
      container.appendChild(name);
      const cell = document.createElement("div");
      cell.className = "td cell stem";
      cell.setAttribute("data-stem", s.id);
      cell.setAttribute("data-key", s.name);
      const sum = document.createElement("div");
      sum.className = "td sum";
      sum.setAttribute("data-stem-cost", s.id);
      function paintCost() {
        if (!options.showPrices) { sum.textContent = ""; return; }
        sum.textContent = "₪" + money((qty[s.name] || 0) * s.price);
      }
      paintCost();
      const stepper = makeStepper(qty[s.name], function (next) {
        qty[s.name] = next;
        paintCost();
        if (options.onChange) options.onChange();
      }, "הוספת " + s.name, "הורדת " + s.name);
      cell.appendChild(stepper);
      container.appendChild(cell);
      container.appendChild(sum);
    });
  }

  function makeStepper(initial, onChange, plusLabel, minusLabel) {
    let value = initial || 0;
    const box = document.createElement("div");
    box.className = "stepper";
    const minus = document.createElement("button");
    minus.type = "button";
    minus.setAttribute("aria-label", minusLabel);
    minus.textContent = "−";
    const qtyEl = document.createElement("div");
    qtyEl.className = "qty";
    qtyEl.setAttribute("aria-live", "polite");
    qtyEl.textContent = String(value);
    const plus = document.createElement("button");
    plus.type = "button";
    plus.setAttribute("aria-label", plusLabel);
    plus.textContent = "+";
    minus.addEventListener("click", function () {
      if (value === 0) return;
      value -= 1;
      qtyEl.textContent = String(value);
      onChange(value);
    });
    plus.addEventListener("click", function () {
      value += 1;
      qtyEl.textContent = String(value);
      onChange(value);
    });
    box.appendChild(minus);
    box.appendChild(qtyEl);
    box.appendChild(plus);
    return box;
  }

  function hideError() {
    const el = document.getElementById("error");
    if (!el) return;
    el.style.display = "none";
    el.textContent = "";
  }

  function showError(msg) {
    const el = document.getElementById("error");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function showSuccess(lines, saved) {
    const ul = document.getElementById("summary");
    ul.innerHTML = "";
    lines.forEach(function (pair) {
      if (pair[1] === "" || pair[1] === undefined || pair[1] === null) return;
      const li = document.createElement("li");
      const a = document.createElement("span");
      const b = document.createElement("span");
      a.textContent = pair[0];
      b.textContent = String(pair[1]);
      li.appendChild(a);
      li.appendChild(b);
      ul.appendChild(li);
    });
    document.getElementById("success-title").textContent = saved ? "הדיווח נשמר" : "החישוב מוכן";
    const note = document.getElementById("save-note");
    if (note) {
      note.textContent = saved
        ? "השורה נכנסה לגיליון."
        : "השורה עדיין לא נשמרה בגיליון. צריך לפרוס מחדש את הסקריפט.";
    }
    document.getElementById("form-view").style.display = "none";
    const dock = document.getElementById("dock");
    if (dock) dock.style.display = "none";
    document.getElementById("success-view").style.display = "block";
    window.scrollTo(0, 0);
  }

  function backToForm() {
    document.getElementById("success-view").style.display = "none";
    document.getElementById("form-view").style.display = "block";
    const dock = document.getElementById("dock");
    if (dock) dock.style.display = "block";
    hideError();
    window.scrollTo(0, 0);
  }

  function compressImage(file) {
    return new Promise(function (resolve) {
      if (!file) { resolve({ name: "", dataUrl: "" }); return; }
      const reader = new FileReader();
      reader.onload = function () {
        const img = new Image();
        img.onload = function () {
          const max = 1600;
          let w = img.width, h = img.height;
          if (w > max || h > max) {
            const scale = max / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve({ name: file.name, dataUrl: canvas.toDataURL("image/jpeg", 0.7) });
        };
        img.onerror = function () { resolve({ name: file.name, dataUrl: "" }); };
        img.src = String(reader.result || "");
      };
      reader.onerror = function () { resolve({ name: file.name, dataUrl: "" }); };
      reader.readAsDataURL(file);
    });
  }

  function bindPhoto(inputId, previewId, actionsId, removeId, setter) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const actions = document.getElementById(actionsId);
    const remove = document.getElementById(removeId);
    if (!input) return;
    input.addEventListener("change", function () {
      const file = input.files && input.files[0];
      if (!file) return;
      compressImage(file).then(function (res) {
        setter(res);
        if (preview && res.dataUrl) {
          preview.src = res.dataUrl;
          preview.style.display = "block";
        }
        if (actions) actions.style.display = "block";
      });
    });
    if (remove) {
      remove.addEventListener("click", function () {
        setter({ name: "", dataUrl: "" });
        input.value = "";
        if (preview) { preview.src = ""; preview.style.display = "none"; }
        if (actions) actions.style.display = "none";
      });
    }
  }

  function submit(form, fields, photo) {
    const payload = {
      form: form,
      fields: fields,
      photo: (photo && photo.name) || "",
      photoDataUrl: (photo && photo.dataUrl) || ""
    };
    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error("bad status");
      return res.json().catch(function () { return { ok: true }; });
    });
  }

  global.Havatzelet = {
    ENDPOINT: ENDPOINT,
    BOUQUETS: BOUQUETS,
    SIZES: SIZES,
    STEMS: STEMS,
    todayISO: todayISO,
    money: money,
    bouquetKey: bouquetKey,
    emptyBouquetQty: emptyBouquetQty,
    emptyStemQty: emptyStemQty,
    bindWho: bindWho,
    renderBouquetSteppers: renderBouquetSteppers,
    renderStemSteppers: renderStemSteppers,
    hideError: hideError,
    showError: showError,
    showSuccess: showSuccess,
    backToForm: backToForm,
    bindPhoto: bindPhoto,
    submit: submit
  };
})(window);
