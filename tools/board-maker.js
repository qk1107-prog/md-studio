// 스타터팩·레벨업 팩 "흰 배경 누끼 플랫레이" 이미지 만들기
// 관리자 탭(admin.html, 로그인 상태)에서 실행: (0,eval)(await (await fetch('/tools/board-maker.js?'+Date.now())).text()); await window.__bmRun();
// 진행 상황: window.__bm
window.__bmRun = async (opts) => {
  opts = opts || {};
  const S = (window.__bm = { st: "start", done: 0, total: 0, fail: 0, ml: 0, flood: 0, log: [] });
  const W = 720, H = 900, K = W / 1080;
  // ---------- onnx (u2netp) ----------
  if (!window.ort) {
    await new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/ort.min.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/";
  ort.env.wasm.numThreads = 1;
  const sess = window.__u2 || (window.__u2 = await ort.InferenceSession.create("/models/u2netp.onnx", { executionProviders: ["wasm"] }));
  S.st = "model ok";
  // ---------- 배경 (흰 퍼) ----------
  const bg = document.createElement("canvas"); bg.width = W; bg.height = H;
  { const c = bg.getContext("2d"); c.fillStyle = "#f3f2ef"; c.fillRect(0, 0, W, H);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 9000; i++) { const x = rnd() * W, y = rnd() * H, a = rnd() * Math.PI * 2, l = 6 + rnd() * 14; const v = 225 + Math.floor(rnd() * 30);
      c.strokeStyle = `rgba(${v},${v},${v - 2},${0.25 + rnd() * 0.35})`; c.lineWidth = 0.6 + rnd() * 1.2; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (rnd() - 0.5) * 4, y + Math.sin(a) * l * 0.5 + (rnd() - 0.5) * 4, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
    const g = c.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.85); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(200,198,194,0.25)"); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  // ---------- 누끼 ----------
  const loadImg = async (url) => { const r = await fetch(url, { mode: "cors" }); if (!r.ok) throw new Error("img " + r.status); return await createImageBitmap(await r.blob()); };
  const toCanvas = (bmp, max) => { const s = Math.min(1, max / Math.max(bmp.width, bmp.height)); const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s); c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height); return c; };
  function floodAlpha(c, TT) {
    const w = c.width, h = c.height, ctx = c.getContext("2d"), id = ctx.getImageData(0, 0, w, h), d = id.data;
    // 테두리가 밝고 고른 배경인지
    let n = 0, ok = 0, sr = 0, sg = 0, sb = 0;
    const edge = (x, y) => { const i = (y * w + x) * 4; n++; sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; };
    for (let x = 0; x < w; x += 2) { edge(x, 0); edge(x, h - 1); } for (let y = 0; y < h; y += 2) { edge(0, y); edge(w - 1, y); }
    const br = sr / n, bgc = sg / n, bb = sb / n;
    const close = (i, t) => Math.abs(d[i] - br) + Math.abs(d[i + 1] - bgc) + Math.abs(d[i + 2] - bb) < t;
    for (let x = 0; x < w; x += 2) { if (close((0 * w + x) * 4, 40)) ok++; if (close(((h - 1) * w + x) * 4, 40)) ok++; } for (let y = 0; y < h; y += 2) { if (close((y * w) * 4, 40)) ok++; if (close((y * w + w - 1) * 4, 40)) ok++; }
    if (ok / n < 0.9 || (br + bgc + bb) / 3 < 200) return false;
    const T = TT || 54, seen = new Uint8Array(w * h), st = [];
    for (let x = 0; x < w; x++) { st.push(x, 0, x, h - 1); } for (let y = 0; y < h; y++) { st.push(0, y, w - 1, y); }
    while (st.length) { const y = st.pop(), x = st.pop(); if (x < 0 || y < 0 || x >= w || y >= h) continue; const p = y * w + x; if (seen[p]) continue; const i = p * 4; if (!close(i, T)) continue; seen[p] = 1; d[i + 3] = 0; st.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1); }
    // 색상 점(컬러칩) 같은 작은 조각 지우기: 큰 덩어리만 남김
    { const lab = new Int32Array(w * h), sizes = [0]; let id2 = 0;
      for (let p0 = 0; p0 < w * h; p0++) { if (seen[p0] || lab[p0]) continue; id2++; let cnt = 0; const q2 = [p0]; lab[p0] = id2;
        while (q2.length) { const p = q2.pop(); cnt++; const x = p % w, y = (p / w) | 0; const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]; for (const r of nb) if (r >= 0 && !seen[r] && !lab[r]) { lab[r] = id2; q2.push(r); } }
        sizes.push(cnt); }
      const big = Math.max(...sizes); for (let p = 0; p < w * h; p++) if (lab[p] && sizes[lab[p]] < big * 0.12) { seen[p] = 1; d[p * 4 + 3] = 0; } }
    // 가장자리 살짝 부드럽게
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const p = y * w + x; if (seen[p]) continue; if (seen[p - 1] || seen[p + 1] || seen[p - w] || seen[p + w]) d[p * 4 + 3] = 150; }
    ctx.putImageData(id, 0, 0); return true;
  }
  async function mlAlpha(c) {
    const w = c.width, h = c.height, R = 320, t = document.createElement("canvas"); t.width = R; t.height = R; const tc = t.getContext("2d"); tc.drawImage(c, 0, 0, R, R);
    const px = tc.getImageData(0, 0, R, R).data, f = new Float32Array(3 * R * R), M = [0.485, 0.456, 0.406], SD = [0.229, 0.224, 0.225];
    let mx = 0; for (let i = 0; i < R * R; i++) mx = Math.max(mx, px[i * 4], px[i * 4 + 1], px[i * 4 + 2]); mx = mx || 255;
    for (let i = 0; i < R * R; i++) for (let k = 0; k < 3; k++) f[k * R * R + i] = (px[i * 4 + k] / mx - M[k]) / SD[k];
    const out = await sess.run({ [sess.inputNames[0]]: new ort.Tensor("float32", f, [1, 3, R, R]) });
    const o = out[sess.outputNames[0]].data; let lo = Infinity, hi = -Infinity; for (const v of o) { if (v < lo) lo = v; if (v > hi) hi = v; }
    const m = document.createElement("canvas"); m.width = R; m.height = R; const mc = m.getContext("2d"), mi = mc.createImageData(R, R);
    for (let i = 0; i < R * R; i++) { let a = (o[i] - lo) / (hi - lo || 1); a = Math.max(0, Math.min(1, (a - 0.35) / 0.4)); mi.data[i * 4 + 3] = Math.round(a * 255); }
    mc.putImageData(mi, 0, 0);
    const ctx = c.getContext("2d"); ctx.globalCompositeOperation = "destination-in"; ctx.drawImage(m, 0, 0, w, h); ctx.globalCompositeOperation = "source-over";
  }
  function crop(c) {
    const w = c.width, h = c.height, d = c.getContext("2d").getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0 || y1 <= y0) return null;
    const o = document.createElement("canvas"); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext("2d").drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height); return o;
  }
  const cache = new Map(); // gno -> cutout canvas (최근 것만)
  // 대표 사진이 모델 컷이면, 상세 이미지(alt) 중 흰 배경 제품 컷을 찾아 씀
  // 사람(모델) 사진 걸러내기: 윗부분에 피부색이 많으면 모델 컷으로 봄
  function looksPerson(c) {
    const w = c.width, h = c.height, top = Math.max(8, Math.round(h * 0.28)), d = c.getContext("2d").getImageData(0, 0, w, top).data;
    let op = 0, sk = 0;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; op++; const r = d[i], g = d[i + 1], b = d[i + 2]; const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b, cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b; if (cr > 138 && cr < 173 && cb > 77 && cb < 127 && r > 90 && r > g && g > b * 0.9) sk++; }
    return op > 50 && sk / op > 0.1;
  }
  // 누끼 품질: 남은 부분이 너무 적거나(밝은 바지 등이 배경이랑 같이 지워짐) 구멍이 많으면 실패
  function quality(c, full) {
    if (!c) return { area: 0, fill: 0 };
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let op = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 40) op++;
    return { area: op / full, fill: op / (c.width * c.height) };
  }
  const bad = (q) => q.area < 0.07 || q.fill < 0.42;
  async function cut1(url, T) {
    const bmp = await loadImg(url); const c = toCanvas(bmp, 520); bmp.close && bmp.close();
    const full = c.width * c.height;
    if (!floodAlpha(c, T)) return { r: null, q: { area: 0, fill: 0 } };
    const r = crop(c); return { r, q: quality(r, full) };
  }
  async function tryUrl(url) {
    if (cache.has(url)) return cache.get(url);
    let r = null;
    try {
      const a = await cut1(url, 54);
      // 망가진 누끼 걸러내기: 촘촘하게(20) 잘랐을 때 훨씬 많이 남으면 = 54에서 옷이 배경이랑 같이 날아갔거나, 그림자·회색 배경·모델 컷
      if (a.r) { const b2 = await cut1(url, 20); if (bad(a.q) || (b2.q.area / (a.q.area || 1e-9) > 1.4 && b2.q.fill < 0.97)) { S.reject = (S.reject || 0) + 1; a.r = null; } }
      r = a.r; if (r) S.flood++;
      if (r && (looksPerson(r) || r.height / r.width > 2.6)) { r = null; S.person = (S.person || 0) + 1; }
    } catch (e) {}
    cache.set(url, r); if (cache.size > 400) cache.delete(cache.keys().next().value); return r;
  }
  // 기존 보드 검사용: 원래 방식(54)으로 잘랐을 때 망가졌는지
  async function wasBad(it) { try { const u = it.flat || it.img; const a = await cut1(u, 54); if (!a.r) return false; if (bad(a.q)) return true; const b2 = await cut1(u, 20); return b2.q.area / (a.q.area || 1e-9) > 1.4 && b2.q.fill < 0.97; } catch (e) { return false; } }
  window.__bmWasBad = wasBad;
  window.__bmQ = async (url) => { const a = await cut1(url, 54), b = await cut1(url, 20); return JSON.stringify({ a: a.q, b: b.q }); };
  if (opts.qonly) { S.st = "q"; return; }
  async function cutout(it) {
    const urls = [it.img, ...((it.alt || []).filter((u) => u !== it.img))];
    for (const u of urls) { const r = await tryUrl(u); if (r && r.width > 60 && r.height > 60) { it.flat = u; return r; } }
    S.ml++; return null;
  }
  // ---------- 배치 ----------
  const BOX = { o: [80, 60, 440, 720], t: [570, 50, 440, 540], b: [565, 600, 450, 710], s: [70, 880, 460, 360] };
  function place(ctx, img, box) {
    if (!img) return; const [bx, by, bw, bh] = box.map((v) => v * K); const s = Math.min(bw / img.width, bh / img.height); const w = img.width * s, h = img.height * s, x = bx + (bw - w) / 2, y = by + (bh - h) / 2;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.22)"; ctx.shadowBlur = 14 * K; ctx.shadowOffsetX = 3 * K; ctx.shadowOffsetY = 8 * K; ctx.drawImage(img, x, y, w, h); ctx.restore();
  }
  async function makeBoard(st) {
    const role = (r) => st.items.find((i) => i.role === r);
    const o = role("아우터"), t = role("상의"), b = role("하의"), s = role("신발");
    const [co, ct, cb, cs] = await Promise.all([o, t, b, s].map((i) => (i ? cutout(i).catch(() => null) : null)));
    if (!co || !cb) throw new Error("model photo");
    const c = document.createElement("canvas"); c.width = W; c.height = H; const ctx = c.getContext("2d"); ctx.drawImage(bg, 0, 0);
    const box = Object.assign({}, BOX);
    if (!ct) { box.b = [565, 120, 450, 1120]; }
    if (!cs) { box.o = [70, 90, 450, 1150]; }
    if (s && !cs) box.o = [70, 90, 450, 1150];
    place(ctx, cs, box.s); place(ctx, cb, box.b); place(ctx, ct, box.t); place(ctx, co, box.o);
    return await new Promise((r) => c.toBlob(r, "image/jpeg", 0.84));
  }
  // ---------- 데이터 ----------
  let P = opts.pool || null; for (let k = 0; k < 5 && !P; k++) { try { const r = await supabaseClient.from("site_data").select("value").eq("id", "packs").single(); P = r.data && r.data.value; } catch (e) {} if (!P) await new Promise((r) => setTimeout(r, 3000)); }
  if (!P) { S.st = "packs read fail"; return; }
  const cats = [];
  for (const pk of ["starter", "levelup"]) for (const sx of ["M", "F"]) for (const ag of ["10대", "20대", "30대"]) ((P[pk][sx] || {})[ag] || []).forEach((c, ci) => { if (!opts.only || opts.only(pk, sx, ag, c.cat)) cats.push({ c, key: `${pk[0]}${sx}${ag.charAt(0)}_${ci}` }); });
  S.total = cats.length; S.st = "running";
  const ver = Date.now(); const base = "https://cbuydjkvvzbluyohdkie.supabase.co/storage/v1/object/public/media/";
  const NEED = opts.need || 12;
  const q = cats.slice();
  const worker = async () => {
    while (q.length) {
      const { c, key } = q.shift(); const good = [];
      for (const st of c.sets) {
        if (good.length >= NEED) break;
        if (/\/media\/packs\//.test(st.board || "")) {
          let redo = false;
          if (st.redo) redo = true;
          else if (opts.recheck) { for (const it of st.items) if (["아우터", "상의", "하의", "신발"].includes(it.role) && (await wasBad(it))) { redo = true; break; } }
          if (!redo) { good.push(st); continue; }
          delete st.redo;
          S.redo = (S.redo || 0) + 1; if (S.log.length < 60) S.log.push("redo " + key + "_" + good.length);
        }
        try {
          const blob = await makeBoard(st);
          const path = `packs/${key}_${String(st.sid || Math.random().toString(36).slice(2)).replace(/[^A-Za-z0-9_-]/g, "")}.jpg`;
          let up = null; for (let k = 0; k < 3; k++) { up = await supabaseClient.storage.from("media").upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "604800" }); if (!up.error) break; await new Promise((r) => setTimeout(r, 1500)); }
          if (up.error) throw new Error(up.error.message);
          if (!st.snap) st.snap = st.board;
          st.board = base + path + "?v=" + ver; good.push(st);
        } catch (e) { S.fail++; if (S.log.length < 30 && !/model photo/.test(e.message)) S.log.push(key + " " + e.message); }
      }
      c.sets = good; S.done++;
    }
  };
  await Promise.all([1, 2, 3].map(worker));
  for (const pk of ["starter", "levelup"]) for (const sx of ["M", "F"]) for (const ag of ["10대", "20대", "30대"]) if (P[pk][sx] && P[pk][sx][ag]) P[pk][sx][ag] = P[pk][sx][ag].filter((c) => c.sets.length);
  for (const pk of ["starter", "levelup"]) for (const sx of ["M", "F"]) for (const ag of ["10대", "20대", "30대"]) ((P[pk][sx] || {})[ag] || []).forEach((c) => c.sets.forEach((st) => st.items.forEach((i) => { delete i.alt; })));
  if (!opts.only) P.ready = true;
  S.st = "saving";
  let ok = false; for (let k = 0; k < 5 && !ok; k++) { try { const { error } = await supabaseClient.from("site_data").upsert({ id: "packs", value: P }); if (error) throw error; ok = true; } catch (e) { await new Promise((r) => setTimeout(r, 4000)); } }
  S.st = ok ? "done" : "save fail"; window.__bmP = P;
};
