// 무신사 실시간 타임세일·프리쿠폰 꿀템 → MD STUDIO (main.bf.ts)
// www.musinsa.com 탭(로그인)에서 실행. 결과: window.__tsData (JSON 문자열), 노란 COPY TS 버튼(id __tsb)
// 포함: ① 타임세일 ② '무진장' 표시 ③ 쿠폰적용가(couponPrice)가 판매가보다 10% 이상 낮음(프리쿠폰). 쿠폰받기 버튼은 누르지 않음(읽기만).
window.__tsRun = async () => {
  const S = (window.__ts = { st: "start" });
  const ids = new Set(), pop = {};
  const add = (id, w) => { id = String(id); ids.add(id); pop[id] = (pop[id] || 0) + w; };
  // 1) 랭킹 (전체·급상승)
  const jobs = []; ["000", "002", "001", "003", "103"].forEach((c) => ["M", "A"].forEach((gf) => ["AGE_BAND_ALL", "AGE_BAND_20", "AGE_BAND_25", "AGE_BAND_30"].forEach((ab) => [199, 201].forEach((sec) => jobs.push(["r", c, gf, ab, sec])))));
  // 2) 검색 (노스페이스는 매번 전부, 그 외 인기 브랜드·겨울 카테고리)
  const NFK = ["노스페이스 패딩", "노스페이스 눕시", "노스페이스 화이트라벨", "노스페이스 플리스", "노스페이스 자켓", "노스페이스 다운", "노스페이스 맨투맨", "노스페이스 부티", "노스페이스 팬츠", "노스페이스"];
  const KW = ["반스", "후아유", "마인드브릿지", "소라노", "디스커버리", "무신사 스탠다드", "아디다스", "나이키", "뉴발란스", "스파오", "컬럼비아", "지오다노", "에잇세컨즈", "폴로", "패딩", "숏패딩", "코트", "플리스", "니트", "맨투맨", "후드티", "기모 팬츠", "데님", "부츠", "스니커즈", "무스탕", "MA-1"];
  NFK.forEach((k) => ["SALE_ONE_WEEK_COUNT", "POPULAR"].forEach((so) => jobs.push(["s", k, so, 2])));
  KW.forEach((k) => jobs.push(["s", k, "SALE_ONE_WEEK_COUNT", 1]));
  await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map(async () => {
    while (jobs.length) {
      const j = jobs.shift();
      try {
        if (j[0] === "r") {
          const r = await (await fetch(`https://api.musinsa.com/api2/hm/web/v5/pans/ranking/sections/${j[4]}?storeCode=musinsa&categoryCode=${j[1]}&ageBand=${j[3]}&gf=${j[2]}`, { credentials: "include" })).json();
          let i = 0; for (const m of (r.data && r.data.modules) || []) for (const it of m.items || []) { if (it.type !== "PRODUCT_COLUMN" || !it.info) continue; i++; if (!it.info.isSoldOut) add(it.id, 1 / (i + 4)); }
        } else {
          const t = await (await fetch("/search/goods?keyword=" + encodeURIComponent(j[1]) + "&gf=M&sortCode=" + j[2], { credentials: "include" })).text();
          [...new Set((t.match(/(?:data-item-id=\\?"|goodsNo\\?":|products\/)(\d{6,8})/g) || []).map((x) => x.match(/(\d{6,8})/)[1]))].slice(0, 60).forEach((id, i) => add(id, j[3] / (i + 6)));
        }
      } catch (e) {}
      S.st = "candidates left " + jobs.length;
    }
  }));
  // 3) 사이트 실시간 꿀템(bf.hot)
  try {
    const K = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNidXlkamt2dnpibHV5b2hka2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MjYxMDIsImV4cCI6MjEwNTIwMjEwMn0.dYpj7w5zpyrWeF4YgQ19U6rN3x0pxZwVo8QNiosV4KI";
    const h = (await (await fetch("https://cbuydjkvvzbluyohdkie.supabase.co/rest/v1/site_data?id=eq.main&select=h:value->bf->hot", { headers: { apikey: K, Authorization: "Bearer " + K } })).json())[0].h || {};
    [...(h.cats || []).flatMap((c) => c.items), ...(h.rise || [])].forEach((x) => x && x.i && add(x.i, 0.05));
  } catch (e) {}
  // 4) 상품별 확인
  const now = Date.now(), det = {}; const q = [...ids];
  S.st = "detail " + q.length;
  const FAMB = /노스페이스|반스|아디다스|나이키|뉴발란스|디스커버리|컬럼비아|폴로|살로몬|어그|파타고니아|칼하트/;
  const BADN = /반팔|반소매|반바지|쇼츠|숏 팬츠|나시|민소매|키즈|KIDS|여성|우먼|WOMEN|모자|캡|비니|양말|삭스|장갑|가방|백팩|토트|크로스백|파우치|지갑|벨트|목걸이|팔찌|반지|시계|향수|키링/i;
  await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map(async () => {
    while (q.length) {
      const id = q.shift();
      try {
        const d = (await (await fetch("https://goods-detail.musinsa.com/api2/goods/" + id, { credentials: "include" })).json()).data;
        if (!d || d.isOutOfStock || d.goodsSaleType !== "SALE") continue;
        const st = d.sellStartDate && d.sellStartDate !== "null" ? Date.parse(d.sellStartDate + "+09:00") : 0; if (st && st > now) continue;
        const brand = (d.brandInfo && d.brandInfo.brandName) || d.brandName || d.brand || "", name = d.goodsNm || "";
        if (/지프|스칼렛또블랙/.test(brand) || BADN.test(name)) continue;
        const labs = (d.labels || []).map((l) => l.name || "");
        if (labs.some((l) => /아울렛/.test(l))) continue;
        const top = (d.category || {}).categoryDepth1Name || ""; if (!["아우터", "상의", "바지", "신발"].includes(top)) continue;
        const gp = d.goodsPrice || {}; const nor = gp.normalPrice || 0, sale = gp.salePrice || 0, cpn = gp.couponPrice || 0;
        if (!nor || !sale) continue;
        const isCpn = cpn > 0 && cpn <= sale * 0.9, isTs = !!d.isTimeSale, isMj = labs.some((l) => /무진장/.test(l));
        if (!isCpn && !isTs && !isMj) continue;
        const fin = isCpn ? cpn : sale; const tot = Math.round((1 - fin / nor) * 100); if (tot < 10) continue;
        const end = isTs && d.saleEndDate ? Date.parse(String(d.saleEndDate).replace(" ", "T") + (/[+Z]/.test(String(d.saleEndDate).slice(10)) ? "" : "+09:00")) : 0;
        if (end && end < now + 20 * 60e3) continue;
        const rv = (d.goodsReview && d.goodsReview.totalCount) || 0, sc = (d.goodsReview && d.goodsReview.satisfactionScoreDecimal) || 0;
        const fam = FAMB.test(brand);
        if (!(fam && isCpn) && !(rv >= 300 && (!sc || sc >= 4.7))) continue;
        const im = d.thumbnailImageUrl || ""; 
        det[id] = { i: id, brand, name, img: (/^https?:/.test(im) ? im : "https://image.msscdn.net" + im).replace(/_\d{3}\.(jpg|png|webp)$/i, "_500.$1"), price: nor, now: sale, sale: fin, rate: tot, rv, end, kind: isCpn ? "무진장 프리쿠폰" : isTs ? "타임세일" : "무진장 프리오픈", soon: d.isSoonOutOfStock ? 1 : 0, fam };
      } catch (e) {}
      S.st = "detail left " + q.length;
    }
  }));
  // 5) 같은 상품 색상 여러 개면 대표 1개, 노스페이스 묶음 먼저
  const keyOf = (x) => x.brand + "|" + x.name.replace(/^[A-Z]{2}[A-Z0-9]{5,}\s*/, "").replace(/\((RDS|공용)\)/g, "").replace(/[\s_\-\/]+[A-Z][A-Z_\s]*$/, "").replace(/\s*[\[(][^\])]*[\])]\s*$/, "").replace(/\s+/g, "").slice(0, 18);
  const score = (x) => (x.rate / 100) * (1 + Math.log10(1 + x.rv) / 2) * (1 + Math.min(1.5, (pop[x.i] || 0) * 3));
  const seen = new Set(); const uniq = Object.values(det).sort((a, b) => score(b) - score(a)).filter((x) => { const k = keyOf(x); if (seen.has(k)) return false; seen.add(k); return true; });
  const nf = uniq.filter((x) => x.brand === "노스페이스").slice(0, 14);
  const perB = {}; const rest = uniq.filter((x) => x.brand !== "노스페이스").filter((x) => { perB[x.brand] = (perB[x.brand] || 0) + 1; return perB[x.brand] <= 3; }).slice(0, 26);
  for (let i = 1; i < rest.length; i++) if (rest[i].brand === rest[i - 1].brand) { const j = rest.findIndex((x, k) => k > i && x.brand !== rest[i - 1].brand); if (j > 0) [rest[i], rest[j]] = [rest[j], rest[i]]; }
  const pick = [...nf, ...rest];
  S.st = "links " + pick.length;
  const cache = JSON.parse(localStorage.getItem("mdcpLinks") || "{}");
  const need = pick.filter((x) => !cache[x.i]);
  await Promise.all([1, 2, 3, 4].map(async () => { while (need.length) { const x = need.shift(); try { const r = await fetch("https://api.one.musinsa.com/api2/affiliate/v2/link/product/" + x.i, { method: "POST", credentials: "include", headers: { Accept: "application/json", "Content-Type": "application/json", "X-Platform": "MUSINSA" }, body: "{}" }); const l = await r.json(); const m = String((l.data && l.data.link) || "").match(/^https:\/\/www\.musinsa\.com\/curator\/goods\/([A-Za-z0-9]+)$/); if (m) cache[x.i] = m[1]; } catch (e) {} } }));
  localStorage.setItem("mdcpLinks", JSON.stringify(cache));
  const items = pick.filter((x) => cache[x.i]).map((x) => { const o = Object.assign({}, x, { link: "https://www.musinsa.com/curator/goods/" + cache[x.i] }); delete o.fam; return o; });
  window.__tsData = JSON.stringify({ at: new Date().toISOString(), items });
  S.st = "done " + items.length + " items (후보 " + ids.size + ", 통과 " + Object.keys(det).length + ", 노스페이스 " + nf.length + ")";
  let b = document.getElementById("__tsb");
  if (!b) { b = document.createElement("button"); b.id = "__tsb"; b.style.cssText = "position:fixed;left:10px;top:10px;z-index:2147483647;background:#ffe14d;border:2px solid #000;font:bold 16px sans-serif;padding:14px 18px"; document.body.appendChild(b); }
  b.textContent = "COPY TS"; b.onclick = () => navigator.clipboard.writeText(window.__tsData).then(() => { b.textContent = "OK " + items.length; });
  return S;
};
