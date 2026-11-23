// 단톡방·보고용 상품 사진 1장 만들기 (무신사 탭에서 실행 → 화면 캡처)
// 사용: window.__sheet(items, "제목")  — items: [{brand,name,img,rate,sale}] 최대 12개(6×2)
// 닫기: window.__sheetClose()
window.__sheet = (arr, title, tag) => {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let d = document.getElementById("__sh");
  if (!d) { d = document.createElement("div"); d.id = "__sh"; document.body.appendChild(d); }
  d.style.cssText = 'position:fixed;inset:0;z-index:9999999;background:#fff;padding:14px 18px;font-family:-apple-system,"Apple SD Gothic Neo",sans-serif;overflow:hidden';
  d.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b style="font-size:22px;letter-spacing:-.5px">' + esc(title) + '</b><span style="font-size:13px;font-weight:800;color:#fff;background:#ff3d3f;padding:4px 10px;border-radius:20px">' + esc(tag || "무진장 블프 · 광만두") + '</span></div>'
    + '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px 8px">'
    + (arr || []).slice(0, 12).map((p) => {
      const rate = Number(p.rate) || 0; const sale = Number(p.sale) || 0; const cpn = Number(p.cpn) || 0;
      return '<div><div style="position:relative;aspect-ratio:4/5;background:#f3f2ef;overflow:hidden"><img src="' + esc(p.img) + '" style="width:100%;height:100%;object-fit:cover">'
        + (rate ? '<span style="position:absolute;right:5px;top:5px;background:#ff3d3f;color:#fff;font-size:12px;font-weight:900;padding:2px 6px;border-radius:5px">-' + rate + '%</span>' : '') + '</div>'
        + '<p style="margin:5px 0 0;font-size:11.5px;font-weight:800">' + esc(p.brand) + '</p>'
        + '<p style="margin:2px 0 0;font-size:11px;color:#5a554e;height:28px;overflow:hidden;line-height:1.25">' + esc(p.name) + '</p>'
        + '<p style="margin:3px 0 0;font-size:14px;font-weight:900">' + (rate ? '<span style="color:#ff3d3f">' + rate + '%</span> ' : '') + sale.toLocaleString("ko-KR") + '원</p>'
        + (cpn && cpn < sale ? '<p style="margin:2px 0 0;display:inline-block;font-size:11px;font-weight:800;background:#e9ff70;padding:1px 5px;border-radius:4px">쿠폰가 ' + cpn.toLocaleString("ko-KR") + '원</p>' : '')
        + '</div>';
    }).join("") + '</div>';
};
window.__sheetClose = () => { const d = document.getElementById("__sh"); if (d) d.remove(); };
