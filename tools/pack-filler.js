// 스타터팩·레벨업 팩 빈칸 채우기 (www.musinsa.com 탭에서 실행)
// 입력: window.__pfRun({ P: packs 값, flagged: [gno...], target: 12 })
// 결과: window.__pfData (JSON 문자열: { cells:[{pk,sx,ag,cat,replace,sets}], alts:{gno:[url]} }), 노란 COPY 버튼(id __pfb)
window.__pfRun = async ({ P, flagged = [], target = 12 }) => {
  const S = (window.__pf = { st: "start", log: [] });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const A = "https://content.musinsa.com/api2/content/snap/v1/snaps?sort=POPULAR&size=50&seasonLabels=1";
  const G = { M: "MEN", F: "WOMEN" };
  const AGES = ["10대", "20대", "30대"], PKS = ["starter", "levelup"];
  const OUTER = { 코트: ["002007", "002024", "002009", "002008"], 패딩: ["002012", "002013", "002027"], "MA-1": ["002001"], 자켓: ["002002", "002003", "002014", "002017", "002004", "002006", "002023", "002025"] };
  const STYLE = { 캐주얼: 8, 스트릿: 10, 미니멀: 5, 시크: 16, 포멀: 9, 걸리시: 13 };
  const RSEC = { 미니멀: [209], 시크: [210], 스트릿: [203], 걸리시: [207, 206], 캐주얼: [202], 포멀: [209, 210] };
  const EXTRA = { F: { 미니멀: ["musinsastandardwoman"], 스트릿: ["nastyfancyclub"], 걸리시: ["@뚜오미오"] }, M: {} };
  const MINIMAL_OUTER = ["002007", "002024", "002009", "002008", "002003"];
  const get = async (q) => { for (let k = 0; k < 3; k++) { try { const j = await (await fetch(A + q, { credentials: "include" })).json(); return (j.data && j.data.list) || []; } catch (e) { await sleep(700); } } return []; };
  const many = async (qs) => { const out = []; const q = qs.slice(); await Promise.all([1, 2, 3, 4, 5, 6].map(async () => { while (q.length) { const x = q.shift(); out.push(...(await get(x))); } })); return out; };
  // 1) 칸별 부족분
  const need = []; const used = new Set(), usedOuter = {};
  for (const pk of PKS) for (const sx of ["M", "F"]) for (const ag of AGES) {
    const node = (P[pk][sx] || {})[ag] || [];
    node.forEach((c) => c.sets.forEach((s) => { used.add(String(s.sid)); const o = (s.items.find((i) => i.role === "아우터") || {}).gno; if (o) (usedOuter[sx + c.cat] = usedOuter[sx + c.cat] || new Set()).add(String(o)); }));
  }
  const cats = { M: ["코트", "패딩", "자켓", "MA-1", "캐주얼", "스트릿", "미니멀", "시크", "포멀"], F: ["코트", "패딩", "자켓", "MA-1", "캐주얼", "스트릿", "미니멀", "걸리시", "시크"] };
  for (const sx of ["M", "F"]) for (const cat of cats[sx]) {
    const replace = sx === "F" && cat === "미니멀";
    const cells = [];
    PKS.forEach((pk, pi) => AGES.forEach((ag, ai) => { const c = (((P[pk][sx] || {})[ag]) || []).find((x) => x.cat === cat); const have = replace ? 0 : c ? c.sets.length : 0; if (have < target) cells.push({ pk, sx, ag, cat, t: pi * 3 + ai, d: target - have, replace }); }));
    if (cells.length) need.push({ sx, cat, cells });
  }
  S.need = need.map((n) => n.sx + n.cat + ":" + n.cells.map((c) => c.pk[0] + c.ag.charAt(0) + "-" + c.d).join(",")).join(" | ");
  // 2) 스타일 랭킹에서 브랜드 뽑기
  const slugOf = async (name) => { try { const t = await (await fetch("/search/goods?keyword=" + encodeURIComponent(name), { credentials: "include" })).text(); const m = t.match(/"brand(?:Id)?\\?"\s*:\s*\\?"([a-z0-9_]+)\\?"[^}]{0,120}?"brandName\\?"\s*:\s*\\?"([^"\\]+)/g) || []; for (const s of m) { const x = s.match(/"brand(?:Id)?\\?"\s*:\s*\\?"([a-z0-9_]+)\\?"[\s\S]*?"brandName\\?"\s*:\s*\\?"([^"\\]+)/); if (x && x[2].replace(/\s/g, "") === name.replace(/\s/g, "")) return x[1]; } } catch (e) {} return null; };
  const brandsFor = async (sx, cat) => {
    const tally = {};
    for (const sec of RSEC[cat] || []) for (const code of ["000", "002"]) {
      try {
        const j = await (await fetch(`https://api.musinsa.com/api2/hm/web/v5/pans/ranking/sections/${sec}?storeCode=musinsa&categoryCode=${code}&ageBand=AGE_BAND_ALL&gf=${sx}`, { credentials: "include" })).json();
        let i = 0; for (const m of (j.data && j.data.modules) || []) for (const it of m.items || []) { if (it.type !== "PRODUCT_COLUMN" || !it.info) continue; i++; const u = ((it.info.onClickBrandName || {}).url || "").match(/brand\/([a-z0-9_]+)/); if (u && i <= 80) tally[u[1]] = (tally[u[1]] || 0) + 1 / (i + 5); }
      } catch (e) {}
    }
    const ex = [];
    for (const b of (EXTRA[sx] || {})[cat] || []) { if (b[0] === "@") { const s = await slugOf(b.slice(1)); if (s) ex.push(s); } else ex.push(b); }
    return [...new Set([...ex, ...Object.keys(tally).sort((a, b) => tally[b] - tally[a]).slice(0, 14)])];
  };
  // 3) 스냅 → 세트
  const top = (g) => ((g.categories || [])[0] || {}).categoryCode || "";
  const sub = (g) => ((g.categories || [])[1] || {}).categoryCode || "";
  const otype = (g) => { const c = sub(g); for (const k in OUTER) if (OUTER[k].includes(c)) return k; return "자켓"; };
  const toSet = (s) => {
    const gs = s.goods || []; const pick = (f) => gs.find(f);
    const o = pick((g) => top(g) === "002"), t = pick((g) => top(g) === "001"), b = pick((g) => top(g) === "003" || top(g) === "100"), sh = pick((g) => top(g) === "103");
    if (!o || !b) return null;
    const it = [[o, "아우터"], [t, "상의"], [b, "하의"], [sh, "신발"]].filter((x) => x[0]).map(([g, r]) => ({ gno: String(g.goodsNo), role: r, brand: (g.brand && g.brand.brandName) || "", name: g.goodsName, img: (g.imageUrl || "").replace("/thumbnails/images/", "/images/"), price: (g.price && g.price.price) || 0, sold: !!g.isSoldOut }));
    if (it.length < 3 || it.some((x) => x.sold)) return null;
    return { sid: String(s.id), board: s.thumbnailUrl, ot: otype(o), osub: sub(o), obrand: it[0].brand, total: it.reduce((a, x) => a + x.price, 0), items: it };
  };
  const out = [];
  for (const n of need) {
    const { sx, cat } = n; S.st = "snaps " + sx + cat;
    let qs = [];
    if (OUTER[cat]) OUTER[cat].forEach((c) => { for (let p = 1; p <= (cat === "MA-1" ? 16 : 8); p++) qs.push(`&genders=${G[sx]}&goodsCategories=${c}&page=${p}`); });
    else {
      const br = await brandsFor(sx, cat); S.log.push(sx + cat + " brands " + br.slice(0, 16).join(","));
      br.forEach((b) => { for (let p = 1; p <= 3; p++) qs.push(`&genders=${G[sx]}&brands=${b}&page=${p}`); });
      if (!(sx === "F" && cat === "미니멀")) for (let p = 1; p <= 14; p++) qs.push(`&genders=${G[sx]}&styleLabels=${STYLE[cat]}&page=${p}`);
    }
    const snaps = await many(qs);
    const seenSid = new Set(), uo = usedOuter[sx + cat] || new Set(), perBrand = {};
    let cand = snaps.map(toSet).filter(Boolean).filter((s) => {
      if (used.has(s.sid) || seenSid.has(s.sid)) return false; seenSid.add(s.sid);
      if (OUTER[cat] && s.ot !== cat) return false;
      if (sx === "F" && cat === "미니멀" && !MINIMAL_OUTER.includes(s.osub)) return false;
      if (uo.has(s.items[0].gno)) return false; uo.add(s.items[0].gno);
      perBrand[s.obrand] = (perBrand[s.obrand] || 0) + 1; if (perBrand[s.obrand] > 4) return false;
      return true;
    });
    S.log.push(sx + cat + " snaps " + snaps.length + " cand " + cand.length);
    // 가격대 6단계 (스타터 10·20·30 → 레벨업 10·20·30)
    cand.sort((a, b) => a.total - b.total);
    const tiers = [[], [], [], [], [], []]; cand.forEach((s, i) => tiers[Math.min(5, Math.floor((i * 6) / cand.length))].push(s));
    for (const c of n.cells) {
      const got = []; const extra = Math.ceil(c.d * 1.5) + 2; // 누끼 실패 여유분
      const order = [c.t, c.t + 1, c.t - 1, c.t + 2, c.t - 2, c.t + 3, c.t - 3].filter((t) => t >= 0 && t < 6);
      for (const t of order) { while (tiers[t].length && got.length < extra) got.push(tiers[t].shift()); if (got.length >= extra) break; }
      out.push({ pk: c.pk, sx, ag: c.ag, cat, replace: c.replace, sets: got });
    }
  }
  // 4) 큐레이터 링크 + 상세컷(누끼용)
  const gnos = new Set(flagged.map(String)); out.forEach((c) => c.sets.forEach((s) => s.items.forEach((i) => gnos.add(i.gno))));
  const cache = JSON.parse(localStorage.getItem("mdcpLinks") || "{}"); const alts = {};
  const q = [...gnos]; let dn = 0;
  await Promise.all([1, 2, 3, 4, 5, 6].map(async () => {
    while (q.length) {
      const id = q.shift();
      if (!cache[id]) { try { const r = await fetch("https://api.one.musinsa.com/api2/affiliate/v2/link/product/" + id, { method: "POST", credentials: "include", headers: { Accept: "application/json", "Content-Type": "application/json", "X-Platform": "MUSINSA" }, body: "{}" }); const l = await r.json(); const m = String((l.data && l.data.link) || "").match(/^https:\/\/www\.musinsa\.com\/curator\/goods\/([A-Za-z0-9]+)$/); if (m) cache[id] = m[1]; } catch (e) {} }
      try { const d = (await (await fetch("https://goods-detail.musinsa.com/api2/goods/" + id, { credentials: "include" })).json()).data; alts[id] = (d.goodsImages || []).map((x) => x.imageUrl).filter(Boolean).slice(0, 8).map((u) => (/^https?:/.test(u) ? u : "https://image.msscdn.net" + u)); } catch (e) {}
      dn++; S.st = "links " + dn + "/" + gnos.size;
    }
  }));
  localStorage.setItem("mdcpLinks", JSON.stringify(cache));
  out.forEach((c) => { c.sets = c.sets.map((s) => { const items = s.items.filter((i) => cache[i.gno]).map((i) => ({ gno: i.gno, role: i.role, brand: i.brand, name: i.name, img: i.img, link: "https://www.musinsa.com/curator/goods/" + cache[i.gno] })); return items.length >= 3 && items[0].role === "아우터" && items.some((i) => i.role === "하의") ? { sid: s.sid, snap: "", board: s.board, items } : null; }).filter(Boolean); });
  window.__pfData = JSON.stringify({ at: new Date().toISOString(), cells: out, alts });
  S.st = "done cells " + out.length + " sets " + out.reduce((a, c) => a + c.sets.length, 0) + " size " + window.__pfData.length;
  let b = document.getElementById("__pfb");
  if (!b) { b = document.createElement("button"); b.id = "__pfb"; b.style.cssText = "position:fixed;left:0;top:0;width:220px;height:110px;z-index:2147483647;background:#ffe14d;border:2px solid #000;font:bold 16px sans-serif"; document.body.appendChild(b); }
  b.textContent = "COPY PACKS"; b.onclick = () => navigator.clipboard.writeText(window.__pfData).then(() => { b.textContent = "OK"; });
  return S;
};
