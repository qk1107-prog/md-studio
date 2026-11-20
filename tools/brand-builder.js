// 무신사 랭킹(성별·나이대·스타일) → MD STUDIO "나이대별 브랜드" 데이터 만들기
// 무신사 탭(www.musinsa.com, 로그인 상태)에서 실행. 결과는 window.__brData, 노란 COPY 버튼으로 복사.
// localStorage.mdTrend = 트렌드세터(아카이브쿠·패플서) 큐레이터 샵 상품번호 배열 (있으면 20대 남자 '트렌드세터' 칩 생성)
(async () => {
  const SECS = { 202: "캐주얼", 203: "스트릿", 209: "포멀", 210: "포멀", 301: "핀터", 205: "핀터" };
  const AGES = { AGE_BAND_MINOR: "10대", AGE_BAND_20: "20대", AGE_BAND_25: "20대", AGE_BAND_30: "30대", AGE_BAND_35: "30대" };
  const get = async (sec, gf, age) => {
    const u = `https://client.musinsa.com/api/home/web/v5/pans/ranking/sections/${sec}?storeCode=musinsa&gf=${gf}&ageBand=${age}&period=WEEKLY&categoryCode=000&contentsId=&page=1&size=100`;
    try {
      const j = await (await fetch(u, { credentials: "include" })).json();
      const items = [];
      const walk = (o) => {
        if (Array.isArray(o)) o.forEach(walk);
        else if (o && typeof o === "object") {
          if (o.type === "PRODUCT_COLUMN") {
            const i = o.info || {};
            items.push({ id: String(o.id), r: (o.image && o.image.rank) || 100, img: o.image && o.image.url, b: i.brandName, n: i.productName, so: i.isSoldOut });
            return;
          }
          for (const k in o) walk(o[k]);
        }
      };
      walk(j.data);
      return items;
    } catch (e) { return []; }
  };
  const jobs = [];
  for (const gf of ["M", "F"]) for (const age in AGES) for (const sec in SECS) jobs.push([sec, gf, age]);
  const R = {};
  for (let i = 0; i < jobs.length; i += 6) await Promise.all(jobs.slice(i, i + 6).map(async ([sec, gf, age]) => { R[`${sec}|${gf}|${age}`] = await get(sec, gf, age); }));

  // 그룹별 브랜드 점수, 같은 성별 전체 상품 풀
  const G = {}, POOL = { M: {}, F: {} };
  for (const [k, items] of Object.entries(R)) {
    const [sec, gf, age] = k.split("|");
    const gk = `${gf}|${AGES[age]}|${SECS[sec]}`;
    G[gk] = G[gk] || {};
    items.forEach((x) => {
      if (!x.b) return;
      const B = (G[gk][x.b] = G[gk][x.b] || { b: x.b, score: 0, items: {} });
      B.score += 101 - x.r;
      if (!x.so) { if (!B.items[x.id] || B.items[x.id].r > x.r) B.items[x.id] = x; }
      if (!x.so) { const P = (POOL[gf][x.b] = POOL[gf][x.b] || {}); if (!P[x.id] || P[x.id].r > x.r) P[x.id] = x; }
    });
  }
  const groups = [];
  // 무신사 스탠다드(우먼)는 캐주얼·포멀에만, 5위 아래로 한 번만 (기본빵만 가득 차지 않게)
  const isStd = (b) => /^무신사 스탠다드/.test(b);
  for (const [gk, brands] of Object.entries(G)) {
    const [gf, , sty] = gk.split("|");
    let ranked = Object.values(brands).sort((a, b) => b.score - a.score);
    const std = ranked.filter((B) => isStd(B.b));
    ranked = ranked.filter((B) => !isStd(B.b)).slice(0, 10);
    if ((sty === "캐주얼" || sty === "포멀") && std.length) { ranked.splice(4, 0, std[0]); ranked = ranked.slice(0, 10); }
    const top = ranked.map((B) => {
      const own = Object.values(B.items).sort((a, b) => a.r - b.r);
      const extra = Object.values(POOL[gf][B.b] || {}).filter((x) => !B.items[x.id]).sort((a, b) => a.r - b.r);
      return { b: B.b, items: [...own, ...extra].slice(0, 10) };
    });
    groups.push({ key: gk, brands: top });
  }

  const info = {};
  const fetchInfo = async (ids) => {
    for (let i = 0; i < ids.length; i += 30) {
      try {
        const j = await (await fetch("https://content.musinsa.com/api2/content/magazine-misc/v1/goods?saleStates=SALE,SOLD_OUT&goodsIds=" + ids.slice(i, i + 30).join(",") + "&sort=RANK&tabId=default&gf=A", { credentials: "include" })).json();
        ((j.data && (j.data.list || j.data.goods)) || []).forEach((g) => (info[String(g.goodsNo)] = g));
      } catch (e) {}
    }
  };

  // 🔥 HOT 브랜드 (주인장 선정 · 순위 없음) — 무신사 검색으로 브랜드별 후기 많은 상품
  const HOT = {
    "10대": ["9999아카이브", "노드", "다이브인", "이알티알", "밈더워드로브", "기철", "루저스클럽", "디스이즈네버댓", "마하그리드", "코드그라피", "굿라이프웍스", "999휴머니티", "엘엠씨", "크리틱", "스컬프터", "이미스", "커버낫", "에이이에이이", "매스노운", "우알롱", "슬로우애시드"],
    "20대": ["르아브", "기철", "다이브인", "노드", "미세키서울 맨", "이알티알", "밈더워드로브", "9999아카이브", "로맨틱무브", "루저스클럽", "낫포너드", "아웃스탠딩", "해칭룸", "세터", "노이어", "인사일런스", "비슬로우", "우알롱", "유니폼브릿지", "위캔더스", "노매뉴얼", "디스이즈네버댓", "슬로우애시드", "파르티멘토", "999휴머니티", "프리즘웍스", "에스에스알엘", "엑스톤즈", "매스노운"],
    "30대": ["쿠어", "포터리", "앤더슨벨", "브라운야드", "모이프", "어나더 오피스", "던스트", "에스피오나지", "폴로 랄프 로렌", "인사일런스", "해칭룸", "아웃스탠딩", "노이어", "비슬로우", "오디너리피플", "유스", "이스트로그", "브룩스 브라더스", "라코스테", "아크테릭스", "파타고니아", "살로몬", "프리즘웍스", "미세키서울 맨", "로맨틱무브"],
  };
  // 30대: 단가 있는 브랜드 위주 (블런드스톤·어그·텍스 제외, 스타일별 고단가 브랜드 앞에)
  const EX30 = /^(블런드스톤|어그|텍스)$/;
  const FILL30 = { "캐주얼": ["쿠어", "포터리", "모이프"], "스트릿": ["던스트", "아웃스탠딩", "해칭룸"], "포멀": ["앤더슨벨", "브라운야드", "어나더 오피스"], "핀터": ["폴로 랄프 로렌", "비슬로우", "노이어"] };
  const SB = {};
  const searchBrand = async (name) => {
    try {
      const h = await (await fetch("https://www.musinsa.com/search/goods?keyword=" + encodeURIComponent(name) + "&gf=M")).text();
      const d = new DOMParser().parseFromString(h, "text/html");
      const ids = [...new Set([...d.querySelectorAll("a[data-item-id]")].map((a) => a.getAttribute("data-item-id")))].slice(0, 60);
      await fetchInfo(ids.filter((id) => !info[id]));
      const g = ids.map((id) => info[id]).filter((x) => x && x.brandName === name && !x.isSoldOut && x.genderCode !== "WOMEN").sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
      SB[name] = g.slice(0, 12).map((x) => ({ id: String(x.goodsNo), img: x.thumbnail, b: name, n: x.goodsName }));
    } catch (e) { SB[name] = []; }
  };
  const allHot = [...new Set([].concat(...Object.values(HOT), ...Object.values(FILL30)))];
  for (let i = 0; i < allHot.length; i += 6) await Promise.all(allHot.slice(i, i + 6).map(searchBrand));
  groups.forEach((g) => {
    const [, age, sty] = g.key.split("|");
    if (age !== "30대") return;
    const fill = (FILL30[sty] || []).filter((b) => (SB[b] || []).length >= 4 && !g.brands.some((B) => B.b === b)).map((b) => ({ b, items: SB[b] }));
    g.brands = [...fill, ...g.brands.filter((B) => !EX30.test(B.b))].slice(0, 10);
  });
  for (const [age, list] of Object.entries(HOT)) {
    const brands = list.filter((b) => (SB[b] || []).length >= 4).map((b) => ({ b, items: SB[b] }));
    if (brands.length) groups.push({ key: `M|${age}|HOT`, brands });
  }

  // 후기 확인 (후기 점수 85점 미만 & 후기 5개 이상인 상품은 뒤로, 상품당 최대 12개)
  const allIds = [...new Set([].concat(...groups.map((g) => [].concat(...g.brands.map((b) => b.items.map((x) => x.id))))))].filter((id) => !info[id]);
  await fetchInfo(allIds);
  groups.forEach((g) => g.brands.forEach((B) => {
    const ok = (x) => { const f = info[x.id]; return !f || !f.isSoldOut; };
    const good = (x) => { const f = info[x.id]; return !f || f.reviewCount < 5 || f.reviewScore >= 85; };
    B.items = [...B.items.filter((x) => ok(x) && good(x)), ...B.items.filter((x) => ok(x) && !good(x))].slice(0, 12);
  }));

  // 큐레이터 링크 (localStorage 캐시)
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem("mdcpLinks") || "{}"); } catch (e) {}
  const need = [...new Set([].concat(...groups.map((g) => [].concat(...g.brands.map((b) => b.items.map((x) => x.id))))))].filter((id) => !cache[id]);
  for (let i = 0; i < need.length; i += 20) {
    await Promise.all(need.slice(i, i + 20).map(async (id) => {
      try {
        const l = await (await fetch("https://api.one.musinsa.com/api2/affiliate/v2/link/product/" + id, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json", "X-Platform": "MUSINSA" }, body: "{}", credentials: "include" })).json();
        if (l.data && l.data.link) cache[id] = l.data.link.replace("https://www.musinsa.com/curator/goods/", "");
      } catch (e) {}
    }));
  }
  try { localStorage.setItem("mdcpLinks", JSON.stringify(cache)); } catch (e) {}

  const out = groups.map((g) => ({
    key: g.key,
    brands: g.brands.map((B) => ({
      b: B.b,
      items: B.items.filter((x) => cache[x.id]).map((x) => {
        const f = info[x.id] || {};
        return { i: String(x.img || f.thumbnail || "").replace("https://image.msscdn.net", ""), l: cache[x.id], n: x.n || f.goodsName, s: f.price || null, r: f.saleRate || null, rv: f.reviewCount || null };
      }),
    })).filter((B) => B.items.length >= 2),
  }));
  window.__brData = JSON.stringify({ at: new Date().toISOString(), groups: out });
  let btn = document.getElementById("__cpb");
  if (!btn) { btn = document.createElement("button"); btn.id = "__cpb"; btn.style.cssText = "position:fixed;top:10px;left:10px;z-index:999999;padding:20px;font-size:20px;background:#ff0"; document.body.appendChild(btn); }
  btn.textContent = "COPY " + out.length;
  btn.onclick = async () => { try { await navigator.clipboard.writeText(window.__brData); btn.textContent = "OK " + window.__brData.length; } catch (e) { btn.textContent = "FAIL " + e.message; } };
  window.scrollTo(0, 0);
  return out.length;
})();
