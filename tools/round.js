// 무진장 회차 카테고리 꿀템 (1회차 아우터·킥스 등) — 무신사 탭(로그인)에서 실행
// 결과: window.__r1Data (JSON 문자열 {at, outer:[...], kicks:[...]}) + 노란 COPY R1 버튼(id __r1b)
window.__r1Run = async (opt) => {
  opt = opt || {};
  const S = (window.__r1 = { st: "start" });
  const CATS = opt.cats || [["outer", ["002"]], ["kicks", ["103", "018"]]];
  const EX = /여성|우먼|WOMEN|키즈|KIDS|아동|주니어|양말|삭스|인솔|슈케어|끈/i;
  const cache = JSON.parse(localStorage.getItem("mdcpLinks") || "{}");
  const out = { at: new Date().toISOString() };
  const FREQ = {}, BEST = {};
  const ids = async (code) => {
    const set = [];
    // 전체 + 10·20·30대 랭킹을 번갈아 섞어서 '요즘 제일 잘 나가는' 순서로
    const lists = [];
    await Promise.all(["199", "200", "201"].flatMap((sec) => ["", "AGE_BAND_MINOR", "AGE_BAND_20", "AGE_BAND_25", "AGE_BAND_30", "AGE_BAND_35"].map(async (ab) => {
      try {
        const t = await (await fetch(`https://api.musinsa.com/api2/hm/web/v5/pans/ranking/sections/${sec}?storeCode=musinsa&categoryCode=${code}&gf=M${ab ? "&ageBand=" + ab : ""}`, { credentials: "include" })).text();
        const L = []; (t.match(/"(?:goodsNo|id)":"?(\d{6,8})"?/g) || []).forEach((m) => { const id = m.match(/(\d{6,8})/)[1]; if (!L.includes(id)) L.push(id); });
        lists.push(L); L.forEach((id, k) => { FREQ[id] = (FREQ[id] || 0) + 1; BEST[id] = Math.min(BEST[id] ?? 999, k); });
      } catch (e) {}
    })));
    for (let r = 0; r < 150; r++) lists.forEach((L) => { if (L[r] && !set.includes(L[r])) set.push(L[r]); });
    return set.slice(0, 320);
  };
  for (const [key, codes] of CATS) {
    S.st = "rank " + key;
    let list = [];
    for (const c of codes) (await ids(c)).forEach((id) => { if (!list.includes(id)) list.push(id); });
    const rankOf = {}; list.forEach((id, i) => (rankOf[id] = i));
    S.st = "detail " + key + " " + list.length;
    const det = [];
    const q = list.slice();
    await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map(async () => {
      while (q.length) {
        const id = q.shift();
        try {
          const d = (await (await fetch("https://goods-detail.musinsa.com/api2/goods/" + id, { credentials: "include" })).json()).data;
          if (!d || d.isOutOfStock) continue;
          const gp = d.goodsPrice || {}; const nor = gp.normalPrice || 0, sale = gp.salePrice || nor, cpn = gp.couponPrice && gp.couponPrice < sale ? gp.couponPrice : 0;
          const fin = cpn || sale; const rate = nor ? Math.round((1 - fin / nor) * 100) : 0;
          const name = d.goodsNm || ""; const brand = (d.brandInfo && d.brandInfo.brandName) || "";
          if (EX.test(name) || !nor) continue;
          const rv = (d.goodsReview && d.goodsReview.totalCount) || 0;
          const lab = JSON.stringify(d.labels || d.goodsLabels || "");
          det.push({ i: String(id), brand, name, img: "https://image.msscdn.net" + String(d.thumbnailImageUrl || "").replace(/_\d{3}\.(jpg|png|webp)$/i, "_500.$1"), price: nor, sale, cpn, rate, rv, mj: /무진장/.test(lab) ? 1 : 0, rk: rankOf[id] });
        } catch (e) {}
      }
    }));
    // 트렌드(랭킹) 우선 + 후기 + 할인 + 쿠폰·무진장
    // 하입 점수: 여러 나이대·랭킹에 계속 들어가 있는 정도(FREQ) + 최고 순위 + 후기 + 할인·쿠폰
    const sc = (x) => (FREQ[x.i] || 0) * 9 + Math.max(0, 40 - (BEST[x.i] ?? 99) * 0.6) + Math.log10(x.rv + 10) * 9 + x.rate * 0.4 + (x.cpn ? 6 : 0) + (x.mj ? 8 : 0);
    let pick = det.filter((x) => (FREQ[x.i] || 0) >= 2 || x.rv >= 300 || (BEST[x.i] ?? 99) < 10).sort((a, b) => sc(b) - sc(a)).slice(0, opt.n || 100);
    // 같은 브랜드 연속 금지
    const arr = [];
    while (pick.length) { const j = pick.findIndex((x) => !arr.length || x.brand !== arr[arr.length - 1].brand); arr.push(pick.splice(j < 0 ? 0 : j, 1)[0]); }
    S.st = "links " + key;
    const need = arr.map((x) => x.i).filter((id) => !cache[id]);
    await Promise.all([1, 2, 3, 4].map(async () => {
      while (need.length) {
        const id = need.shift();
        try {
          const l = await (await fetch("https://api.one.musinsa.com/api2/affiliate/v2/link/product/" + id, { method: "POST", credentials: "include", headers: { Accept: "application/json", "Content-Type": "application/json", "X-Platform": "MUSINSA" }, body: "{}" })).json();
          const m = String((l.data && l.data.link) || "").match(/^https:\/\/www\.musinsa\.com\/curator\/goods\/([A-Za-z0-9]+)$/);
          if (m) cache[id] = m[1];
        } catch (e) {}
      }
    }));
    out[key] = arr.filter((x) => cache[x.i]).slice(0, opt.n || 100).map((x) => ({ i: x.i, brand: x.brand, name: x.name, img: x.img, link: "https://www.musinsa.com/curator/goods/" + cache[x.i], price: x.price, sale: x.sale, cpn: x.cpn, rate: x.rate, rv: x.rv, mj: x.mj }));
  }
  localStorage.setItem("mdcpLinks", JSON.stringify(cache));
  window.__r1Data = JSON.stringify(out);
  S.st = "done " + CATS.map(([k]) => k + " " + (out[k] || []).length).join(" · ");
  let b = document.getElementById("__r1b");
  if (!b) { b = document.createElement("button"); b.id = "__r1b"; b.style.cssText = "position:fixed;top:10px;left:10px;z-index:999999;background:#ffeb3b;padding:10px 14px;font-weight:700"; document.body.appendChild(b); }
  b.textContent = "COPY R1"; b.onclick = () => navigator.clipboard.writeText(window.__r1Data).then(() => { b.textContent = "OK " + window.__r1Data.length; });
  return S;
};
