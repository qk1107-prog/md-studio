// 무신사 쿠폰함 → MD STUDIO "지금 쓰기 좋은 쿠폰" 수집기
// 무신사 탭(www.musinsa.com, 로그인 상태)에서 실행. 결과 JSON은 window.__cpData 에 담기고, 노란 COPY 버튼으로 복사.
window.__cpRun = async () => {
  const EX = /깜짝|생일|정기|베네피아|큐레이터|등급|웰컴|신규|가입|첫 ?구매|앱 ?전용|임직원|제휴|카드|(?<!노스)페이|뷰티|키즈|아동|우먼|여성|라이프|홈|반려|골프|예약 ?배송|재구매|리뷰|VIP|매일 새로운 추천|화이트|좋은느낌|글램팜|셀렉스|생리|화장|스킨|향수|쿠션/i;
  const won = (n) => n >= 10000 && n % 10000 === 0 ? n / 10000 + "만원" : n >= 1000 && n % 1000 === 0 ? n / 1000 + "천원" : Number(n).toLocaleString() + "원";
  const all = [];
  let cp = 0, pp = 0, cm = true, pm = true;
  for (let i = 0; i < 150 && (cm || pm); i++) {
    const j = await (await fetch(`https://api.musinsa.com/api/coupon/coupon-box/v1/coupons?sort=POPULARITY&cartPage=${cm ? cp : 999}&productPage=${pm ? pp : 999}&size=50`, { credentials: "include" })).json();
    const d = j.data;
    if (cm) { (d.cartCoupons.items || []).forEach((x) => all.push(x)); cm = d.cartCoupons.hasNext; cp++; }
    if (pm) { (d.productCoupons.items || []).forEach((x) => all.push(x)); pm = d.productCoupons.hasNext; pp++; }
  }
  // 무진장(블프) 쿠폰은 맨 앞으로
  const bfNo = new Set();
  try {
    let bc = 0, bp = 0, bcm = true, bpm = true;
    for (let i = 0; i < 60 && (bcm || bpm); i++) {
      const j = await (await fetch(`https://api.musinsa.com/api/coupon/coupon-box/v1/coupons?sort=POPULARITY&cartPage=${bcm ? bc : 999}&productPage=${bpm ? bp : 999}&size=50&attributes=MUJINJANG`, { credentials: "include" })).json();
      const d = j.data;
      if (bcm) { (d.cartCoupons.items || []).forEach((x) => bfNo.add(x.couponNo)); bcm = d.cartCoupons.hasNext; bc++; }
      if (bpm) { (d.productCoupons.items || []).forEach((x) => bfNo.add(x.couponNo)); bpm = d.productCoupons.hasNext; bp++; }
    }
  } catch (e) {}
  // 유명 브랜드 쿠폰(노스페이스·아디다스 등)은 개수 제한에 걸려 빠지지 않게 맨 앞으로
  const FAM = /노스페이스|아디다스|나이키|뉴발란스|어그|살로몬|아크테릭스|푸마|컨버스|반스|닥터마틴|파타고니아|디스커버리|내셔널지오그래픽|컬럼비아|코오롱|아이더|케이투|리바이스|폴로|라코스테|챔피온|커버낫|스파오|무신사 스탠다드|칼하트|디키즈|스투시|아식스|미즈노|오니츠카|팀버랜드|크록스|잔스포츠|이스트팩|캉골|엠엘비|후아유|지오다노|탑텐|에잇세컨즈|마인드브릿지|드로우핏|수아레|토피|쿠어|인사일런스|예일|마리떼|마뗑킴|디스이즈네버댓|노매뉴얼|락피쉬|몽벨|네파|블랙야크|스노우피크|데상트|르꼬끄|휠라|리복|언더아머|유니클로|자라|캘빈클라인|타미|게스|랭글러/;
  const T_OPEN_MS = new Date("2026-11-22T19:00:00+09:00").getTime();
  // 티징 쿠폰(프리오픈 이름 또는 본편 오픈 시각에 끝나는 쿠폰) 중 많이 받아간 것(1천 장 이상)도 앞으로
  const tzLike = (x) => /프리오픈|티징/.test(x.couponName) || Math.abs(new Date(x.expireDateTime).getTime() - T_OPEN_MS) < 6e4;
  const pri = (x) => (FAM.test(x.couponName) && !EX.test(x.couponName) ? 4 : 0) + (tzLike(x) && (x.totalIssuedCount || 0) >= 1000 ? 2 : 0) + (bfNo.has(x.couponNo) ? 1 : 0);
  all.sort((a, b) => pri(b) - pri(a) || (tzLike(b) ? b.totalIssuedCount || 0 : 0) - (tzLike(a) ? a.totalIssuedCount || 0 : 0));
  const seen = new Set(), pick = [];
  for (const x of all) {
    if (x.couponChannel !== "ONLINE" || EX.test(x.couponName) || new Date(x.expireDateTime) < new Date()) continue;
    const k = x.couponName.replace(/\s+/g, " ").trim();
    if (seen.has(k)) continue;
    seen.add(k); pick.push(x);
    if (pick.length >= 340) break;
  }
  const res = [];
  for (let i = 0; i < pick.length; i += 10) {
    await Promise.all(pick.slice(i, i + 10).map(async (c) => {
      try {
        const j = await (await fetch(`https://api.musinsa.com/api2/coupon/plp/v1/goods?gf=M&sortCode=SALE_ONE_WEEK_COUNT&couponNo=${c.couponNo}&couponKind=${c.couponKind}&size=14&caller=COUPON&page=1`, { credentials: "include" })).json();
        const raw = (j.data && (j.data.list || j.data.goods)) || [];
        const L = raw.filter((g) => !g.isSoldOut && g.genderCode !== "WOMEN");
        const tot = (j.data && j.data.pagination && j.data.pagination.totalCount) || L.length;
        const isTz = /티징|티저|TEAS/i.test(c.couponName) || bfNo.has(c.couponNo);
        if (L.length >= 3 || (isTz && L.length >= 1)) res.push({ c, tot, goods: L.slice(0, 5) });
      } catch (e) {}
    }));
  }
  res.sort((a, b) => pick.indexOf(a.c) - pick.indexOf(b.c));
  const top = res.slice(0, 250);
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem("mdcpLinks") || "{}"); } catch (e) {}
  // 큐레이터 링크(코드)만 인정: 일반 상품 주소가 섞여 있으면 지우고 다시 받기
  for (const k of Object.keys(cache)) if (!/^[A-Za-z0-9]{4,12}$/.test(String(cache[k]))) delete cache[k];
  const ids = [...new Set([].concat(...top.map((r) => r.goods.map((g) => String(g.goodsNo)))))].filter((id) => !cache[id]);
  for (let i = 0; i < ids.length; i += 20) {
    await Promise.all(ids.slice(i, i + 20).map(async (id) => {
      try {
        const l = await (await fetch("https://api.one.musinsa.com/api2/affiliate/v2/link/product/" + id, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json", "X-Platform": "MUSINSA" }, body: "{}", credentials: "include" })).json();
        if (l.data && l.data.link && /^https:\/\/www\.musinsa\.com\/curator\/goods\/[A-Za-z0-9]+$/.test(l.data.link)) cache[id] = l.data.link.replace("https://www.musinsa.com/curator/goods/", "");
      } catch (e) {}
    }));
  }
  try { localStorage.setItem("mdcpLinks", JSON.stringify(cache)); } catch (e) {}
  const list = top.map((r) => {
    const c = r.c;
    const v = c.discountType === "PERCENT" ? c.discountValue + "%" : won(c.discountValue);
    const cond = [c.minOrderQuantity ? c.minOrderQuantity + "개 이상" : "", c.minOrderAmount ? won(c.minOrderAmount) + " 이상" : "", c.maxDiscountAmount && c.discountType === "PERCENT" ? "최대 " + won(c.maxDiscountAmount) : ""].filter(Boolean).join(" · ");
    const e = new Date(c.expireDateTime);
    return {
      no: c.couponNo, k: c.couponKind === "CART" ? "C" : "P", bf: bfNo.has(c.couponNo) ? 1 : 0,
      tz: /티징|티저|TEAS|프리오픈|프리 오픈|PRE-?OPEN/i.test(c.couponName) || (bfNo.has(c.couponNo) && e.getTime() <= new Date("2026-11-22T23:59:59+09:00").getTime()) || Math.abs(e.getTime() - T_OPEN_MS) < 6e4 ? 1 : 0, n: c.couponName.replace(/\s+/g, " ").trim(), v, cond, exp: e.getMonth() + 1 + "/" + e.getDate(), cnt: r.tot,
      g: r.goods.filter((g) => cache[String(g.goodsNo)]).map((g) => ({ i: String(g.thumbnail).replace("https://image.msscdn.net", ""), l: cache[String(g.goodsNo)], n: g.goodsName, b: g.brandName, s: g.price, r: g.saleRate })),
    };
  }).filter((x) => x.g.length >= 3 || ((x.tz || x.bf) && x.g.length >= 1));
  // 이전 저장본과 비교해서 처음 본 쿠폰(24시간 안) = NEW
  let prev = null;
  try {
    const pr = await (await fetch("https://cbuydjkvvzbluyohdkie.supabase.co/rest/v1/site_data?id=eq.coupons&select=value", { headers: { apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNidXlkamt2dnpibHV5b2hka2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MjYxMDIsImV4cCI6MjEwNTIwMjEwMn0.dYpj7w5zpyrWeF4YgQ19U6rN3x0pxZwVo8QNiosV4KI", Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNidXlkamt2dnpibHV5b2hka2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MjYxMDIsImV4cCI6MjEwNTIwMjEwMn0.dYpj7w5zpyrWeF4YgQ19U6rN3x0pxZwVo8QNiosV4KI" } })).json();
    prev = pr && pr[0] && pr[0].value;
  } catch (e) {}
  const now = new Date().toISOString();
  const seenMap = Object.assign({}, (prev && prev.seen) || {});
  list.forEach((c) => { if (!seenMap[c.no]) seenMap[c.no] = now; c.nw = (Date.now() - new Date(seenMap[c.no]).getTime() < 864e5) && prev ? 1 : 0; });
  const keep = new Set(list.map((c) => String(c.no)));
  Object.keys(seenMap).forEach((k) => { if (!keep.has(k) && Date.now() - new Date(seenMap[k]).getTime() > 7 * 864e5) delete seenMap[k]; });
  window.__cpData = JSON.stringify({ at: now, list, seen: seenMap, on: !!(prev && prev.on) });
  let btn = document.getElementById("__cpb");
  if (!btn) { btn = document.createElement("button"); btn.id = "__cpb"; btn.style.cssText = "position:fixed;top:10px;left:10px;z-index:999999;padding:20px;font-size:20px;background:#ff0"; document.body.appendChild(btn); }
  btn.textContent = "COPY " + list.length;
  btn.onclick = async () => { try { await navigator.clipboard.writeText(window.__cpData); btn.textContent = "OK " + window.__cpData.length; } catch (e) { btn.textContent = "FAIL " + e.message; } };
  window.scrollTo(0, 0);
  // 빠른 모드: window.__cpLoop = 분(예: 5) 이면, 관리자 창에 바로 보내 저장하고 N분마다 다시 돌아요
  if (window.__cpLoop) {
    try {
      if (!window.__cpAdmin || window.__cpAdmin.closed) {
        // 팝업은 클릭으로만 열 수 있어서, 버튼을 한 번 눌러야 시작돼요
        btn.textContent = "▶ LIVE 시작 (클릭)";
        btn.onclick = () => { window.__cpAdmin = window.open("https://md-studio-lovat.vercel.app/admin.html#cpsink", "mdcpsink"); btn.textContent = "LIVE 준비 중…"; setTimeout(() => window.__cpRun(), 7000); };
        return list.length;
      }
      window.__cpAdmin.postMessage({ type: "mdcp", data: window.__cpData }, "https://md-studio-lovat.vercel.app");
      window.__cpLast = new Date().toLocaleTimeString();
      btn.textContent = "LIVE " + list.length + " · " + window.__cpLast;
    } catch (e) { btn.textContent = "LIVE 실패 " + e.message; }
    clearTimeout(window.__cpTimer);
    window.__cpTimer = setTimeout(() => window.__cpRun(), Math.max(2, Number(window.__cpLoop)) * 60000);
  }
  return list.length;
};
window.__cpRun();
