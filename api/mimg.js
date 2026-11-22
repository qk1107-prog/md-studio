// 무신사 상품 이미지를 같은 주소로 내려줌 (캐러셀 이미지 저장 때 캔버스가 막히지 않게)
module.exports = async function handler(req, res) {
  const u = String((req.query && req.query.u) || "");
  if (!/^https:\/\/image\.msscdn\.net\/[A-Za-z0-9_\-./%]+$/.test(u) || u.includes("..")) { res.statusCode = 400; return res.end("bad"); }
  try {
    const r = await fetch(u, { headers: { Referer: "https://www.musinsa.com/" } });
    if (!r.ok) throw new Error(String(r.status));
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", r.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");
    res.statusCode = 200;
    res.end(buf);
  } catch (e) {
    res.statusCode = 302; res.setHeader("Location", u); res.setHeader("Cache-Control", "no-store"); res.end();
  }
};
