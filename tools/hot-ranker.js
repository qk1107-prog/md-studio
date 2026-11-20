// 무신사 실시간 랭킹(20·30대 남녀, 세부 카테고리별) → MD STUDIO "지금 제일 핫한 아이템"
// www.musinsa.com 탭(로그인)에서 실행. 결과: window.__hotData (JSON 문자열), 노란 COPY HOT 버튼(id __hpb)
window.__hotRun = async () => {
  const S = (window.__hot = { st: "start" });
  const SUBS = [
    ["아우터", "숏패딩", "002012"], ["아우터", "롱패딩", "002013"], ["아우터", "싱글 코트", "002007"], ["아우터", "더블 코트", "002024"],
    ["아우터", "무스탕·퍼", "002025"], ["아우터", "플리스", "002023"], ["아우터", "MA-1·블루종", "002001"], ["아우터", "레더 재킷", "002002"],
    ["아우터", "경량 패딩", "002027"], ["아우터", "후드 집업", "002022"], ["아우터", "카디건", "002020"],
    ["상의", "니트", "001006"], ["상의", "맨투맨", "001005"], ["상의", "후드티", "001004"], ["상의", "긴팔 티", "001010"], ["상의", "셔츠", "001002"],
    ["바지", "데님", "003002"], ["바지", "슬랙스", "003008"], ["바지", "트레이닝·조거", "003004"], ["바지", "코튼 팬츠", "003007"],
    ["신발", "스니커즈", "103004"], ["신발", "부츠·워커", "103002"], ["신발", "어그·퍼 신발", "103007"], ["신발", "구두·로퍼", "103001"],
    ["가방", "백팩", "004001"], ["가방", "크로스백", "004002"], ["가방", "숄더백", "004003"],
    ["잡화", "머플러", "101008"], ["잡화", "모자", "120"],
  ];
  const BANDS = ["AGE_BAND_20", "AGE_BAND_25", "AGE_BAND_30", "AGE_BAND_35"];
  const PER = 6;
  const RISE = ["002", "001", "003", "103", "004", "101", "120"];
  const jobs = []; SUBS.forEach((s, si) => BANDS.forEach((b) => jobs.push([si, b, s[2], 199])));
  RISE.forEach((c) => BANDS.forEach((b) => jobs.push([-1, b, c, 201])));
  const rank = SUBS.map(() => ({})); const meta = {}; const riseSc = {};
  let done = 0;
  await Promise.all([1, 2, 3, 4, 5, 6].map(async () => {
    while (jobs.length) {
      const [si, b, code, sec] = jobs.shift();
      try {
        const j = await (await fetch(`https://api.musinsa.com/api2/hm/web/v5/pans/ranking/sections/${sec}?storeCode=musinsa&categoryCode=${code}&ageBand=${b}&gf=A`, { credentials: "include" })).json();
        let i = 0;
        for (const m of (j.data && j.data.modules) || []) for (const it of m.items || []) {
          if (it.type !== "PRODUCT_COLUMN" || !it.info) continue;
          if (i >= 40) break;
          const id = String(it.id); i++;
          if (it.info.isSoldOut) continue;
          if (si < 0) { if (i <= 15) riseSc[id] = (riseSc[id] || 0) + 1 / (i + 2); } else rank[si][id] = (rank[si][id] || 0) + 1 / (i + 2);
          const w = ((it.info.additionalInformation || []).map((x) => x.text).filter((x) => /보는 중|구매 중/.test(x)));
          const prev = meta[id];
          if (!prev || (w.join() && !prev.w.join())) meta[id] = { brand: it.info.brandName, name: it.info.productName, img: (it.image || {}).url || "", final: it.info.finalPrice, rate: it.info.discountRatio || 0, w };
        }
      } catch (e) {}
      done++; S.st = "rank " + done;
    }
  }));
  // 세부 카테고리별 상위 (같은 상품은 처음 나온 카테고리에만)
  const used = new Set(); const pick = SUBS.map(() => []);
  SUBS.forEach((s, si) => {
    const ids = Object.keys(rank[si]).sort((a, b) => rank[si][b] - rank[si][a]);
    const seenName = new Set();
    for (const id of ids) {
      if (pick[si].length >= PER + 3) break;
      if (used.has(id)) continue;
      const g = meta[id]; if (!g) continue;
      const nk = g.brand + "|" + String(g.name).replace(/[\[(][^\])]*[\])]/g, "").replace(/\s+/g, "").slice(0, 12); if (seenName.has(nk)) continue;
      seenName.add(nk); used.add(id); pick[si].push(id);
    }
  });
  const rise = Object.keys(riseSc).sort((a, b) => riseSc[b] - riseSc[a]).filter((id) => meta[id]).slice(0, 40);
  const all = [...new Set([...pick.flat(), ...rise])];
  S.st = "info " + all.length;
  const info = {};
  for (let i = 0; i < all.length; i += 30) {
    try { const j = await (await fetch("https://content.musinsa.com/api2/content/magazine-misc/v1/goods?saleStates=SALE&goodsIds=" + all.slice(i, i + 30).join(",") + "&sort=RANK&tabId=default&gf=A")).json(); ((j.data && j.data.list) || []).forEach((g) => { info[g.goodsNo] = g; }); } catch (e) {}
  }
  S.st = "links";
  const cache = JSON.parse(localStorage.getItem("mdcpLinks") || "{}");
  const need = all.filter((id) => !cache[id]);
  await Promise.all([1, 2, 3, 4, 5, 6].map(async () => {
    while (need.length) {
      const id = need.shift();
      try { const r = await fetch("https://api.one.musinsa.com/api2/affiliate/v2/link/product/" + id, { method: "POST", credentials: "include", headers: { Accept: "application/json", "Content-Type": "application/json", "X-Platform": "MUSINSA" }, body: "{}" }); const l = await r.json(); const m = String((l.data && l.data.link) || "").match(/^https:\/\/www\.musinsa\.com\/curator\/goods\/([A-Za-z0-9]+)$/); if (m) cache[id] = m[1]; } catch (e) {}
    }
  }));
  localStorage.setItem("mdcpLinks", JSON.stringify(cache));
  const mk = (id) => {
      const g = meta[id], f = info[id]; if (!cache[id] || !g) return null;
      if (f && f.isSoldOut) return null;
      const sale = (f && f.price) || g.final, rate = (f && f.saleRate) || g.rate || 0;
      const price = (f && f.normalPrice) || (rate ? Math.round(sale / (1 - rate / 100) / 100) * 100 : sale);
      return { i: id, brand: g.brand, name: g.name, img: String((f && f.thumbnail) || g.img).replace("/thumbnails/images/", "/images/").replace(/_\d{3}\.(jpg|png|webp)$/i, "_500.$1"), link: "https://www.musinsa.com/curator/goods/" + cache[id], price, sale, rate, rv: (f && f.reviewCount) || 0, w: g.w.slice(0, 2) };
  };
  const cats = [];
  SUBS.forEach(([grp, name], si) => {
    const items = [];
    for (const id of pick[si]) { if (items.length >= PER) break; const x = mk(id); if (x) items.push(x); }
    if (items.length >= 3) cats.push({ cat: name, grp, items });
  });
  const riseItems = []; const rb = new Set();
  for (const id of rise) { if (riseItems.length >= 30) break; const x = mk(id); if (!x) continue; const k = x.brand + x.name.slice(0, 10); if (rb.has(k)) continue; rb.add(k); riseItems.push(x); }
  window.__hotData = JSON.stringify({ at: new Date().toISOString(), cats, rise: riseItems });
  S.st = "done " + cats.length + " cats rise" + riseItems.length + " " + cats.reduce((a, c) => a + c.items.length, 0) + " items";
  let b = document.getElementById("__hpb");
  if (!b) { b = document.createElement("button"); b.id = "__hpb"; b.style.cssText = "position:fixed;left:10px;top:10px;z-index:2147483647;background:#ffe14d;border:2px solid #000;font:bold 16px sans-serif;padding:14px 18px"; document.body.appendChild(b); }
  b.textContent = "COPY HOT"; b.onclick = () => navigator.clipboard.writeText(window.__hotData).then(() => { b.textContent = "OK " + cats.length; });
  return window.__hot;
};
