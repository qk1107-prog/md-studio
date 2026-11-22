// 상품번호 목록 → 사이트용 상품(큐레이터 링크·가격·쿠폰가·후기) 한 번에. 무신사 탭(로그인)에서 실행
// await window.__gp(["123", ...], {sort:true}) → [{i,brand,name,img,link,price,sale,cpn,rate,rv,mj}]
// window.__pageIds(root) → 화면(또는 같은 출처 iframe)에 보이는 상품번호를 순서대로
window.__pageIds = (root) => {
  root = root || document;
  const ids = [];
  const take = (doc) => {
    doc.querySelectorAll('a[href*="/products/"], a[href*="/goods/"], [data-item-id], [data-goods-no]').forEach((a) => {
      const m = String(a.getAttribute("href") || "").match(/(?:products|goods)\/(\d{6,8})/) || [null, a.dataset && (a.dataset.itemId || a.dataset.goodsNo)];
      if (m && m[1] && !ids.includes(String(m[1]))) ids.push(String(m[1]));
    });
    doc.querySelectorAll("iframe").forEach((f) => { try { if (f.contentDocument) take(f.contentDocument); } catch (e) {} });
  };
  take(root);
  return ids;
};
window.__gp = async (ids, opt) => {
  opt = opt || {};
  const EX = /여성|우먼|WOMEN|키즈|KIDS|아동|주니어/i;
  const cache = JSON.parse(localStorage.getItem("mdcpLinks") || "{}");
  const q = [...new Set(ids.map(String))]; const order = q.slice(); const det = {};
  await Promise.all([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(async () => {
    while (q.length) {
      const id = q.shift();
      try {
        const d = (await (await fetch("https://goods-detail.musinsa.com/api2/goods/" + id, { credentials: "include" })).json()).data;
        if (!d || d.isOutOfStock) continue;
        const gp = d.goodsPrice || {}; const nor = gp.normalPrice || 0, sale = gp.salePrice || nor, cpn = gp.couponPrice && gp.couponPrice < sale ? gp.couponPrice : 0;
        const name = d.goodsNm || ""; if (!opt.women && EX.test(name)) continue;
        const fin = cpn || sale;
        det[id] = { i: id, brand: (d.brandInfo && d.brandInfo.brandName) || "", name, img: "https://image.msscdn.net" + String(d.thumbnailImageUrl || "").replace(/_\d{3}\.(jpg|png|webp)$/i, "_500.$1"), price: nor, sale, cpn, rate: nor ? Math.round((1 - fin / nor) * 100) : 0, rv: (d.goodsReview && d.goodsReview.totalCount) || 0, mj: /무진장/.test(JSON.stringify(d.labels || "")) ? 1 : 0 };
        if (!cache[id]) {
          const l = await (await fetch("https://api.one.musinsa.com/api2/affiliate/v2/link/product/" + id, { method: "POST", credentials: "include", headers: { Accept: "application/json", "Content-Type": "application/json", "X-Platform": "MUSINSA" }, body: "{}" })).json();
          const m = String((l.data && l.data.link) || "").match(/^https:\/\/www\.musinsa\.com\/curator\/goods\/([A-Za-z0-9]+)$/);
          if (m) cache[id] = m[1];
        }
      } catch (e) {}
    }
  }));
  localStorage.setItem("mdcpLinks", JSON.stringify(cache));
  let out = order.map((id) => det[id]).filter((x) => x && cache[x.i]).map((x) => Object.assign(x, { link: "https://www.musinsa.com/curator/goods/" + cache[x.i] }));
  if (opt.sort) { const r = {}; order.forEach((id, k) => (r[id] = k)); const sc = (x) => Math.max(0, 40 - r[x.i] * 0.3) + x.rate * 0.7 + Math.log10(x.rv + 10) * 8 + (x.cpn ? 8 : 0); out.sort((a, b) => sc(b) - sc(a)); }
  if (opt.noAdj) { const a = []; while (out.length) { const j = out.findIndex((x) => !a.length || x.brand !== a[a.length - 1].brand); a.push(out.splice(j < 0 ? 0 : j, 1)[0]); } out = a; }
  return opt.n ? out.slice(0, opt.n) : out;
};
