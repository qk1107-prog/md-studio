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
    const sc = (x) => (FREQ[x.i] || 0) * 5 + Math.max(0, 30 - (BEST[x.i] ?? 99) * 0.5) + Math.log10(x.rv + 1) * 12 + x.rate * 0.3 + (x.cpn ? 5 : 0) + (x.mj ? 6 : 0);
    let pick = det.filter((x) => (x.rv >= 30 && ((FREQ[x.i] || 0) >= 2 || x.rv >= 500)) || ((FREQ[x.i] || 0) >= 8 && (BEST[x.i] ?? 99) < 20)).sort((a, b) => sc(b) - sc(a)).slice(0, opt.n || 100);
    // 다양하게: 브랜드당 최대 4개, 종류(패딩·코트·플리스·자켓…)를 번갈아, 같은 브랜드 연속 금지
    const bc = {}; pick = det.filter((x) => (x.rv >= 30 && ((FREQ[x.i] || 0) >= 2 || x.rv >= 500)) || ((FREQ[x.i] || 0) >= 8 && (BEST[x.i] ?? 99) < 20)).sort((a, b) => sc(b) - sc(a)).filter((x) => (bc[x.brand] = (bc[x.brand] || 0) + 1) <= 4).slice(0, opt.n || 100);
    const TY = key === "kicks" ? [["스니커즈", /스니커|운동화|러닝|트레이너|삼바|포스|덩크|조던|SL ?72|가젤|척|올드스쿨|젤|카야노|뉴발란스|\d{3,4}[A-Z]/i], ["부츠·워커", /부츠|워커|첼시|6인치|웨스턴/], ["로퍼·더비", /로퍼|더비|구두|정장|옥스포드|몽크/], ["방한·슬리퍼", /방한|패딩|퍼 |뮬|슬리퍼|어그|털/]] : [["패딩", /패딩|다운|푸퍼|덕다운|구스|PADD|DOWN|PUFFER/i], ["코트", /코트|COAT/i], ["플리스", /플리스|후리스|FLEECE|보아|셰르파/i], ["레더·무스탕", /레더|가죽|무스탕|시어링|LEATHER|MUSTANG/i], ["자켓·블루종", /자켓|재킷|블루종|봄버|MA-1|JACKET|헤링턴|트러커|워크/i], ["바람막이·기타", /./]];
    const tyOf = (x) => (TY.find((t) => t[1].test(x.name)) || TY[TY.length - 1])[0];
    const buckets = TY.map((t) => pick.filter((x) => tyOf(x) === t[0]));
    const mixed = []; for (let r = 0; mixed.length < pick.length && r < 200; r++) buckets.forEach((B) => { if (B[r]) mixed.push(B[r]); });
    // 처음 10개는 점수 높은 순(하입 최상위)을 유지하고 나머지를 종류별로 섞기
    const top10 = pick.slice(0, 10); const rest = mixed.filter((x) => !top10.includes(x));
    pick = [...top10, ...rest];
    const arr = [];
    while (pick.length) { const j = pick.findIndex((x) => !arr.length || x.brand !== arr[arr.length - 1].brand); arr.push(pick.splice(j < 0 ? 0 : j, 1)[0]); }
    arr.forEach((x) => (x.ty = tyOf(x)));
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
    out[key] = arr.filter((x) => cache[x.i]).slice(0, opt.n || 100).map((x) => ({ i: x.i, brand: x.brand, name: x.name, img: x.img, link: "https://www.musinsa.com/curator/goods/" + cache[x.i], price: x.price, sale: x.sale, cpn: x.cpn, rate: x.rate, rv: x.rv, mj: x.mj, ty: x.ty }));
  }
  localStorage.setItem("mdcpLinks", JSON.stringify(cache));
  window.__r1Data = JSON.stringify(out);
  S.st = "done " + CATS.map(([k]) => k + " " + (out[k] || []).length).join(" · ");
  let b = document.getElementById("__r1b");
  if (!b) { b = document.createElement("button"); b.id = "__r1b"; b.style.cssText = "position:fixed;top:10px;left:10px;z-index:999999;background:#ffeb3b;padding:10px 14px;font-weight:700"; document.body.appendChild(b); }
  b.textContent = "COPY R1"; b.onclick = () => navigator.clipboard.writeText(window.__r1Data).then(() => { b.textContent = "OK " + window.__r1Data.length; });
  return S;
};
