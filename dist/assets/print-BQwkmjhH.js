import{o as a,c as n,F as f,m as _,x as u,a as l,t as c,j as x,D as m}from"./index-i3QgkgYy.js";import{b as h}from"./format-B_ONP67t.js";const y={class:"seg-list"},v={class:"s"},$={key:0,class:"t"},S={key:1,class:"t"},N={key:0,class:"empty"},z={__name:"SegmentList",props:{segments:{type:Array,default:()=>[]}},setup(t){return(g,s)=>(a(),n("div",y,[(a(!0),n(f,null,_(t.segments,e=>(a(),n("div",{key:e.id||e.seq,class:u(["seg",{failed:e.is_failed}])},[l("p",v,c(e.source_text),1),e.is_failed?(a(),n("p",$,[...s[0]||(s[0]=[l("span",{class:"flag"},"⚠ 翻译失败 · 保留原文",-1)])])):(a(),n("p",S,c(e.translated_text),1))],2))),128)),t.segments.length?x("",!0):(a(),n("div",N,[...s[1]||(s[1]=[l("div",{class:"ic"},"📄",-1),l("p",null,"暂无段落内容",-1)])]))]))}},r=(t="")=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");function B(t){const s=(t.segments||[]).map(o=>{const p=`<p class="s">${r(o.source_text)}</p>`,d=o.is_failed?'<p class="f">⚠ 翻译失败，保留原文</p>':`<p class="t">${r(o.translated_text)}</p>`;return`<div class="seg">${p}${d}</div>`}).join(""),e=`<!doctype html><html lang="zh"><head><meta charset="utf-8">
<title>${r(h(t.title))} 双语对照版</title>
<style>
  body{font-family:"Songti SC","Noto Serif CJK SC",serif;line-height:1.85;margin:34px 44px;color:#111}
  h1{font-size:20px;text-align:center;margin:0 0 4px}
  .meta{text-align:center;color:#666;font-size:12px;margin-bottom:22px}
  .seg{margin-bottom:12px;page-break-inside:avoid}
  .s{margin:0}
  .t{margin:0 0 6px;color:#1e40af}
  .f{margin:0 0 6px;color:#92400e}
</style></head><body>
<h1>${r(t.title)}</h1>
<div class="meta">${m[t.source_lang]||t.source_lang} → ${m[t.target_lang]||t.target_lang} · 由双语书工厂生成</div>
${s}
</body></html>`,i=window.open("","_blank");return i?(i.document.write(e),i.document.close(),i.focus(),setTimeout(()=>i.print(),350),!0):!1}export{z as _,B as p};
