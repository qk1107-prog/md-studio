// 방문자용 데이터 캐시: 수파베이스 site_data 를 Vercel CDN 에서 1분간 캐시해서 내려줌
// (방문자가 몇천 명이어도 수파베이스는 1분에 몇 번만 읽힘 → 전송량 절약)
const SB = "https://cbuydjkvvzbluyohdkie.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNidXlkamt2dnpibHV5b2hka2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MjYxMDIsImV4cCI6MjEwNTIwMjEwMn0.dYpj7w5zpyrWeF4YgQ19U6rN3x0pxZwVo8QNiosV4KI";
const OK = { main: 1, coupons: 1, brands: 1, catrank: 1, packs: 1, episodes: 1, cpg: 1 };
// 같은 서버 인스턴스 안에서 마지막으로 성공한 데이터를 기억 → 수파베이스가 느리거나 죽어도 그걸로 응답
const LAST = {};
const zlib = require("zlib");
// 방문자에게 필요 없는 큰 값은 빼고 보냄 (전송량 절약)
function slim(id, out) {
  // 쿠폰: 전체 상품 목록(gx)은 쿠폰을 열 때만 따로(cpg) 보내고, 첫 화면용엔 빼기
  if (id === "coupons" && out && out.gx) { const o = Object.assign({}, out); delete o.gx; return o; }
  if (id === "cpg") return (out && out.gx) || {};
  if (id !== "main" || !out || !out.bf) return out;
  const bf = Object.assign({}, out.bf);
  delete bf.sigPreview5;
  if (bf.days) {
    const k = new Date(Date.now() + 9 * 36e5); const pad = (n) => String(n).padStart(2, "0");
    const today = k.getUTCFullYear() + "-" + pad(k.getUTCMonth() + 1) + "-" + pad(k.getUTCDate());
    const keys = Object.keys(bf.days).filter((d) => d <= today).sort().slice(-1);
    const d = {}; keys.forEach((x) => { d[x] = bf.days[x]; }); Object.keys(bf.days).filter((x) => x > today).forEach((x) => { d[x] = bf.days[x]; });
    // 브랜드데이는 화면에 브랜드당 12개까지만 보여서 그만큼만
    Object.keys(d).forEach((x) => { if (d[x] && Array.isArray(d[x].brands)) d[x] = Object.assign({}, d[x], { brands: d[x].brands.map((b) => Object.assign({}, b, { items: (b.items || []).slice(0, 12) })) }); });
    bf.days = d;
  }
  // 본편 오픈 뒤엔 티징 칸이 안 보여서 브랜드 할인율(brands)만 남김
  if (bf.teaser && Date.now() >= Date.parse("2026-11-22T10:00:00Z")) bf.teaser = { brands: bf.teaser.brands || [] };
  return Object.assign({}, out, { bf });
}
module.exports = async function handler(req, res) {
  const id = String((req.query && req.query.id) || "main");
  if (!OK[id]) { res.statusCode = 400; return res.end("bad id"); }
  try {
    const url = id === "episodes"
      ? SB + "/rest/v1/episodes?select=id,title,series,upload_date,reel_url,thumbnail_url,pick_comment,created_at&order=upload_date.desc,created_at.desc&limit=300"
      : SB + "/rest/v1/site_data?id=eq." + (id === "cpg" ? "coupons" : id) + "&select=value";
    const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 25000);
    const r = await fetch(url, { headers: { apikey: KEY, Authorization: "Bearer " + KEY }, signal: ac.signal }); clearTimeout(tm);
    if (!r.ok) throw new Error("sb " + r.status);
    const j = await r.json();
    const out = id === "episodes" ? j : (j[0] ? j[0].value : null);
    if (out == null) throw new Error("empty");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=120, stale-while-revalidate=600, stale-if-error=86400");
    res.statusCode = 200;
    const body = JSON.stringify(slim(id, out)).split(SB + "/storage/v1/object/public/").join("https://" + (req.headers.host || "md-studio-lovat.vercel.app") + "/api/img?p=");
    LAST[id] = body;
    return send(req, res, body);
    res.end(JSON.stringify(out).split(SB + "/storage/v1/object/public/").join("https://" + (req.headers.host || "md-studio-lovat.vercel.app") + "/api/img?p="));
  } catch (e) {
    if (LAST[id]) { res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=600"); res.statusCode = 200; return send(req, res, LAST[id]); }
    res.setHeader("Cache-Control", "no-store");
    res.statusCode = 502;
    res.end("err");
  }
};

// gzip 으로 압축해서 보냄 (JSON 은 10분의 1 정도로 줄어요)
function send(req, res, body) {
  res.setHeader("Vary", "Accept-Encoding");
  if (/\bgzip\b/.test(String(req.headers["accept-encoding"] || ""))) {
    res.setHeader("Content-Encoding", "gzip");
    return res.end(zlib.gzipSync(body, { level: 6 }));
  }
  return res.end(body);
}
module.exports.config = { maxDuration: 30 };
