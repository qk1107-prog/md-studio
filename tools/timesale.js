// 무신사 실시간 타임세일 중 꿀템 → MD STUDIO "실시간 지금 타임세일 중 꿀템" (main.bf.ts)
// www.musinsa.com 탭(로그인)에서 실행. 결과: window.__tsData (JSON 문자열), 노란 COPY TS 버튼(id __tsb)
window.__tsRun = async () => {
  const S = (window.__ts = { st: "start" });
  const CODES = ["000", "002", "001", "003", "103", "004", "101", "120"];
  const jobs = []; CODES.forEach((c) => ["M", "F"].forEach((gf) => ["AGE_BAND_ALL", "AGE_BAND_20", "AGE_BAND_25", "AGE_BAND_30"].forEach((ab) => [199, 201].forEach((sec) => jobs.push([c, gf, ab, sec])))));
  const meta = {}, pop = {};
  await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map(async () => {
    while (jobs.length) {
      const [c, gf, ab, sec] = jobs.shift();
      try {
        const j = await (await fetch(`https://api.musinsa.com/api2/hm/web/v5/pans/ranking/sections/${sec}?storeCode=musinsa&categoryCode=${c}&ageBand=${ab}&gf=${gf}`, { credentials: "include" })).json();
        let i = 0;
        for (const m of (j.data && j.data.modules) || []) for (const it of m.items || []) {
          if (it.type !== "PRODUCT_COLUMN" || !it.info) continue; i++;
          if (it.info.isSoldOut || (it.info.discountRatio || 0) < 15) continue;
          const id = String(it.id);
          pop[id] = (pop[id] || 0) + 1 / (i + 4);
          const w = (it.info.additionalInformation || []).map((x) => x.text).filter((x) => /보는 중|구매 중/.test(x));
          if (!meta[id] || (w.length && !meta[id].w.length)) meta[id] = { brand: it.info.brandName, name: it.info.productName, img: (it.image || {}).url || "", w };
        }
      } catch (e) {}
      S.st = "rank left " + jobs.length;
    }
  }));
  const ids = Object.keys(meta).filter((id) => !/반팔|반소매|반바지|쇼츠|숏 팬츠|나시|민소매|키즈/.test(meta[id].name));
  S.st = "detail " + ids.length;
  const now = Date.now(), det = {}; const q = ids.slice();
  await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map(async () => {
    while (q.length) {
      const id = q.shift();
      try {
        const d = (await (await fetch("https://goods-detail.musinsa.com/api2/goods/" + id, { credentials: "include" })).json()).data;
        if (!d || !d.isTimeSale || d.isOutOfStock || d.goodsSaleType !== "SALE") continue;
        const st = d.sellStartDate && d.sellStartDate !== "null" ? Date.parse(d.sellStartDate + "+09:00") : 0; if (st && st > now) continue;
        const end = d.saleEndDate ? Date.parse(String(d.saleEndDate).replace(" ", "T") + (/[+Z]/.test(String(d.saleEndDate).slice(10)) ? "" : "+09:00")) : 0;
        if (end && end < now + 30 * 60e3) continue;
        const gp = d.goodsPrice || {};
        det[id] = { price: gp.normalPrice, sale: gp.salePrice, rate: gp.discountRate || 0, end, rv: (d.goodsReview || {}).totalCount || d.reviewCount || 0, top: (d.category || {}).categoryDepth1Name || "" };
      } catch (e) {}
      S.st = "detail left " + q.length;
    }
  }));
  let list = Object.keys(det).filter((id) => det[id].rate >= 15 && det[id].sale);
  // 후기 수
  for (let i = 0; i < list.length; i += 30) {
    try { const j = await (await fetch("https://content.musinsa.com/api2/content/magazine-misc/v1/goods?saleStates=SALE&goodsIds=" + list.slice(i, i + 30).join(",") + "&sort=RANK&tabId=default&gf=A")).json(); ((j.data && j.data.list) || []).forEach((g) => { const d = det[g.goodsNo]; if (d) { d.rv = g.reviewCount || d.rv || 0; d.sc = g.reviewScore || 0; if (g.thumbnail) d.img = String(g.thumbnail).replace("/thumbnails/images/", "/images/"); } }); } catch (e) {}
  }
  const score = (id) => { const d = det[id]; return (d.rate / 100) * (1 + Math.log10(1 + (d.rv || 0))) * (1 + Math.min(1, pop[id] * 4)) * (d.sc && d.sc < 90 ? 0.6 : 1); };
  list = list.filter((id) => (det[id].rv || 0) >= 20).sort((a, b) => score(b) - score(a));
  const perB = {}, pick = [];
  for (const id of list) { const b = meta[id].brand; perB[b] = (perB[b] || 0) + 1; if (perB[b] > 2) continue; pick.push(id); if (pick.length >= 30) break; }
  // 같은 브랜드 연속 X
  for (let i = 1; i < pick.length; i++) if (meta[pick[i]].brand === meta[pick[i - 1]].brand) { const j = pick.findIndex((x, k) => k > i && meta[x].brand !== meta[pick[i - 1]].brand); if (j > 0) [pick[i], pick[j]] = [pick[j], pick[i]]; }
  S.st = "links " + pick.length;
  const cache = JSON.parse(localStorage.getItem("mdcpLinks") || "{}");
  for (const id of pick) {
    if (cache[id]) continue;
    try { const r = await fetch("https://api.one.musinsa.com/api2/affiliate/v2/link/product/" + id, { method: "POST", credentials: "include", headers: { Accept: "application/json", "Content-Type": "application/json", "X-Platform": "MUSINSA" }, body: "{}" }); const l = await r.json(); const m = String((l.data && l.data.link) || "").match(/^https:\/\/www\.musinsa\.com\/curator\/goods\/([A-Za-z0-9]+)$/); if (m) cache[id] = m[1]; } catch (e) {}
  }
  localStorage.setItem("mdcpLinks", JSON.stringify(cache));
  const items = pick.filter((id) => cache[id]).slice(0, 24).map((id) => { const d = det[id], g = meta[id]; return { i: id, brand: g.brand, name: g.name, img: String(d.img || g.img).replace(/_\d{3}\.(jpg|png|webp)$/i, "_500.$1"), link: "https://www.musinsa.com/curator/goods/" + cache[id], price: d.price, sale: d.sale, rate: d.rate, rv: d.rv || 0, end: d.end || 0, w: g.w.slice(0, 2) }; });
  window.__tsData = JSON.stringify({ at: new Date().toISOString(), items });
  S.st = "done " + items.length + " items (timesale found " + Object.keys(det).length + ")";
  let b = document.getElementById("__tsb");
  if (!b) { b = document.createElement("button"); b.id = "__tsb"; b.style.cssText = "position:fixed;left:10px;top:10px;z-index:2147483647;background:#ffe14d;border:2px solid #000;font:bold 16px sans-serif;padding:14px 18px"; document.body.appendChild(b); }
  b.textContent = "COPY TS"; b.onclick = () => navigator.clipboard.writeText(window.__tsData).then(() => { b.textContent = "OK " + items.length; });
  return S;
};
