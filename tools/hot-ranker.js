// 무신사 실시간 랭킹(20·30대 남녀 합산) → MD STUDIO "실시간 제일 인기 있는 아이템"
// www.musinsa.com 탭(로그인)에서 실행. 결과: window.__hotData (JSON 문자열), 노란 COPY 버튼(id __hpb)
window.__hotRun = async () => {
  const S = (window.__hot = { st: "start" });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const bands = ["AGE_BAND_20", "AGE_BAND_25", "AGE_BAND_30", "AGE_BAND_35"];
  const lists = [];
  for (const b of bands) {
    const f = document.createElement("iframe");
    f.style.cssText = "position:fixed;left:-3000px;top:0;width:1200px;height:3000px;opacity:0";
    f.src = `https://www.musinsa.com/main/musinsa/ranking?gf=A&sectionId=199&categoryCode=000&ageBand=${b}&subPan=product`;
    document.body.appendChild(f);
    let ids = [];
    for (let k = 0; k < 40; k++) {
      await sleep(700);
      try {
        const d = f.contentDocument; if (!d) continue;
        f.contentWindow.scrollBy(0, 2500);
        ids = [...new Set([...d.querySelectorAll('a[href*="/products/"]')].map((a) => (a.getAttribute("href").match(/products\/(\d+)/) || [])[1]).filter(Boolean))];
        if (ids.length >= 90 || (k > 12 && ids.length >= 40)) break;
      } catch (e) {}
    }
    lists.push(ids); f.remove(); S.st = "rank " + b + " " + ids.length;
  }
  const sc = {}; lists.forEach((l) => l.forEach((id, i) => { sc[id] = (sc[id] || 0) + 1 / (i + 3); }));
  const ids = Object.keys(sc).sort((a, b) => sc[b] - sc[a]).slice(0, 160);
  const info = {};
  for (let i = 0; i < ids.length; i += 30) {
    try { const j = await (await fetch("https://content.musinsa.com/api2/content/magazine-misc/v1/goods?saleStates=SALE&goodsIds=" + ids.slice(i, i + 30).join(",") + "&sort=RANK&tabId=default&gf=A")).json(); ((j.data && j.data.list) || []).forEach((g) => { info[g.goodsNo] = g; }); } catch (e) {}
  }
  S.st = "detail";
  const det = {}; const q = ids.filter((id) => info[id] && !info[id].isSoldOut);
  await Promise.all([1, 2, 3, 4, 5, 6].map(async () => { while (q.length) { const id = q.shift(); try { const d = (await (await fetch("https://goods-detail.musinsa.com/api2/goods/" + id, { credentials: "include" })).json()).data; det[id] = { cat: (d.category || {}).categoryDepth1Name || "", start: d.sellStartDate, oos: d.isOutOfStock }; } catch (e) {} } }));
  const CAT = { 아우터: "아우터", 상의: "상의", 바지: "바지", 신발: "신발", 가방: "가방", 모자: "모자", "원피스/스커트": "스커트" };
  const cache = JSON.parse(localStorage.getItem("mdcpLinks") || "{}");
  const groups = {}; const seenName = new Set();
  for (const id of ids) {
    const g = info[id], d = det[id]; if (!g || !d || d.oos) continue;
    const cat = CAT[d.cat]; if (!cat) continue;
    if (d.start && d.start !== "null" && Date.parse(d.start + "+09:00") > Date.now()) continue;
    const nk = g.brandName + "|" + g.goodsName.replace(/[\[(][^\])]*[\])]\s*$/, "").slice(0, 16); if (seenName.has(nk)) continue; seenName.add(nk);
    const arr = (groups[cat] = groups[cat] || []); if (arr.length >= 10) continue;
    if (!cache[id]) {
      try { const r = await fetch("https://api.one.musinsa.com/api2/affiliate/v2/link/product/" + id, { method: "POST", credentials: "include", headers: { Accept: "application/json", "Content-Type": "application/json", "X-Platform": "MUSINSA" }, body: "{}" }); const l = await r.json(); const m = String((l.data && l.data.link) || "").match(/^https:\/\/www\.musinsa\.com\/curator\/goods\/([A-Za-z0-9]+)$/); if (m) cache[id] = m[1]; } catch (e) {}
    }
    if (!cache[id]) continue;
    arr.push({ i: id, brand: g.brandName, name: g.goodsName, img: String(g.thumbnail || "").replace("/thumbnails/images/", "/images/"), link: "https://www.musinsa.com/curator/goods/" + cache[id], price: g.normalPrice, sale: g.price, rate: g.saleRate || 0, rv: g.reviewCount || 0 });
  }
  localStorage.setItem("mdcpLinks", JSON.stringify(cache));
  const order = ["아우터", "상의", "바지", "신발", "가방", "스커트", "모자"];
  const cats = order.filter((c) => groups[c] && groups[c].length >= 2).map((c) => ({ cat: c, items: groups[c] }));
  window.__hotData = JSON.stringify({ at: new Date().toISOString(), cats });
  S.st = "done " + cats.map((c) => c.cat + c.items.length).join(" ");
  let b = document.getElementById("__hpb");
  if (!b) { b = document.createElement("button"); b.id = "__hpb"; b.style.cssText = "position:fixed;left:10px;top:10px;z-index:2147483647;background:#ffe14d;border:2px solid #000;font:bold 16px sans-serif;padding:14px 18px"; document.body.appendChild(b); }
  b.textContent = "COPY HOT"; b.onclick = () => navigator.clipboard.writeText(window.__hotData).then(() => { b.textContent = "OK " + cats.length; });
  return window.__hot;
};
