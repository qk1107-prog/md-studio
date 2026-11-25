(() => {
const HYPE = /노드랩스|9999아카이브|아캄|디미트리블랙|낫포너드|노이즈|도프제이슨|어나더 ?오피스|르아르|어널러코드|다이브인|오퍼스|이안아카이브|파타고니아|살로몬|아크테릭스|미세키|해칭룸|인더스트|비긴202|키뮤어|록히드마틴|낫온리포투데이|디스이즈네버댓|프리즘웍스|레테르코모|언지미크|유니폼브릿지|쿠어|닥터마틴|나이키|뉴발란스|노스페이스|포터리|파브레가|데꼬로소|엘리엇|브라운야드|인사일런스|아워레가시|스톤아일랜드/;
const BAN = /엘칸토|식스핏|반스|지프|스칼렛또블랙/;
const base = (n) => String(n).replace(/\[[^\]]*\]|\([^)]*\)|_[^_]*$|-\s*[^-]*$|\d+\s*COLOR|\d+col/gi, '').replace(/\s+/g, ' ').trim().slice(0, 18);
const q = (arr, f) => arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * f))].fp : 0;
window.__pick = function () {
  const out = {};
  for (const g of window.__G) {
    const [id, , , , , , max, opt] = g; const o = opt || {};
    const det = window.__det;
    let c = (window.__cands[id] || []).map((x) => ({ ...x, d: det[x.p[0]] })).filter((x) => x.d && !x.d.bad && !x.d.so && x.d.fp > 0 && !BAN.test(x.p[1]));
    c.forEach((x) => { x.fp = x.d.fp; x.sc = x.s + (HYPE.test(x.p[1]) ? 1 : 0); });
    c.sort((a, b) => a.fp - b.fp);
    const usedB = new Set(), usedN = new Set();
    const ok = (x) => (o.brand ? true : !usedB.has(x.p[1])) && !usedN.has(base(x.p[2]));
    const take = (x) => { usedB.add(x.p[1]); usedN.add(base(x.p[2])); return x; };
    const best = (arr, tie) => arr.filter(ok).sort((a, b) => b.sc - a.sc || tie(a, b))[0];
    const cap = max || Infinity;
    const lo = c.filter((x) => x.fp <= Math.min(cap, Math.max(q(c, 0.35), c[0] ? c[0].fp : 0)));
    const ga = best(lo.length ? lo : c.filter((x) => x.fp <= cap), (a, b) => a.fp - b.fp); if (ga) take(ga);
    const hiCut = q(c, 0.7);
    const hi = c.filter((x) => x.fp >= hiCut && x.fp <= 800000 && (!ga || x.fp > ga.fp));
    const hiS = hi.map((x) => ({ ...x, sc: x.sc + (HYPE.test(x.p[1]) ? 2 : 0) }));
    const ot = best(hiS, (a, b) => b.fp - a.fp); if (ot) take(ot);
    const med = ga && ot ? (ga.fp + ot.fp) / 2 : q(c, 0.5);
    let mid = c.filter((x) => (!ga || x.fp >= ga.fp) && (!ot || x.fp <= ot.fp));
    if (max && mid.some((x) => x.fp <= cap && ok(x))) mid = mid.filter((x) => x.fp <= cap);
    const gs = best(mid, (a, b) => Math.abs(a.fp - med) - Math.abs(b.fp - med)); if (gs) take(gs);
    out[id] = [ga, gs, ot].map((x) => x && { id: x.p[0], b: x.p[1], n: x.p[2], l: x.p[3], img: x.p[4], fp: x.fp, np: x.d.np, sp: x.d.sp, brand: x.d.brand, comId: x.d.comId });
  }
  window.__picks = out; return out;
};
window.__coupons = async function () {
  const all = Object.values(window.__picks).flat().filter(Boolean);
  const seen = window.__cpc || (window.__cpc = {});
  for (let i = 0; i < all.length; i += 4) {
    await Promise.all(all.slice(i, i + 4).map(async (x) => {
      if (seen[x.id] == null) {
        try {
          const j = await fetch(`https://api.musinsa.com/api2/coupon/coupons/getUsableCouponsByGoodsNo?goodsNo=${x.id}&brand=${x.brand}&comId=${x.comId}&salePrice=${x.sp}`, { credentials: 'include' }).then((r) => r.json());
          const L = ((j.data && j.data.list) || []).filter((c) => !/큐레이터|생일|정기|등급|인스타그램|이달의/.test(c.couponName));
          seen[x.id] = Math.max(0, ...L.map((c) => c.salePrice || 0));
        } catch (e) { seen[x.id] = 0; }
      }
      x.cp = seen[x.id] ? x.sp - seen[x.id] : 0;
    }));
    await new Promise((r) => setTimeout(r, 400));
  }
  return all.length;
};
window.__review = function () {
  return window.__G.map((g) => g[0] + ' | ' + (window.__picks[g[0]] || []).map((x, i) => x ? ['가', '심', '옷'][i] + ':' + x.b + ' ' + String(x.n).slice(0, 22) + ' ' + Math.round((x.cp || x.fp) / 1000) + 'k' : ['가', '심', '옷'][i] + ':-').join(' / ')).join('\n');
};
})();
