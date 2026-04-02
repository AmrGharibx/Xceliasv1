$html = @'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <meta name="theme-color" content="#060612"/>
  <meta name="description" content="Xcelias Study Guide — Batch 31 Projects"/>
  <title>Xcelias — Study Guide</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"/>

  <style>
  /* ═══════════════ DESIGN TOKENS ═══════════════ */
  :root {
    --bg:      #060612;
    --bg2:     #0a0a1e;
    --surface: rgba(255,255,255,0.038);
    --glass:   rgba(8,8,22,0.78);
    --text:    #f0f0f9;
    --muted:   #9898c8;
    --dim:     #46466e;
    --accent:  #7c6ef5;
    --accent2: #c56cf0;
    --green:   #34d399;
    --gold:    #fbbf24;
    --red:     #f87171;
    --orange:  #fb923c;
    --blue:    #60a5fa;
    --border:  rgba(124,110,245,0.12);
    --border-h:rgba(124,110,245,0.40);
    --blur:    blur(24px) saturate(160%);
    --r:  20px;
    --r-sm:14px;
    --r-xs:10px;
    --font:   'Space Grotesk','Montserrat',-apple-system,sans-serif;
    --font-h: 'Montserrat',-apple-system,sans-serif;
    --grad:   linear-gradient(135deg,#7c6ef5 0%,#c56cf0 55%,#f093fb 100%);
    --glow:   0 0 40px rgba(124,110,245,0.28);
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth;font-size:16px}
  body{font-family:var(--font);background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased}
  button{font-family:var(--font);cursor:pointer;border:none;outline:none}
  button:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
  input{font-family:var(--font)}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(124,110,245,.35);border-radius:99px}

  /* ═══ CANVAS BG ═══ */
  #bg-canvas{position:fixed;inset:0;z-index:0;pointer-events:none}

  /* ═══ ORBS ═══ */
  .orb{position:fixed;border-radius:50%;filter:blur(110px);pointer-events:none;z-index:0;will-change:transform}
  .orb-1{width:650px;height:650px;top:-15%;left:-12%;background:radial-gradient(circle,rgba(124,110,245,.22) 0%,transparent 70%);animation:orbF 22s ease-in-out infinite}
  .orb-2{width:520px;height:520px;bottom:-10%;right:-8%;background:radial-gradient(circle,rgba(197,108,240,.18) 0%,transparent 70%);animation:orbF 28s ease-in-out infinite reverse}
  .orb-3{width:380px;height:380px;top:38%;left:48%;background:radial-gradient(circle,rgba(52,211,153,.10) 0%,transparent 70%);animation:orbF 18s ease-in-out infinite;animation-delay:-8s}
  @keyframes orbF{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(40px,-30px) scale(1.06)}66%{transform:translate(-25px,45px) scale(.96)}}

  /* ═══ TOPBAR ═══ */
  .topbar{position:sticky;top:0;z-index:100;backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);background:rgba(6,6,18,.92);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;padding:0 20px;height:64px}
  .topbar-logo{display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;flex-shrink:0}
  .logo-icon{width:36px;height:36px;background:var(--grad);border-radius:10px;display:flex;align-items:center;justify-content:center;font-family:var(--font-h);font-size:16px;font-weight:900;color:#fff;box-shadow:0 4px 18px rgba(124,110,245,.45);flex-shrink:0}
  .logo-word{font-family:var(--font-h);font-size:.82rem;font-weight:900;letter-spacing:.14em;text-transform:uppercase;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .topbar-sep{width:1px;height:20px;background:var(--border);flex-shrink:0}
  .topbar-mod{font-size:.72rem;font-weight:700;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .topbar-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
  .batch-pill{padding:4px 12px;border-radius:99px;background:rgba(124,110,245,.15);border:1px solid rgba(124,110,245,.3);font-size:.62rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--accent)}
  .user-chip{display:flex;align-items:center;gap:7px;padding:6px 14px;border-radius:99px;background:rgba(255,255,255,.05);border:1px solid var(--border);font-size:.71rem;font-weight:700;color:var(--muted);cursor:pointer;transition:all .2s}
  .user-chip:hover{background:rgba(255,255,255,.09);color:var(--text)}
  .chip-dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 8px rgba(52,211,153,.8);animation:pulse 2s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.8)}}

  /* ═══ SCREENS ═══ */
  .screen{display:none}
  .screen.active{display:block}

  /* ═══ BATCH SCREEN ═══ */
  #screen-batches{position:relative;z-index:1;max-width:860px;margin:0 auto;padding:48px 20px 100px}
  .hero{text-align:center;margin-bottom:48px;animation:fadeUp .8s cubic-bezier(.22,1,.36,1) both}
  .hero-eyebrow{display:inline-flex;align-items:center;gap:8px;padding:6px 18px;border-radius:99px;border:1px solid rgba(124,110,245,.25);background:rgba(124,110,245,.1);font-size:.62rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin-bottom:20px}
  .hero-title{font-family:var(--font-h);font-size:clamp(2.4rem,8vw,4.2rem);font-weight:900;line-height:1;letter-spacing:-.03em;background:linear-gradient(145deg,#fff 0%,#c8c0ff 40%,#f093fb 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:14px}
  .hero-sub{font-size:.94rem;color:var(--muted);line-height:1.65;max-width:460px;margin:0 auto 28px}
  .stats-strip{display:flex;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--r);backdrop-filter:var(--blur);overflow:hidden;margin-bottom:40px;animation:fadeUp .8s .1s cubic-bezier(.22,1,.36,1) both}
  .stat{flex:1;text-align:center;padding:20px 12px;position:relative}
  .stat+.stat::before{content:'';position:absolute;left:0;top:20%;bottom:20%;width:1px;background:var(--border)}
  .stat-n{display:block;font-family:var(--font-h);font-size:1.8rem;font-weight:900;line-height:1;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .stat-l{font-size:.58rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin-top:4px}

  /* Batch cards */
  .batch-grid{display:grid;gap:20px;grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr));animation:fadeUp .8s .18s cubic-bezier(.22,1,.36,1) both}
  .batch-card{position:relative;overflow:hidden;background:rgba(255,255,255,.033);border:1px solid var(--border);border-radius:var(--r);cursor:pointer;transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s,border-color .3s}
  .batch-card:hover{transform:translateY(-6px) scale(1.01);border-color:var(--border-h);box-shadow:0 24px 64px rgba(124,110,245,.22),0 0 0 1px rgba(124,110,245,.15)}
  .batch-card:active{transform:translateY(-1px) scale(1)}
  .bc-shimmer{position:absolute;inset:0;z-index:1;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.07) 50%,transparent 60%);transform:translateX(-120%);transition:transform .65s ease;pointer-events:none;border-radius:inherit}
  .batch-card:hover .bc-shimmer{transform:translateX(120%)}
  .bc-inner{padding:26px;position:relative;z-index:2}
  .bc-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px}
  .bc-icon{width:52px;height:52px;flex-shrink:0;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:24px;background:linear-gradient(135deg,rgba(124,110,245,.2),rgba(197,108,240,.15));border:1px solid rgba(124,110,245,.25);box-shadow:0 4px 20px rgba(124,110,245,.2)}
  .bc-badge-ok{padding:5px 12px;border-radius:99px;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.28);font-size:.58rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--green);animation:bPulse 3s ease-in-out infinite}
  @keyframes bPulse{0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0)}50%{box-shadow:0 0 0 5px rgba(52,211,153,.12)}}
  .bc-badge-lock{padding:5px 12px;border-radius:99px;background:rgba(148,148,184,.08);border:1px solid rgba(148,148,184,.15);font-size:.58rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
  .bc-title{font-family:var(--font-h);font-size:1.4rem;font-weight:900;letter-spacing:-.01em;margin-bottom:5px}
  .bc-tagline{font-size:.78rem;color:var(--muted);margin-bottom:18px}
  .bc-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px}
  .bc-pill{padding:4px 10px;border-radius:99px;background:rgba(124,110,245,.09);border:1px solid rgba(124,110,245,.16);font-size:.6rem;font-weight:700;color:var(--muted)}
  .bc-cta{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-radius:var(--r-sm);background:linear-gradient(135deg,rgba(124,110,245,.2),rgba(197,108,240,.14));border:1px solid rgba(124,110,245,.25);font-size:.76rem;font-weight:800;color:var(--accent);transition:all .25s}
  .batch-card:hover .bc-cta{background:linear-gradient(135deg,rgba(124,110,245,.32),rgba(197,108,240,.24))}
  .bc-cta-arrow{font-size:1.1rem}

  /* ═══ STUDY SCREEN ═══ */
  #screen-study{position:relative;z-index:1;display:flex;flex-direction:column;min-height:calc(100vh - 64px)}
  .mode-bar{position:sticky;top:64px;z-index:50;background:rgba(6,6,18,.92);backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);border-bottom:1px solid var(--border)}
  .mode-tabs-outer{position:relative;overflow:hidden;max-width:900px;margin:0 auto}
  .mode-tabs-outer::before,.mode-tabs-outer::after{content:'';position:absolute;top:0;bottom:0;width:28px;z-index:2;pointer-events:none}
  .mode-tabs-outer::before{left:0;background:linear-gradient(to right,rgba(6,6,18,.9),transparent)}
  .mode-tabs-outer::after{right:0;background:linear-gradient(to left,rgba(6,6,18,.9),transparent)}
  .mode-tabs{display:flex;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding:0 16px;gap:0}
  .mode-tabs::-webkit-scrollbar{display:none}
  .mode-tab{flex-shrink:0;padding:16px 18px;font-size:.67rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;transition:color .2s,border-color .2s;display:flex;align-items:center;gap:7px;white-space:nowrap}
  .mode-tab:hover{color:var(--muted)}
  .mode-tab.active{color:var(--accent);border-bottom-color:var(--accent)}
  .mode-tab-icon{font-size:1rem}
  .mode-pbar{height:3px;background:rgba(124,110,245,.1)}
  .mode-pbar-fill{height:100%;background:var(--grad);border-radius:99px;transition:width .5s cubic-bezier(.4,0,.2,1);box-shadow:0 0 8px rgba(197,108,240,.5)}
  .study-content{flex:1;padding:28px 20px 110px;max-width:900px;margin:0 auto;width:100%}

  /* Generic helpers */
  .sec-label{font-size:.58rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);margin-bottom:10px;display:flex;align-items:center;gap:10px}
  .sec-label::after{content:'';flex:1;height:1px;background:var(--border)}
  .btn-back{display:inline-flex;align-items:center;gap:8px;padding:9px 18px;border-radius:99px;background:rgba(124,110,245,.1);border:1px solid rgba(124,110,245,.2);color:var(--accent);font-size:.73rem;font-weight:800;cursor:pointer;transition:all .2s;margin-bottom:20px}
  .btn-back:hover{background:rgba(124,110,245,.2);transform:translateX(-2px)}
  .proj-selector{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}
  .proj-sel-btn{padding:8px 18px;border-radius:99px;background:rgba(255,255,255,.04);border:1px solid var(--border);font-size:.72rem;font-weight:700;color:var(--muted);cursor:pointer;transition:all .22s;display:flex;align-items:center;gap:7px}
  .proj-sel-btn:hover{border-color:rgba(124,110,245,.3);color:var(--text)}
  .proj-sel-btn.active{background:rgba(124,110,245,.16);border-color:rgba(124,110,245,.42);color:var(--accent)}
  .proj-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}

  /* Developer panel */
  .dev-panel{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--r);padding:24px;margin-bottom:20px;position:relative;overflow:hidden;backdrop-filter:var(--blur);animation:fadeUp .35s cubic-bezier(.22,1,.36,1) both}
  .dev-panel::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--grad)}
  .dev-top{display:flex;align-items:center;gap:16px;margin-bottom:16px}
  .dev-avatar{width:58px;height:58px;flex-shrink:0;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:28px;background:linear-gradient(135deg,rgba(124,110,245,.18),rgba(197,108,240,.12));border:1px solid rgba(124,110,245,.2)}
  .dev-name{font-family:var(--font-h);font-size:1.25rem;font-weight:900;letter-spacing:-.01em;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:3px}
  .dev-meta{font-size:.7rem;color:var(--dim);font-weight:600}
  .dev-owner-line{font-size:.75rem;color:var(--muted);font-weight:600;margin-top:2px}
  .dev-history{font-size:.77rem;color:var(--muted);line-height:1.7;padding:14px 16px;border-radius:var(--r-sm);background:rgba(124,110,245,.05);border:1px solid rgba(124,110,245,.1)}
  .dev-history strong{color:var(--accent);font-weight:800}

  /* Project card */
  .proj-card{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:20px;backdrop-filter:var(--blur);animation:fadeUp .4s .05s cubic-bezier(.22,1,.36,1) both}
  .proj-card-head{padding:20px 24px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;background:rgba(255,255,255,.02)}
  .proj-card-name{font-family:var(--font-h);font-size:1.15rem;font-weight:900;letter-spacing:-.01em;display:flex;align-items:center;gap:10px}
  .proj-emoji{font-size:1.4rem}
  .area-chip{padding:5px 14px;border-radius:99px;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.22);font-size:.62rem;font-weight:800;color:var(--gold);letter-spacing:.06em;white-space:nowrap}
  .proj-card-body{padding:22px 24px}

  .info-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));margin-bottom:20px}
  .info-tile{padding:14px;border-radius:var(--r-sm);background:rgba(255,255,255,.03);border:1px solid rgba(124,110,245,.1);text-align:center;transition:all .2s;cursor:default}
  .info-tile:hover{border-color:rgba(124,110,245,.25);background:rgba(124,110,245,.07)}
  .info-tile-icon{font-size:1.3rem;margin-bottom:6px}
  .info-tile-val{font-size:.84rem;font-weight:800;color:var(--text);margin-bottom:3px;line-height:1.3}
  .info-tile-key{font-size:.58rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--dim)}

  .units-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));margin-bottom:20px}
  .unit-card{padding:14px 16px;border-radius:var(--r-sm);background:rgba(255,255,255,.025);border:1px solid rgba(124,110,245,.1);transition:all .22s;cursor:default;position:relative;overflow:hidden}
  .unit-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--grad);opacity:0;transition:opacity .22s}
  .unit-card:hover{border-color:rgba(124,110,245,.28);background:rgba(124,110,245,.07)}
  .unit-card:hover::before{opacity:1}
  .unit-type{font-size:.64rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:6px}
  .unit-size{font-size:.9rem;font-weight:700;color:var(--text);margin-bottom:4px}
  .unit-price{font-size:.78rem;font-weight:800;background:linear-gradient(135deg,var(--green),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

  .price-table-wrap{background:rgba(255,255,255,.025);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:20px;overflow-x:auto;animation:fadeUp .45s .08s cubic-bezier(.22,1,.36,1) both}
  .price-table{width:100%;border-collapse:collapse;min-width:320px}
  .price-table th,.price-table td{padding:11px 16px;text-align:left;border-bottom:1px solid var(--border);font-size:.78rem}
  .price-table th{font-size:.6rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);background:rgba(124,110,245,.05)}
  .price-table td{color:var(--text);font-weight:600}
  .price-table tr:last-child td{border-bottom:none}
  .price-table tr:hover td{background:rgba(124,110,245,.04)}
  .price-cell{font-weight:800;background:linear-gradient(135deg,var(--green),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

  .fac-strip{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none;-webkit-overflow-scrolling:touch;margin-bottom:20px}
  .fac-strip::-webkit-scrollbar{display:none}
  .fac-item{flex-shrink:0;min-width:110px;padding:14px;border-radius:var(--r-sm);background:rgba(255,255,255,.03);border:1px solid var(--border);text-align:center}
  .fac-item-icon{font-size:1.5rem;margin-bottom:6px}
  .fac-item-text{font-size:.62rem;font-weight:700;color:var(--muted);line-height:1.4}

  .mastered-banner{padding:18px 22px;border-radius:var(--r);margin-bottom:20px;background:linear-gradient(135deg,rgba(52,211,153,.08),rgba(124,110,245,.07));border:1px solid rgba(52,211,153,.22);display:flex;align-items:center;gap:14px;animation:fadeUp .3s ease both}
  .mastered-emoji{font-size:2rem;flex-shrink:0}
  .mastered-title{font-size:.95rem;font-weight:800;color:var(--green)}
  .mastered-sub{font-size:.72rem;color:var(--muted);margin-top:2px}

  /* ═══ 3D FLASH CARDS ═══ */
  .flash-wrap{display:flex;flex-direction:column;align-items:center;animation:fadeUp .35s cubic-bezier(.22,1,.36,1) both}
  .flash-meta{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:480px;margin-bottom:10px;font-size:.68rem;font-weight:700;color:var(--dim)}
  .f-pbar{width:100%;max-width:480px;height:5px;background:rgba(124,110,245,.12);border-radius:99px;margin-bottom:28px;overflow:hidden}
  .f-pbar-fill{height:100%;background:var(--grad);border-radius:99px;transition:width .4s cubic-bezier(.4,0,.2,1);box-shadow:0 0 8px rgba(197,108,240,.5)}

  /* 3D scene */
  .card3d-scene{width:100%;max-width:480px;height:265px;perspective:1100px;cursor:pointer;margin-bottom:24px}
  @media(max-width:480px){.card3d-scene{height:230px}}
  .card3d-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .65s cubic-bezier(.4,0,.2,1);border-radius:var(--r)}
  .card3d-inner.flipped{transform:rotateY(180deg)}
  .card3d-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:var(--r);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px 28px;text-align:center;border:1px solid var(--border)}
  .card3d-front{background:rgba(255,255,255,.04);backdrop-filter:var(--blur)}
  .card3d-front::before{content:'';position:absolute;inset:0;border-radius:inherit;background-image:radial-gradient(rgba(124,110,245,.12) 1px,transparent 1px);background-size:28px 28px;pointer-events:none}
  .card3d-back{background:linear-gradient(135deg,rgba(124,110,245,.16),rgba(197,108,240,.11));backdrop-filter:var(--blur);transform:rotateY(180deg);border-color:rgba(124,110,245,.38)}
  .card3d-hint{font-size:.62rem;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:var(--dim);margin-bottom:16px;display:flex;align-items:center;gap:7px}
  .card3d-q{font-family:var(--font-h);font-size:1.38rem;font-weight:900;color:var(--text);line-height:1.25}
  .card3d-tap{position:absolute;bottom:18px;font-size:.56rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);animation:breathe 2.5s ease-in-out infinite}
  @keyframes breathe{0%,100%{opacity:.45}50%{opacity:1}}
  .card3d-ans-label{font-size:.62rem;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
  .card3d-ans{font-family:var(--font-h);font-size:1.48rem;font-weight:900;line-height:1.2;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

  .flash-nav{display:none;align-items:center;gap:12px;width:100%;max-width:480px;margin-bottom:16px}
  .flash-nav.show{display:flex}
  .btn-flash-miss{flex:1;padding:13px;border-radius:var(--r-sm);background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.25);color:var(--red);font-size:.8rem;font-weight:800;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px}
  .btn-flash-miss:hover{background:rgba(248,113,113,.18)}
  .btn-flash-got{flex:2;padding:13px;border-radius:var(--r-sm);background:var(--grad);color:#fff;font-size:.84rem;font-weight:800;border:none;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 20px rgba(124,110,245,.35)}
  .btn-flash-got:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(124,110,245,.5)}

  .flash-dots{display:flex;gap:5px;justify-content:center;flex-wrap:wrap;max-width:480px}
  .fdot{width:7px;height:7px;border-radius:50%;background:rgba(124,110,245,.2);transition:all .25s}
  .fdot.done{background:var(--green)}
  .fdot.current{background:var(--accent);transform:scale(1.5);box-shadow:0 0 6px rgba(124,110,245,.6)}
  .fdot.missed{background:var(--red)}

  .flash-done{width:100%;max-width:480px;text-align:center;padding:40px 28px;border-radius:var(--r);background:rgba(255,255,255,.03);border:1px solid var(--border);animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both}
  .flash-done-emoji{font-size:3rem;margin-bottom:12px;display:block}
  .flash-done-title{font-family:var(--font-h);font-size:1.3rem;font-weight:900;margin-bottom:6px;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .flash-done-sub{font-size:.8rem;color:var(--muted);margin-bottom:22px}

  /* ═══ QUIZ ENGINE ═══ */
  .quiz-shell{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;animation:fadeUp .35s cubic-bezier(.22,1,.36,1) both}
  .quiz-top{padding:18px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.02)}
  .quiz-top-label{font-size:.68rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);display:flex;align-items:center;gap:8px}
  .quiz-counter{font-size:.68rem;font-weight:700;color:var(--muted)}
  .quiz-pbar{height:3px;background:rgba(124,110,245,.1)}
  .quiz-pbar-fill{height:100%;background:var(--grad);border-radius:99px;transition:width .5s cubic-bezier(.4,0,.2,1);box-shadow:0 0 6px rgba(197,108,240,.4)}
  .quiz-body{padding:26px 22px}
  .quiz-q-label{font-size:.6rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin-bottom:10px}
  .quiz-question{font-family:var(--font-h);font-size:1.05rem;font-weight:700;line-height:1.5;color:var(--text);margin-bottom:22px}
  .quiz-options{display:flex;flex-direction:column;gap:10px}
  .quiz-opt{padding:15px 18px;border-radius:var(--r-sm);border:1px solid rgba(124,110,245,.18);background:rgba(255,255,255,.03);color:var(--text);font-size:.86rem;font-weight:600;text-align:left;cursor:pointer;transition:all .22s;display:flex;align-items:center;gap:14px;position:relative;overflow:hidden}
  .qol{width:28px;height:28px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:900;background:rgba(124,110,245,.12);color:var(--accent);transition:all .22s}
  .quiz-opt:hover:not(:disabled){border-color:rgba(124,110,245,.42);background:rgba(124,110,245,.09);transform:translateX(4px)}
  .quiz-opt:hover:not(:disabled) .qol{background:rgba(124,110,245,.26);color:var(--text)}
  .quiz-opt.correct{border-color:rgba(52,211,153,.45);background:rgba(52,211,153,.1);transform:none}
  .quiz-opt.correct .qol{background:rgba(52,211,153,.25);color:var(--green)}
  .quiz-opt.wrong{border-color:rgba(248,113,113,.45);background:rgba(248,113,113,.1);animation:shake .4s ease}
  .quiz-opt.wrong .qol{background:rgba(248,113,113,.2);color:var(--red)}
  .quiz-opt:disabled{cursor:default}
  @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
  .quiz-feedback{margin-top:16px;padding:14px 16px;border-radius:var(--r-sm);font-size:.8rem;font-weight:600;line-height:1.55;display:none}
  .quiz-feedback.ok{background:rgba(52,211,153,.09);border:1px solid rgba(52,211,153,.25);color:var(--green);display:block}
  .quiz-feedback.bad{background:rgba(248,113,113,.09);border:1px solid rgba(248,113,113,.25);color:var(--red);display:block}
  .quiz-footer{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-top:1px solid var(--border)}
  .quiz-score-live{font-size:.72rem;font-weight:800;color:var(--dim);display:flex;align-items:center;gap:6px}
  .q-live-dot{width:6px;height:6px;border-radius:50%;background:var(--green)}

  /* ─ Buttons ─ */
  .btn-primary{background:var(--grad);color:#fff;border:none;padding:11px 26px;border-radius:var(--r-sm);font-size:.82rem;font-weight:800;letter-spacing:.04em;cursor:pointer;transition:all .22s;box-shadow:0 4px 18px rgba(124,110,245,.35);display:inline-flex;align-items:center;gap:8px}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(124,110,245,.5)}
  .btn-primary:active{transform:translateY(0)}
  .btn-secondary{background:rgba(124,110,245,.12);border:1px solid rgba(124,110,245,.25);color:var(--accent);padding:11px 22px;border-radius:var(--r-sm);font-size:.82rem;font-weight:800;cursor:pointer;transition:all .22s;display:inline-flex;align-items:center;gap:8px}
  .btn-secondary:hover{background:rgba(124,110,245,.22)}
  .btn-hidden{display:none}

  /* ═══ MATCH GAME ═══ */
  .match-shell{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;animation:fadeUp .35s cubic-bezier(.22,1,.36,1) both}
  .match-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--border);background:rgba(255,255,255,.02)}
  .match-title{font-size:.68rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);display:flex;align-items:center;gap:8px}
  .match-score-badge{padding:5px 14px;border-radius:99px;background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.25);font-size:.68rem;font-weight:800;color:var(--gold)}
  .match-body{padding:20px 22px}
  .match-hint{font-size:.78rem;color:var(--muted);line-height:1.6;margin-bottom:18px;padding:12px 16px;border-radius:var(--r-sm);background:rgba(255,255,255,.02);border:1px solid var(--border)}
  .match-grid{display:grid;gap:10px;grid-template-columns:repeat(4,1fr)}
  @media(max-width:460px){.match-grid{grid-template-columns:repeat(3,1fr)}}
  @media(max-width:340px){.match-grid{grid-template-columns:repeat(2,1fr)}}
  .match-card{aspect-ratio:1;border-radius:var(--r-sm);background:rgba(124,110,245,.09);border:1px solid rgba(124,110,245,.18);display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:700;color:var(--muted);cursor:pointer;padding:8px;text-align:center;line-height:1.35;transition:all .25s cubic-bezier(.22,1,.36,1);position:relative;overflow:hidden}
  .match-card:hover:not(.matched){border-color:rgba(124,110,245,.42);background:rgba(124,110,245,.18);transform:scale(1.05)}
  .match-card.face-down::before{content:'?';font-size:1.3rem;color:var(--accent);opacity:.5;position:absolute}
  .match-card.face-down span{opacity:0}
  .match-card.selected{border-color:var(--accent2);background:rgba(197,108,240,.18);color:var(--text);transform:scale(1.06);box-shadow:0 4px 22px rgba(197,108,240,.32)}
  .match-card.matched{background:rgba(52,211,153,.12);border-color:rgba(52,211,153,.35);color:var(--green);cursor:default;animation:mPop .4s cubic-bezier(.22,1,.36,1) both}
  @keyframes mPop{0%{transform:scale(.9);opacity:.5}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
  .match-card.wrong-anim{animation:shake .4s ease}

  /* ═══ FILL BLANK ═══ */
  .blank-shell{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;animation:fadeUp .35s cubic-bezier(.22,1,.36,1) both}
  .blank-head{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid var(--border);background:rgba(255,255,255,.02)}
  .blank-title{font-size:.68rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);display:flex;align-items:center;gap:8px}
  .blank-counter{font-size:.68rem;font-weight:700;color:var(--muted)}
  .blank-body{padding:26px 22px}
  .blank-prompt{font-family:var(--font-h);font-size:1rem;font-weight:700;line-height:1.65;color:var(--text);margin-bottom:20px}
  .blank-iw{position:relative;margin-bottom:16px}
  .blank-input{width:100%;padding:14px 18px;border-radius:var(--r-sm);background:rgba(255,255,255,.05);border:1px solid rgba(124,110,245,.22);color:var(--text);font-size:.9rem;font-weight:600;transition:border-color .2s,box-shadow .2s;outline:none}
  .blank-input:focus{border-color:rgba(124,110,245,.55);box-shadow:0 0 0 3px rgba(124,110,245,.14)}
  .blank-input::placeholder{color:rgba(152,152,200,.4)}
  .blank-input-hint{font-size:.64rem;font-weight:700;color:var(--dim);position:absolute;right:14px;top:50%;transform:translateY(-50%);pointer-events:none}
  .blank-result{padding:12px 16px;border-radius:var(--r-sm);font-size:.82rem;font-weight:700;display:none}
  .blank-result.ok{background:rgba(52,211,153,.09);border:1px solid rgba(52,211,153,.25);color:var(--green);display:block}
  .blank-result.bad{background:rgba(248,113,113,.09);border:1px solid rgba(248,113,113,.25);color:var(--red);display:block}
  .blank-footer{padding:16px 22px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}

  /* Progress bar (pbar) shared */
  .pbar{height:2px;background:rgba(124,110,245,.1);border-radius:99px;overflow:hidden;margin-bottom:20px}
  .pbar-fill{height:100%;background:var(--grad);border-radius:99px;transition:width .4s cubic-bezier(.4,0,.2,1)}

  /* ═══ SCORE MODAL ═══ */
  .score-overlay{display:none;position:fixed;inset:0;z-index:300;align-items:center;justify-content:center;background:rgba(6,6,18,.92);backdrop-filter:blur(14px);padding:20px}
  .score-overlay.active{display:flex}
  .score-card{background:rgba(12,12,28,.97);border:1px solid rgba(124,110,245,.38);border-radius:28px;padding:40px 32px;max-width:400px;width:100%;text-align:center;position:relative;overflow:hidden;animation:scoreIn .5s cubic-bezier(.22,1,.36,1) both;box-shadow:0 40px 100px rgba(0,0,0,.65),0 0 80px rgba(124,110,245,.12)}
  .score-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--grad)}
  @keyframes scoreIn{from{opacity:0;transform:scale(.85) translateY(20px)}to{opacity:1;transform:none}}
  .score-emoji{font-size:3.5rem;display:block;margin-bottom:12px;animation:bounceIn .5s .1s both}
  @keyframes bounceIn{from{transform:scale(.4)}75%{transform:scale(1.15)}to{transform:scale(1)}}
  .score-title{font-family:var(--font-h);font-size:1.7rem;font-weight:900;letter-spacing:-.02em;margin-bottom:6px;background:linear-gradient(145deg,#fff,#c8c0ff,#f093fb);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .score-sub{font-size:.84rem;color:var(--muted);margin-bottom:28px}
  .score-ring-wrap{display:flex;justify-content:center;margin-bottom:24px}
  .score-ring{position:relative;width:120px;height:120px}
  .score-ring svg{width:120px;height:120px;transform:rotate(-90deg)}
  .sr-bg{fill:none;stroke:rgba(124,110,245,.12);stroke-width:9}
  .sr-arc{fill:none;stroke:url(#sgGrad);stroke-width:9;stroke-linecap:round;stroke-dasharray:330;stroke-dashoffset:330;transition:stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)}
  .score-ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .score-pct{font-family:var(--font-h);font-size:1.8rem;font-weight:900;line-height:1;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .score-pct-label{font-size:.5rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin-top:3px}
  .score-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:26px}
  .sst{padding:14px;border-radius:var(--r-sm);background:rgba(255,255,255,.03);border:1px solid var(--border)}
  .sst-val{font-size:1.4rem;font-weight:900;line-height:1;margin-bottom:3px}
  .sst-key{font-size:.58rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
  .sst.ok .sst-val{color:var(--green)}
  .sst.bad .sst-val{color:var(--red)}
  .score-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}

  /* Confetti */
  #confetti-canvas{position:fixed;inset:0;z-index:299;pointer-events:none;display:none}

  /* ═══ BOTTOM NAV ═══ */
  .bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:80;background:rgba(6,6,18,.96);backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);border-top:1px solid var(--border)}
  .bottom-nav-inner{padding:6px 8px max(8px,env(safe-area-inset-bottom));position:relative;display:flex}
  .bn-pill{position:absolute;top:6px;height:calc(100% - 12px - max(8px,env(safe-area-inset-bottom)));background:rgba(124,110,245,.18);border:1px solid rgba(124,110,245,.38);border-radius:14px;transition:left .35s cubic-bezier(.34,1.56,.64,1),width .35s cubic-bezier(.34,1.56,.64,1);pointer-events:none}
  .bn-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px 6px;background:none;border:none;cursor:pointer;font-size:.52rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--dim);transition:color .2s;position:relative;z-index:1}
  .bn-tab.active{color:var(--accent)}
  .bn-icon{font-size:1.15rem}
  @media(max-width:640px){.bottom-nav{display:block}}

  /* ═══ DONE BANNER ═══ */
  .done-banner{padding:18px 22px;border-radius:var(--r);margin-bottom:22px;background:linear-gradient(135deg,rgba(52,211,153,.07),rgba(124,110,245,.07));border:1px solid rgba(52,211,153,.2);text-align:center;animation:fadeUp .35s ease both}
  .done-banner-emoji{font-size:2.2rem;margin-bottom:8px}
  .done-banner-title{font-size:1rem;font-weight:800;color:var(--green);margin-bottom:4px}
  .done-banner-sub{font-size:.74rem;color:var(--muted)}

  /* ═══ GLOBAL ANIMATIONS ═══ */
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
  @keyframes pop{0%,100%{transform:scale(1)}45%{transform:scale(1.18)}70%{transform:scale(.96)}}
  .anim-pop{animation:pop .35s ease}

  /* ═══ RESPONSIVE ═══ */
  @media(max-width:640px){
    .info-grid{grid-template-columns:repeat(2,1fr)}
    .units-grid{grid-template-columns:repeat(2,1fr)}
    .study-content{padding-bottom:120px}
    .proj-card-body,.proj-card-head{padding:16px}
    .dev-panel{padding:18px}
    .quiz-body,.blank-body,.match-body{padding:18px 16px}
    .quiz-top,.match-head,.blank-head,.quiz-footer,.blank-footer{padding:14px 16px}
    .card3d-q{font-size:1.2rem}
    .card3d-ans{font-size:1.3rem}
  }
  @media(max-width:380px){
    .units-grid{grid-template-columns:1fr 1fr}
    .match-grid{grid-template-columns:repeat(2,1fr)}
  }
  @media print{.topbar,.bottom-nav,.orb-1,.orb-2,.orb-3,#bg-canvas,.btn-back{display:none!important}}
  </style>
</head>
<body>

  <canvas id="bg-canvas"></canvas>
  <div class="orb-1"></div>
  <div class="orb-2"></div>
  <div class="orb-3"></div>

  <!-- ═══ TOP BAR ═══ -->
  <nav class="topbar" role="navigation" aria-label="Xcelias navigation">
    <a class="topbar-logo" href="/" aria-label="Xcelias home">
      <div class="logo-icon">X</div>
      <span class="logo-word">Xcelias</span>
    </a>
    <div class="topbar-sep"></div>
    <div class="topbar-mod" id="topbar-mod">Batch Library</div>
    <div class="topbar-right">
      <div class="batch-pill" id="batch-pill" style="display:none"></div>
      <div class="user-chip" id="user-chip" onclick="handleSignOut()" role="button" tabindex="0" onkeydown="if(event.key==='Enter')handleSignOut()">
        <div class="chip-dot"></div>
        <span id="user-chip-name">...</span>
      </div>
    </div>
  </nav>

  <!-- ═══ MAIN ═══ -->
  <main id="app" role="main">

    <!-- SCREEN 1: Batch Selection -->
    <section id="screen-batches" class="screen">
      <div class="hero">
        <div class="hero-eyebrow">🎓 Real Estate Training</div>
        <h1 class="hero-title">Study Guide</h1>
        <p class="hero-sub">Master every project, developer, and payment plan through structured study and interactive exercises.</p>
      </div>
      <div class="stats-strip">
        <div class="stat"><span class="stat-n" id="stat-batches">1</span><span class="stat-l">Batches</span></div>
        <div class="stat"><span class="stat-n" id="stat-projects">5</span><span class="stat-l">Projects</span></div>
        <div class="stat"><span class="stat-n" id="stat-devs">5</span><span class="stat-l">Developers</span></div>
        <div class="stat"><span class="stat-n" id="stat-mastered">0/5</span><span class="stat-l">Mastered</span></div>
      </div>
      <div class="batch-grid" id="batch-grid"></div>
    </section>

    <!-- SCREEN 2: Study -->
    <section id="screen-study" class="screen">
      <div class="mode-bar" role="navigation" aria-label="Study modes">
        <div class="mode-tabs-outer">
          <div class="mode-tabs" id="mode-tabs" role="tablist"></div>
        </div>
        <div class="mode-pbar"><div class="mode-pbar-fill" id="mode-pbar-fill" style="width:0%"></div></div>
      </div>
      <div class="study-content" id="study-content" role="tabpanel"></div>
    </section>

  </main>

  <!-- ═══ BOTTOM NAV ═══ -->
  <nav class="bottom-nav" id="bottom-nav" aria-label="Study mode navigation">
    <div class="bottom-nav-inner" id="bn-inner">
      <div class="bn-pill" id="bn-pill"></div>
      <button class="bn-tab active" id="bn-study" onclick="switchSection('study')"><span class="bn-icon">📖</span>Study</button>
      <button class="bn-tab" id="bn-flash" onclick="switchSection('flash')"><span class="bn-icon">⚡</span>Flash</button>
      <button class="bn-tab" id="bn-quiz"  onclick="switchSection('quiz')"><span class="bn-icon">🧠</span>Quiz</button>
      <button class="bn-tab" id="bn-match" onclick="switchSection('match')"><span class="bn-icon">🎯</span>Match</button>
      <button class="bn-tab" id="bn-blank" onclick="switchSection('blank')"><span class="bn-icon">✏️</span>Fill</button>
    </div>
  </nav>

  <!-- ═══ SCORE MODAL ═══ -->
  <div class="score-overlay" id="score-overlay" role="dialog" aria-modal="true" aria-label="Quiz Results">
    <div class="score-card">
      <span class="score-emoji" id="score-emoji">🏆</span>
      <div class="score-title" id="score-title">Outstanding!</div>
      <div class="score-sub" id="score-sub">You've completed the quiz</div>
      <div class="score-ring-wrap">
        <div class="score-ring">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <defs>
              <linearGradient id="sgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#7c6ef5"/>
                <stop offset="100%" stop-color="#f093fb"/>
              </linearGradient>
            </defs>
            <circle class="sr-bg" cx="60" cy="60" r="52"/>
            <circle class="sr-arc" id="sr-arc" cx="60" cy="60" r="52"/>
          </svg>
          <div class="score-ring-center">
            <div class="score-pct" id="score-pct">0%</div>
            <div class="score-pct-label">Score</div>
          </div>
        </div>
      </div>
      <div class="score-stats">
        <div class="sst ok"><div class="sst-val" id="score-correct">0</div><div class="sst-key">Correct</div></div>
        <div class="sst bad"><div class="sst-val" id="score-wrong">0</div><div class="sst-key">Wrong</div></div>
      </div>
      <div class="score-actions">
        <button class="btn-primary" onclick="retryQuiz()">⚡ Retry Quiz</button>
        <button class="btn-secondary" onclick="closeScoreModal()">📖 Keep Studying</button>
      </div>
    </div>
  </div>

  <canvas id="confetti-canvas"></canvas>

  <!-- Firebase -->
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js" crossorigin></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js" crossorigin></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js" crossorigin></script>
  <script src="/activities/firebase-config.js"></script>
  <script src="/xcelias-auth.js"></script>

  <script>
  'use strict';

  /* ═══════════════════════════════
     BACKGROUND — twinkling stars
     ═══════════════════════════════ */
  (function initStars() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, stars = [];
    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    function seed() {
      stars = [];
      for (let i = 0; i < 130; i++) {
        stars.push({ x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.1 + 0.15,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.008 + 0.003 });
      }
    }
    resize(); seed();
    window.addEventListener('resize', () => { resize(); seed(); });
    const colors = ['rgba(200,200,255,', 'rgba(220,210,255,', 'rgba(180,220,255,'];
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const t = Date.now() * 0.001;
      stars.forEach((s, i) => {
        const op = (Math.sin(t * s.speed * 20 + s.phase) * 0.4 + 0.55) * 0.55;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = colors[i % 3] + op + ')';
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    draw();
  })();

  /* ═══════════════════════════════
     CONFETTI
     ═══════════════════════════════ */
  function launchConfetti(pct) {
    if (pct < 70) return;
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const colors = ['#7c6ef5','#c56cf0','#34d399','#fbbf24','#f87171','#60a5fa','#fff'];
    const particles = [];
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width * (.2 + Math.random() * .6),
        y: -10,
        vx: (Math.random() - 0.5) * 5,
        vy: Math.random() * 4 + 2,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.22,
        w: Math.random() * 9 + 4,
        h: Math.random() * 14 + 6,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    let frame = 0;
    const MAX = 100;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV; p.vy += 0.09;
        const op = Math.max(0, 1 - frame / MAX);
        ctx.save();
        ctx.globalAlpha = op;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
      });
      frame++;
      if (frame < MAX + 20) requestAnimationFrame(draw);
      else { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.style.display = 'none'; }
    }
    draw();
  }

  /* ═══════════════════════════════
     DATA — Batch 31
     ═══════════════════════════════ */
  const PROJECT_COLORS = {
    cityzen:   '#fbbf24',
    jade:      '#34d399',
    grandlane: '#60a5fa',
    lushvalley:'#a78bfa',
    vdlc:      '#fb7185'
  };

  const BATCHES = [
    {
      id: 'batch31', label: 'Batch 31', status: 'available', icon: '🏙️',
      tagline: 'New Capital Focus — 5 Premier Projects',
      projects: [
        {
          id: 'cityzen', devName: 'Al Qamzi', devIcon: '🏢', devOwner: 'Abdalla Al Qamzi',
          devSince: 'Founded 1997 · Egypt entry 2010',
          devHistory: [
            {label:'New Cairo',project:'East Shire'},
            {label:'North Coast',project:'Seazen (K-171)'},
            {label:'Mostakbal City',project:'Cityzen'}
          ],
          projectName: 'Cityzen', area: '95 feddan', location: 'Mostakbal City',
          delivery: '4 years', maintenance: '10%',
          paymentPlan: '5% DP + 5% after 3 months · 9 years',
          finishing: ['Apartments: Semi Finished','Villas: Core & Shell'],
          units: [
            {type:'1 BR',size:'65m²',price:'3.7M',priceNum:3.7},
            {type:'2 BR',size:'120m²',price:'6.9M',priceNum:6.9},
            {type:'3 BR',size:'145–185m²',price:'7.9M',priceNum:7.9},
            {type:'Townhome',size:'180m²',price:'16M',priceNum:16},
            {type:'Standalone Villa',size:'275m²',price:'31M',priceNum:31}
          ]
        },
        {
          id: 'jade', devName: 'La Vista', devIcon: '🌿', devOwner: 'Alaa El Hady',
          devSince: 'Established developer',
          devHistory: [
            {label:'North Coast',project:'La Vista Cascada, La Vista Bay East, La Vista Ras El Hikma'},
            {label:'Sokhna',project:'La Vista Ray, La Vista 6, La Vista Gardens'},
            {label:'El Shorouk',project:'El Patio 5 East, El Patio Prime, El Patio Casa, El Patio Sola'},
            {label:'New Capital',project:'La Vista City — El Patio Jade (launch 2026)'},
            {label:'6th Settlement',project:'El Patio Vida'},
            {label:'New Cairo',project:'El Patio Oro, Patio 7, Patio Town'},
            {label:'Sheikh Zayed',project:'El Patio Vera'}
          ],
          projectName: 'El Patio Jade', area: '100 feddan', location: 'New Capital',
          delivery: '4 years', maintenance: '8%',
          paymentPlan: '5% DP · 8 years',
          finishing: ['Apartments: Core & Shell','Villas: Core & Shell'],
          facilities: ['10-acre Clubhouse','Sports courts','Kids play areas','Food court','Outdoor gym','Massive water features'],
          units: [
            {type:'Townhouse Mid',size:'185m²',price:'18.7M',priceNum:18.7},
            {type:'Townhouse Corner',size:'200m²',price:'Sold Out',priceNum:0},
            {type:'Twin House',size:'210m²',price:'22.2M',priceNum:22.2},
            {type:'S/A Villa 225m²',size:'225m²',price:'23.9M',priceNum:23.9},
            {type:'S/A Villa 265m²',size:'265m²',price:'~30M',priceNum:30},
            {type:'S/A Villa 310m²',size:'310m²',price:'~37M',priceNum:37},
            {type:'S/A Villa 411m²',size:'411m²',price:'44.6M',priceNum:44.6},
            {type:'Family House G',size:'165m²',price:'18.4M',priceNum:18.4},
            {type:'Penthouse',size:'205m²',price:'17.3M',priceNum:17.3}
          ]
        },
        {
          id: 'grandlane', devName: 'HDP', devIcon: '🏗️', devOwner: 'HDP Developer',
          devSince: 'Established developer',
          devHistory: [{label:'New Capital',project:'Grand Lane'}],
          projectName: 'Grand Lane', area: '98 feddan', location: 'New Capital',
          delivery: '4 years', maintenance: null,
          paymentPlan: '5% DP · choose 4, 8, or 10 years',
          finishing: ['Apartments: Semi Finished','Villas: Core & Shell'],
          units: [
            {type:'1 BR',size:'65–109m²',price:'3.5M (4y) / 4.3M (8y) / 4.7M (10y)',priceNum:3.5},
            {type:'2 BR',size:'103–144m²',price:'5.2M (4y) / 6.3M (8y) / 7M (10y)',priceNum:5.2},
            {type:'3 BR',size:'138–167m²',price:'6.5M (4y) / 7.9M (8y) / 8.8M (10y)',priceNum:6.5},
            {type:'Town House',size:'184–203m²',price:'12.3M (4y) / 14.9M (8y) / 16.5M (10y)',priceNum:12.3},
            {type:'Villa',size:'235–251m²',price:'23M (4y) / 27.9M (8y) / 30.9M (10y)',priceNum:23}
          ]
        },
        {
          id: 'lushvalley', devName: 'City Edge', devIcon: '🌆', devOwner: 'Tamer Nasser (CEO)',
          devSince: 'Since 2017',
          devHistory: [
            {label:'New Cairo',project:'V40'},
            {label:'6th October',project:'Etapa'},
            {label:'North Coast',project:'Mazarine, North Edge, The Gate Towers, Latin City Golf'},
            {label:'New Capital',project:'El Maqsed, Jade Park, New Garden City'},
            {label:'New Mansoura',project:'Zahya, Areej, Marjan'}
          ],
          projectName: 'Lush Valley', area: '60 feddan', location: 'New Capital',
          delivery: null, maintenance: '8%',
          paymentPlan: '5% DP + 5% · 8 years',
          finishing: ['All types available'],
          units: [
            {type:'1 BR',size:'70m²',price:'5.6M',priceNum:5.6},
            {type:'2 BR',size:'96–132m²',price:'9.7M',priceNum:9.7},
            {type:'3 BR',size:'157–237m²',price:'12.9M',priceNum:12.9},
            {type:'Loft',size:'195m²',price:'15.5M',priceNum:15.5},
            {type:'Duplex',size:'226–307m²',price:'19.4M',priceNum:19.4},
            {type:'Mansio',size:'261–312m²',price:'24.4M',priceNum:24.4}
          ]
        },
        {
          id: 'vdlc', devName: 'Palm Hills', devIcon: '🌴', devOwner: 'Yassen Mansour',
          devSince: 'Since 1997',
          devHistory: [
            {label:'New Cairo',project:'The Village, PK1, PK2, VGK, PHNC, Palmet, Village Avenue, The Village Gate'},
            {label:'Sarai',project:'Capital Gardens'},
            {label:'6th October',project:'Bamboo, Palm Valley, Golf Central, Golf Views, PX, The Crown, Woodville, Palm Parks, Badya, Casa, Jirian'},
            {label:'North Coast',project:'Hacienda Bay, Henesh, Blue, Waters 1 & 2, White, West'},
            {label:'New Alamain',project:'PHNA, Palm Hill, Alex'}
          ],
          projectName: 'Village De La Capital', area: '290 feddan (Phase 1: 88F)', location: 'New Capital',
          delivery: '5 years', maintenance: null,
          paymentPlan: '1.5% down payment · 12 years',
          finishing: ['Core & Shell'],
          facilities: ['95% units overlooking landscape/water','Commercial area','School','Community Center'],
          units: [
            {type:'1 BR',size:'60m²',price:'5.5M',priceNum:5.5},
            {type:'2 BR',size:'95m²',price:'7.9M',priceNum:7.9},
            {type:'3 BR',size:'140m²',price:'11.6M',priceNum:11.6},
            {type:'Townhouse Mid',size:'185m²',price:'18.8M',priceNum:18.8},
            {type:'Townhouse Corner',size:'185m²',price:'20.8M',priceNum:20.8},
            {type:'S/A Villa 285m²',size:'285m²',price:'26.5M',priceNum:26.5},
            {type:'S/A Villa 300m²',size:'300m²',price:'29.9M',priceNum:29.9},
            {type:'S/A Villa 371m²',size:'371m²',price:'36.6M',priceNum:36.6}
          ]
        }
      ]
    }
  ];

  /* ═══════════════════════════════
     QUIZ BANK
     ═══════════════════════════════ */
  function buildQuestions(projects) {
    const qs = [];
    projects.forEach(p => {
      qs.push({q:`Who is the developer behind "${p.projectName}"?`,options:shuffle(projects.map(x=>x.devName)),answer:p.devName,explain:`${p.projectName} is developed by ${p.devName} (${p.devOwner}).`});
      qs.push({q:`What is the payment plan for "${p.projectName}"?`,options:shuffle([p.paymentPlan,...projects.filter(x=>x.id!==p.id).slice(0,3).map(x=>x.paymentPlan)]).slice(0,4),answer:p.paymentPlan,explain:`${p.projectName} payment plan: ${p.paymentPlan}`});
      qs.push({q:`What is the total area of "${p.projectName}"?`,options:shuffle([p.area,...projects.filter(x=>x.id!==p.id).slice(0,3).map(x=>x.area)]).slice(0,4),answer:p.area,explain:`${p.projectName} covers ${p.area}.`});
      if(p.maintenance){qs.push({q:`What is the maintenance fee for "${p.projectName}"?`,options:shuffle([p.maintenance,'5%','12%','15%']).slice(0,4),answer:p.maintenance,explain:`Maintenance for ${p.projectName} is ${p.maintenance}.`})}
      const cheap=p.units.filter(u=>u.priceNum>0).sort((a,b)=>a.priceNum-b.priceNum)[0];
      if(cheap){qs.push({q:`In "${p.projectName}", what is the entry-level unit and price?`,options:shuffle([`${cheap.type} — ${cheap.price}`,...projects.filter(x=>x.id!==p.id).slice(0,3).map(x=>{const c=x.units.filter(u=>u.priceNum>0).sort((a,b)=>a.priceNum-b.priceNum)[0];return c?`${c.type} — ${c.price}`:'1 BR — 5M'})]).slice(0,4),answer:`${cheap.type} — ${cheap.price}`,explain:`Entry-level in ${p.projectName}: ${cheap.type} (${cheap.size}) at ${cheap.price}.`})}
    });
    qs.push({q:'Which project has the LONGEST payment plan (most years)?',options:shuffle(['Village De La Capital — 12 yrs','Cityzen — 9 yrs','Grand Lane — 10 yrs','El Patio Jade — 8 yrs']),answer:'Village De La Capital — 12 yrs',explain:'Palm Hills Village De La Capital: 1.5% DP over 12 years.'});
    qs.push({q:'Which project is in Mostakbal City (NOT New Capital)?',options:shuffle(['Cityzen','El Patio Jade','Lush Valley','Village De La Capital']),answer:'Cityzen',explain:'Cityzen (Al Qamzi) is in Mostakbal City. The other 4 are in New Capital.'});
    qs.push({q:'Grand Lane offers multiple delivery timelines. Which is NOT one of them?',options:shuffle(['4 years','6 years','8 years','10 years']),answer:'6 years',explain:'Grand Lane offers 4, 8, and 10-year plans. 6 years is not available.'});
    qs.push({q:'Which project has the LARGEST area (feddan)?',options:shuffle(['Village De La Capital — 290F','El Patio Jade — 100F','Grand Lane — 98F','Cityzen — 95F']),answer:'Village De La Capital — 290F',explain:'Village De La Capital is the largest at 290 feddan (Phase 1 alone is 88 feddan).'});
    qs.push({q:'Which project has the SMALLEST area (feddan)?',options:shuffle(['Lush Valley — 60F','Cityzen — 95F','Grand Lane — 98F','El Patio Jade — 100F']),answer:'Lush Valley — 60F',explain:'Lush Valley (City Edge) is smallest at 60 feddan.'});
    qs.push({q:'Which project introduced a "Mansio" as a unit type?',options:shuffle(['Lush Valley','Grand Lane','Cityzen','Village De La Capital']),answer:'Lush Valley',explain:'City Edge\'s Lush Valley includes unique "Mansio" units (261–312m²) from 24.4M.'});
    qs.push({q:'La Vista\'s "El Patio Jade" Townhouse Corner status?',options:shuffle(['Sold Out','22.2M','18.7M','20M']),answer:'Sold Out',explain:'The Townhouse Corner (200m²) in El Patio Jade is sold out.'});
    qs.push({q:'Which developer\'s CEO is named Tamer Nasser?',options:shuffle(['City Edge','Palm Hills','Al Qamzi','HDP']),answer:'City Edge',explain:'City Edge\'s CEO is Tamer Nasser (founded 2017).'});
    qs.push({q:'Palm Hills "Village De La Capital" — what % of units overlook landscape/water?',options:shuffle(['95%','80%','70%','60%']),answer:'95%',explain:'95% of units in Village De La Capital overlook landscape and water.'});
    qs.push({q:'HDP\'s Grand Lane finishing is:',options:shuffle(['Apartments Semi-Finished, Villas Core & Shell','All Fully Finished','All Core & Shell','Apartments Core & Shell, Villas Fully Finished']),answer:'Apartments Semi-Finished, Villas Core & Shell',explain:'Grand Lane: Apartments semi-finished, Villas core & shell.'});
    return shuffle(qs);
  }

  /* ═══════════════════════════════
     FLASH CARD DATA
     ═══════════════════════════════ */
  function buildFlashCards(project) {
    const cards = [];
    cards.push({q:'Developer',a:project.devName});
    cards.push({q:'Owner',a:project.devOwner});
    cards.push({q:'Project Area',a:project.area});
    cards.push({q:'Location',a:project.location});
    cards.push({q:'Payment Plan',a:project.paymentPlan});
    cards.push({q:'Delivery',a:project.delivery||'TBC'});
    if(project.maintenance)cards.push({q:'Maintenance',a:project.maintenance});
    project.units.slice(0,4).forEach(u=>{
      cards.push({q:`${u.type} price`,a:u.price});
      cards.push({q:`${u.type} size`,a:u.size});
    });
    if(project.facilities)cards.push({q:'Key Facility',a:project.facilities[0]});
    return shuffle(cards);
  }

  /* ═══════════════════════════════
     BLANKS DATA
     ═══════════════════════════════ */
  function buildBlanks(projects) {
    const blanks = [];
    projects.forEach(p=>{
      blanks.push({prompt:`${p.projectName} by ${p.devName} covers _____ feddan in ${p.location}.`,answers:[p.area.replace(' feddan',''),p.area],hint:'Enter area in feddan'});
      blanks.push({prompt:`${p.devName}'s payment plan for ${p.projectName} is: _____`,answers:[p.paymentPlan.toLowerCase()],hint:'e.g. 5% DP · 8 years',partial:true});
      if(p.maintenance)blanks.push({prompt:`The maintenance fee for ${p.projectName} is _____%.`,answers:[p.maintenance.replace('%','').trim()],hint:'Numbers only'});
    });
    blanks.push({prompt:'The developer behind Village De La Capital is _____ with owner _____.', answers:['palm hills / yassen mansour','palm hills yassen mansour'],hint:'Developer name / owner name',partial:true});
    blanks.push({prompt:'Grand Lane (HDP) offers delivery in _____ years.',answers:['4'],hint:'Number of years'});
    return shuffle(blanks);
  }

  /* ═══════════════════════════════
     MATCH PAIRS DATA
     ═══════════════════════════════ */
  function buildMatchPairs(projects) {
    const pairs = [];
    projects.forEach(p=>{
      pairs.push({id:p.id+'_d',group:p.id,text:p.devName,type:'dev'});
      pairs.push({id:p.id+'_p',group:p.id,text:p.projectName,type:'proj'});
    });
    return shuffle(pairs);
  }

  /* ═══════════════════════════════
     STATE
     ═══════════════════════════════ */
  let currentBatch   = null;
  let currentSection = 'study';
  let currentProjIdx = 0;
  let quizQuestions  = [];
  let quizIndex      = 0;
  let quizCorrect    = 0;
  let quizAnswered   = false;
  let flashCards     = [];
  let flashIndex     = 0;
  let flashResults   = [];
  let blanks         = [];
  let blankIndex     = 0;
  let matchPairs     = [];
  let matchSelected  = null;
  let matchMatched   = [];
  let masteredSets   = JSON.parse(localStorage.getItem('xc_sg_mastered')||'{}');
  let localScores    = JSON.parse(localStorage.getItem('xc_sg_scores')||'[]');

  /* ═══════════════════════════════
     UTILITIES
     ═══════════════════════════════ */
  function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function esc(s){const d=document.createElement('div');d.textContent=String(s||'');return d.innerHTML}
  function el(id){return document.getElementById(id)}
  function normStr(s){return String(s||'').toLowerCase().replace(/[^a-z0-9%\/\. ]/g,'').trim()}
  function pc(id){return PROJECT_COLORS[id]||'var(--accent)'}

  /* ═══════════════════════════════
     AUTH + INIT
     ═══════════════════════════════ */
  XceliasAuth.guard({
    moduleName: 'Study Guide',
    requiredRoles: null,
    onReady: function(user) {
      el('user-chip-name').textContent = user.displayName || user.username || 'Trainee';
      initApp();
    }
  });

  function handleSignOut(){if(confirm('Sign out of Xcelias?'))XceliasAuth.signOut()}

  function initApp(){
    renderBatchGrid();
    showScreen('screen-batches');
    updateMasteredStat();
  }

  function updateMasteredStat(){
    const total=BATCHES.reduce((s,b)=>s+b.projects.length,0);
    const m=Object.keys(masteredSets).length;
    if(el('stat-mastered'))el('stat-mastered').textContent=m+'/'+total;
  }

  function showScreen(id){
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    const s=el(id);if(s)s.classList.add('active');
    window.scrollTo(0,0);
  }

  /* ═══════════════════════════════
     BATCH GRID RENDER
     ═══════════════════════════════ */
  function renderBatchGrid(){
    const grid=el('batch-grid');if(!grid)return;
    grid.innerHTML=BATCHES.map((batch,i)=>{
      const locked=i>0;
      const pills=batch.projects.map(p=>`<span class="bc-pill">${esc(p.projectName)}</span>`).join('');
      return `<div class="batch-card" style="animation-delay:${i*.09}s"
        tabindex="${locked?-1:0}"
        role="button" aria-disabled="${locked}"
        onclick="${locked?'':'openBatch(\''+batch.id+'\')'}"
        onkeydown="if(event.key==='Enter'&&!${locked})openBatch('${batch.id}')">
        <div class="bc-shimmer"></div>
        <div class="bc-inner">
          <div class="bc-top">
            <div class="bc-icon">${batch.icon}</div>
            <div class="${locked?'bc-badge-lock':'bc-badge-ok'}">${locked?'🔒 Coming soon':'✦ Available'}</div>
          </div>
          <div class="bc-title">${esc(batch.label)}</div>
          <div class="bc-tagline">${esc(batch.tagline)}</div>
          <div class="bc-pills">${pills}</div>
          <div class="bc-cta">
            <span>${locked?'Unlock when ready':'Begin studying'}</span>
            <span class="bc-cta-arrow">${locked?'🔒':'→'}</span>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  /* ═══════════════════════════════
     OPEN BATCH
     ═══════════════════════════════ */
  function openBatch(id){
    currentBatch=BATCHES.find(b=>b.id===id);if(!currentBatch)return;
    quizQuestions=buildQuestions(currentBatch.projects);quizIndex=0;quizCorrect=0;quizAnswered=false;
    blanks=buildBlanks(currentBatch.projects);blankIndex=0;
    matchPairs=buildMatchPairs(currentBatch.projects);
    flashCards=buildFlashCards(currentBatch.projects[0]);flashIndex=0;flashResults=[];
    currentProjIdx=0;
    const bp=el('batch-pill');if(bp){bp.textContent=currentBatch.label;bp.style.display=''}
    if(el('topbar-mod'))el('topbar-mod').textContent=currentBatch.label+' · Study Guide';
    const bn=el('bottom-nav');if(bn)bn.style.display='block';
    buildModeTabs();
    switchSection('study');
    showScreen('screen-study');
  }

  /* ═══════════════════════════════
     MODE TABS
     ═══════════════════════════════ */
  const MODES=[
    {id:'study',icon:'📖',label:'Study'},
    {id:'flash',icon:'⚡',label:'Flash'},
    {id:'quiz', icon:'🧠',label:'Quiz'},
    {id:'match',icon:'🎯',label:'Match'},
    {id:'blank',icon:'✏️',label:'Fill'}
  ];

  function buildModeTabs(){
    const tabs=el('mode-tabs');if(!tabs)return;
    tabs.innerHTML=MODES.map((m,i)=>
      `<button class="mode-tab ${i===0?'active':''}" id="mt-${m.id}"
        onclick="switchSection('${m.id}')" role="tab" aria-selected="${i===0}">
        <span class="mode-tab-icon">${m.icon}</span>${esc(m.label)}
      </button>`
    ).join('');
  }

  function updateModeTabs(active){
    MODES.forEach(m=>{
      const t=el('mt-'+m.id);if(!t)return;
      const on=m.id===active;
      t.classList.toggle('active',on);
      t.setAttribute('aria-selected',String(on));
    });
    // Progress bar fill
    const idx=MODES.findIndex(m=>m.id===active);
    const pct=idx<0?0:(idx/(MODES.length-1)*100);
    const fill=el('mode-pbar-fill');if(fill)fill.style.width=pct+'%';
    // Bottom nav
    MODES.forEach(m=>{
      const b=el('bn-'+m.id);if(b)b.classList.toggle('active',m.id===active);
    });
    updateNavPill(active);
  }

  function updateNavPill(activeId){
    const pill=el('bn-pill');
    const inner=el('bn-inner');
    if(!pill||!inner)return;
    const idx=MODES.findIndex(m=>m.id===activeId);
    const tabs=inner.querySelectorAll('.bn-tab');
    if(idx<0||idx>=tabs.length)return;
    const tab=tabs[idx];
    requestAnimationFrame(()=>{
      pill.style.left=(tab.offsetLeft+4)+'px';
      pill.style.width=(tab.offsetWidth-8)+'px';
    });
  }

  /* ═══════════════════════════════
     SECTION SWITCH
     ═══════════════════════════════ */
  function switchSection(section){
    currentSection=section;
    updateModeTabs(section);
    const area=el('study-content');if(!area)return;
    switch(section){
      case 'study': renderStudySection(area);break;
      case 'flash': renderFlashSection(area);break;
      case 'quiz':  renderQuizSection(area); break;
      case 'match': renderMatchSection(area);break;
      case 'blank': renderBlankSection(area);break;
    }
    window.scrollTo({top:0,behavior:'smooth'});
  }

  /* ═══════════════════════════════════════
     SECTION 1 — STUDY
     ═══════════════════════════════════════ */
  function renderStudySection(area){
    if(!currentBatch)return;
    const projBtns=currentBatch.projects.map((p,i)=>`
      <button class="proj-sel-btn ${i===currentProjIdx?'active':''}"
        onclick="selectStudyProject(${i})">
        <span class="proj-dot" style="background:${pc(p.id)}"></span>
        ${esc(p.devIcon)} ${esc(p.devName)}
      </button>`).join('');
    area.innerHTML=`
      <button class="btn-back" onclick="goBackToBatches()">← Batch Library</button>
      <div class="proj-selector">${projBtns}</div>
      <div id="study-detail"></div>
    `;
    renderProjectDetail(currentProjIdx);
  }

  function selectStudyProject(i){
    currentProjIdx=i;
    flashCards=buildFlashCards(currentBatch.projects[i]);
    flashIndex=0;flashResults=[];
    document.querySelectorAll('.proj-sel-btn').forEach((b,idx)=>b.classList.toggle('active',idx===i));
    renderProjectDetail(i);
  }

  function renderProjectDetail(i){
    const p=currentBatch.projects[i];
    const det=el('study-detail');if(!det)return;
    const ac=pc(p.id);
    const key=currentBatch.id+'_'+p.id;
    const isMastered=!!masteredSets[key];

    const tiles=[
      {icon:'📐',val:p.area,key:'Area'},
      {icon:'📍',val:p.location,key:'Location'},
      {icon:'💳',val:p.paymentPlan,key:'Payment Plan'},
      {icon:'🏗️',val:p.delivery||'TBC',key:'Delivery'},
      ...(p.maintenance?[{icon:'🔧',val:p.maintenance,key:'Maintenance'}]:[]),
      ...(p.finishing?[{icon:'🎨',val:p.finishing.join(' · '),key:'Finishing'}]:[])
    ];

    const masteredHtml=isMastered?`<div class="mastered-banner"><div class="mastered-emoji">🏆</div><div><div class="mastered-title">You've mastered ${esc(p.projectName)}!</div><div class="mastered-sub">All exercises completed.</div></div></div>`:'';

    const histHtml=p.devHistory.map(h=>`<strong>${esc(h.label)}:</strong> ${esc(h.project)}`).join(' &middot; ');

    const facHtml=p.facilities?`<div class="sec-label">Facilities</div><div class="fac-strip">${p.facilities.map(f=>`<div class="fac-item"><div class="fac-item-icon">🏊</div><div class="fac-item-text">${esc(f)}</div></div>`).join('')}</div>`:'';

    det.style.setProperty('--proj-ac',ac);
    det.innerHTML=`
      ${masteredHtml}
      <div class="dev-panel">
        <div class="dev-top">
          <div class="dev-avatar" style="border-color:${ac}33">${esc(p.devIcon)}</div>
          <div>
            <div class="dev-name" style="background:linear-gradient(135deg,${ac},#c56cf0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${esc(p.devName)}</div>
            <div class="dev-meta">${esc(p.devSince)}</div>
            <div class="dev-owner-line">Owner: ${esc(p.devOwner)}</div>
          </div>
        </div>
        <div class="dev-history">${histHtml}</div>
      </div>

      <div class="proj-card">
        <div class="proj-card-head">
          <div class="proj-card-name" style="color:${ac}">
            <span class="proj-emoji">🏙️</span>${esc(p.projectName)}
          </div>
          <div class="area-chip">📐 ${esc(p.area)}</div>
        </div>
        <div class="proj-card-body">
          <div class="sec-label">Key Info</div>
          <div class="info-grid">
            ${tiles.map(t=>`<div class="info-tile"><div class="info-tile-icon">${t.icon}</div><div class="info-tile-val">${esc(t.val)}</div><div class="info-tile-key">${esc(t.key)}</div></div>`).join('')}
          </div>
          ${facHtml}
          <div class="sec-label">Unit Types & Prices</div>
          <div class="units-grid">
            ${p.units.map(u=>`<div class="unit-card"><div class="unit-type" style="color:${ac}">${esc(u.type)}</div><div class="unit-size">${esc(u.size)}</div><div class="unit-price">${esc(u.price)}</div></div>`).join('')}
          </div>
        </div>
      </div>

      <div class="price-table-wrap">
        <table class="price-table">
          <thead><tr><th>Unit Type</th><th>Size</th><th>Starting Price</th></tr></thead>
          <tbody>${p.units.map(u=>`<tr><td>${esc(u.type)}</td><td>${esc(u.size)}</td><td class="price-cell">${esc(u.price)}</td></tr>`).join('')}</tbody>
        </table>
      </div>

      <div style="text-align:center;padding:4px 0 20px">
        <button class="btn-primary" onclick="switchSection('flash')">⚡ Start Flash Cards →</button>
      </div>
    `;
  }

  /* ═══════════════════════════════════════
     SECTION 2 — FLASH CARDS (3D)
     ═══════════════════════════════════════ */
  function renderFlashSection(area){
    flashCards=buildFlashCards(currentBatch.projects[currentProjIdx]);
    flashIndex=0;flashResults=[];
    const projBtns=currentBatch.projects.map((p,i)=>`
      <button class="proj-sel-btn ${i===currentProjIdx?'active':''}"
        onclick="selectFlashProject(${i})">
        <span class="proj-dot" style="background:${pc(p.id)}"></span>
        ${esc(p.devIcon)} ${esc(p.devName)}
      </button>`).join('');
    area.innerHTML=`
      <button class="btn-back" onclick="goBackToBatches()">← Batch Library</button>
      <div class="proj-selector">${projBtns}</div>
      <div id="flash-area" style="display:flex;flex-direction:column;align-items:center"></div>
    `;
    renderFlashCard();
  }

  function selectFlashProject(i){
    currentProjIdx=i;
    flashCards=buildFlashCards(currentBatch.projects[i]);
    flashIndex=0;flashResults=[];
    document.querySelectorAll('.proj-sel-btn').forEach((b,idx)=>b.classList.toggle('active',idx===i));
    renderFlashCard();
  }

  function renderFlashCard(){
    const area=el('flash-area');if(!area)return;
    if(flashIndex>=flashCards.length){
      const got=flashResults.filter(Boolean).length;
      area.innerHTML=`<div class="flash-done">
        <div class="flash-done-emoji">⚡</div>
        <div class="flash-done-title">All Flash Cards Complete!</div>
        <div class="flash-done-sub">${flashCards.length} cards reviewed · ${got} got it · ${flashCards.length-got} missed</div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn-secondary" onclick="flashIndex=0;flashResults=[];renderFlashCard()">🔄 Replay</button>
          <button class="btn-primary" onclick="switchSection('quiz')">🧠 Take Quiz →</button>
        </div>
      </div>`;
      return;
    }
    const card=flashCards[flashIndex];
    const prog=Math.round((flashIndex/flashCards.length)*100);
    const dots=flashCards.map((_,idx)=>{
      let cls='fdot';
      if(idx<flashIndex)cls+=' '+(flashResults[idx]?'done':'missed');
      else if(idx===flashIndex)cls+=' current';
      return `<div class="${cls}"></div>`;
    }).join('');
    area.innerHTML=`
      <div class="flash-wrap">
        <div class="flash-meta"><span>${flashIndex+1} / ${flashCards.length}</span><span>${prog}%</span></div>
        <div class="f-pbar"><div class="f-pbar-fill" style="width:${prog}%"></div></div>
        <div class="card3d-scene" id="fc-scene" onclick="flipFlashCard()" role="button"
          tabindex="0" aria-label="Tap to flip card"
          onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();flipFlashCard()}">
          <div class="card3d-inner" id="fc-inner">
            <div class="card3d-face card3d-front">
              <div class="card3d-hint">❓ Question</div>
              <div class="card3d-q">${esc(card.q)}</div>
              <div class="card3d-tap">Tap to reveal answer</div>
            </div>
            <div class="card3d-face card3d-back">
              <div class="card3d-ans-label">✦ Answer</div>
              <div class="card3d-ans">${esc(card.a)}</div>
            </div>
          </div>
        </div>
        <div class="flash-nav" id="fc-nav">
          <button class="btn-flash-miss" onclick="flashNext(false)">✗ Missed</button>
          <button class="btn-flash-got"  onclick="flashNext(true)">✓ Got it →</button>
        </div>
        <div class="flash-dots">${dots}</div>
      </div>
    `;
  }

  function flipFlashCard(){
    const inner=el('fc-inner');if(!inner)return;
    const flipped=inner.classList.toggle('flipped');
    const nav=el('fc-nav');
    if(nav)nav.classList.toggle('show',flipped);
  }

  function flashNext(knew){
    flashResults[flashIndex]=knew;
    if(knew){const sc=el('fc-scene');if(sc)sc.classList.add('anim-pop')}
    flashIndex++;
    setTimeout(renderFlashCard,180);
  }

  /* ═══════════════════════════════════════
     SECTION 3 — QUIZ
     ═══════════════════════════════════════ */
  function renderQuizSection(area){
    if(!area&&!(area=el('study-content')))return;
    if(quizIndex>=quizQuestions.length){showQuizResults();return}
    const q=quizQuestions[quizIndex];
    const prog=Math.round((quizIndex/quizQuestions.length)*100);
    const letters=['A','B','C','D'];
    area.innerHTML=`
      <button class="btn-back" onclick="goBackToBatches()">← Batch Library</button>
      <div class="quiz-shell">
        <div class="quiz-top">
          <div class="quiz-top-label">🧠 Quiz — ${esc(currentBatch.label)}</div>
          <div class="quiz-counter">${quizIndex+1} / ${quizQuestions.length}</div>
        </div>
        <div class="quiz-pbar"><div class="quiz-pbar-fill" style="width:${prog}%"></div></div>
        <div class="quiz-body">
          <div class="quiz-q-label">Question ${quizIndex+1}</div>
          <div class="quiz-question">${esc(q.q)}</div>
          <div class="quiz-options" id="quiz-opts">
            ${(q.options||[]).map((opt,i)=>`<button class="quiz-opt" onclick="answerQuiz(${i})" data-idx="${i}">
              <span class="qol">${letters[i]||i+1}</span>${esc(opt)}
            </button>`).join('')}
          </div>
          <div class="quiz-feedback" id="quiz-fb"></div>
        </div>
        <div class="quiz-footer">
          <div class="quiz-score-live"><div class="q-live-dot"></div>${quizCorrect} correct</div>
          <button class="btn-primary btn-hidden" id="quiz-next" onclick="nextQuestion()">
            ${quizIndex+1<quizQuestions.length?'Next →':'See Results 🏆'}
          </button>
        </div>
      </div>
    `;
    quizAnswered=false;
  }

  function answerQuiz(optIdx){
    if(quizAnswered)return;
    quizAnswered=true;
    const q=quizQuestions[quizIndex];
    const chosen=q.options[optIdx];
    const isOk=chosen===q.answer;
    if(isOk)quizCorrect++;
    document.querySelectorAll('.quiz-opt').forEach((btn,i)=>{
      btn.disabled=true;
      if(q.options[i]===q.answer)btn.classList.add('correct');
      else if(i===optIdx&&!isOk)btn.classList.add('wrong');
    });
    const fb=el('quiz-fb');
    if(fb){fb.className='quiz-feedback '+(isOk?'ok':'bad');fb.textContent=isOk?'✅ '+(q.explain||'Correct!'):'❌ The correct answer is: "'+q.answer+'". '+(q.explain||'')}
    const nb=el('quiz-next');if(nb)nb.classList.remove('btn-hidden');
  }

  function nextQuestion(){
    quizIndex++;
    if(quizIndex>=quizQuestions.length)showQuizResults();
    else renderQuizSection(el('study-content'));
  }

  function showQuizResults(){
    const pct=Math.round((quizCorrect/quizQuestions.length)*100);
    let emoji='🥲',title='Keep Practicing';
    if(pct>=90){emoji='🏆';title='Outstanding!'}
    else if(pct>=70){emoji='🎯';title='Well Done!'}
    else if(pct>=50){emoji='📚';title='Good Effort!'}
    el('score-emoji').textContent=emoji;
    el('score-title').textContent=title;
    el('score-sub').textContent=quizCorrect+' / '+quizQuestions.length+' correct · '+pct+'%';
    el('score-pct').textContent=pct+'%';
    el('score-correct').textContent=quizCorrect;
    el('score-wrong').textContent=quizQuestions.length-quizCorrect;
    const arc=el('sr-arc');
    if(arc){const c=330;arc.style.strokeDashoffset=c;requestAnimationFrame(()=>{requestAnimationFrame(()=>{arc.style.strokeDashoffset=c-(c*pct/100)})})}
    saveScore(pct);
    if(pct>=80&&currentBatch){const k=currentBatch.id+'_all';masteredSets[k]=true;localStorage.setItem('xc_sg_mastered',JSON.stringify(masteredSets));updateMasteredStat()}
    const ov=el('score-overlay');if(ov)ov.classList.add('active');
    setTimeout(()=>launchConfetti(pct),400);
  }

  function saveScore(pct){
    const user=XceliasAuth.currentUser();
    localScores.unshift({name:user?(user.displayName||user.username):'Unknown',score:pct,batch:currentBatch?currentBatch.label:'',date:new Date().toLocaleDateString()});
    if(localScores.length>50)localScores=localScores.slice(0,50);
    localStorage.setItem('xc_sg_scores',JSON.stringify(localScores));
  }

  function retryQuiz(){closeScoreModal();quizQuestions=buildQuestions(currentBatch.projects);quizIndex=0;quizCorrect=0;switchSection('quiz')}
  function closeScoreModal(){const ov=el('score-overlay');if(ov)ov.classList.remove('active')}

  /* ═══════════════════════════════════════
     SECTION 4 — MEMORY MATCH
     ═══════════════════════════════════════ */
  function renderMatchSection(area){
    matchPairs=buildMatchPairs(currentBatch.projects);
    matchSelected=null;matchMatched=[];
    area.innerHTML=`
      <button class="btn-back" onclick="goBackToBatches()">← Batch Library</button>
      <div class="match-shell">
        <div class="match-head">
          <div class="match-title">🎯 Match: Developer ↔ Project</div>
          <div class="match-score-badge" id="match-badge">0 / ${currentBatch.projects.length} matched</div>
        </div>
        <div class="match-body">
          <div class="match-hint">Tap a <strong>developer name</strong> then its matching <strong>project</strong>. Match all ${currentBatch.projects.length} pairs to win!</div>
          <div class="match-grid" id="match-grid"></div>
        </div>
      </div>
    `;
    renderMatchGrid();
  }

  function renderMatchGrid(){
    const grid=el('match-grid');if(!grid)return;
    grid.innerHTML=matchPairs.map(card=>{
      const isMatched=matchMatched.includes(card.group);
      const isSelected=matchSelected&&matchSelected.id===card.id;
      return `<button class="match-card face-down ${isMatched?'matched':''} ${isSelected?'selected':''}"
        id="mc-${card.id}" onclick="selectMatchCard('${card.id}')"
        ${isMatched?'disabled':''} aria-label="${esc(card.text)}">
        <span>${esc(card.text)}</span>
      </button>`;
    }).join('');
  }

  function selectMatchCard(cardId){
    const card=matchPairs.find(c=>c.id===cardId);
    if(!card||matchMatched.includes(card.group))return;
    if(!matchSelected){
      matchSelected=card;
      const btn=el('mc-'+cardId);
      if(btn){btn.classList.remove('face-down');btn.classList.add('selected')}
      return;
    }
    const prev=matchSelected;matchSelected=null;
    const prevBtn=el('mc-'+prev.id),curBtn=el('mc-'+cardId);
    if(curBtn)curBtn.classList.remove('face-down');
    if(prev.group===card.group&&prev.id!==card.id){
      matchMatched.push(card.group);
      [prevBtn,curBtn].forEach(b=>{if(b){b.classList.add('matched');b.classList.remove('selected','face-down');b.disabled=true}});
      const badge=el('match-badge');if(badge)badge.textContent=matchMatched.length+' / '+currentBatch.projects.length+' matched';
      if(matchMatched.length===currentBatch.projects.length){
        setTimeout(()=>{
          const area=el('study-content');if(!area)return;
          const banner=document.createElement('div');
          banner.className='done-banner';
          banner.innerHTML='<div class="done-banner-emoji">🎯</div><div class="done-banner-title">All matched! Perfect!</div><div class="done-banner-sub">You know all developer-project pairs.</div>';
          area.insertBefore(banner,area.firstChild);
          window.scrollTo({top:0,behavior:'smooth'});
        },500);
      }
    } else {
      [prevBtn,curBtn].forEach(b=>{if(b)b.classList.add('wrong-anim')});
      setTimeout(()=>renderMatchGrid(),900);
    }
  }

  /* ═══════════════════════════════════════
     SECTION 5 — FILL IN THE BLANK
     ═══════════════════════════════════════ */
  function renderBlankSection(area){
    blanks=buildBlanks(currentBatch.projects);blankIndex=0;
    area.innerHTML=`
      <button class="btn-back" onclick="goBackToBatches()">← Batch Library</button>
      <div id="blank-area"></div>
    `;
    renderBlankQuestion();
  }

  function renderBlankQuestion(){
    const area=el('blank-area');if(!area)return;
    if(blankIndex>=blanks.length){
      area.innerHTML=`<div class="done-banner" style="margin:0">
        <div class="done-banner-emoji">✏️</div>
        <div class="done-banner-title">All blanks complete!</div>
        <div class="done-banner-sub">${blanks.length} questions completed for ${esc(currentBatch.label)}</div>
      </div>
      <div style="text-align:center;margin-top:20px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <button class="btn-secondary" onclick="blanks=buildBlanks(currentBatch.projects);blankIndex=0;renderBlankQuestion()">🔄 Start Over</button>
        <button class="btn-primary" onclick="switchSection('quiz')">🧠 Take Quiz →</button>
      </div>`;
      return;
    }
    const b=blanks[blankIndex];
    const prog=Math.round((blankIndex/blanks.length)*100);
    area.innerHTML=`
      <div class="blank-shell">
        <div class="blank-head">
          <div class="blank-title">✏️ Fill in the Blank</div>
          <div class="blank-counter">${blankIndex+1} / ${blanks.length}</div>
        </div>
        <div class="pbar" style="margin:0"><div class="pbar-fill" style="width:${prog}%"></div></div>
        <div class="blank-body">
          <div class="blank-prompt">${esc(b.prompt)}</div>
          <div class="blank-iw">
            <input class="blank-input" type="text" id="blank-inp" placeholder="${esc(b.hint)}"
              autocapitalize="off" autocorrect="off" spellcheck="false"
              onkeydown="if(event.key==='Enter')checkBlank()"/>
            <span class="blank-input-hint">${esc(b.hint)}</span>
          </div>
          <div class="blank-result" id="blank-result"></div>
        </div>
        <div class="blank-footer">
          <div></div>
          <button class="btn-primary" id="blank-check-btn" onclick="checkBlank()">✓ Check Answer</button>
        </div>
      </div>
    `;
    setTimeout(()=>{const inp=el('blank-inp');if(inp)inp.focus()},240);
  }

  function checkBlank(){
    const inp=el('blank-inp'),res=el('blank-result');if(!inp||!res)return;
    const val=normStr(inp.value);
    const b=blanks[blankIndex];
    let ok=false;
    if(b.partial){ok=b.answers.some(a=>val.includes(normStr(a).split(' ')[0])||normStr(a).includes(val.split(' ')[0]))}
    else{ok=b.answers.some(a=>normStr(a)===val)}
    res.className='blank-result '+(ok?'ok':'bad');
    res.textContent=ok?'✅ Correct! "'+b.answers[0]+'" is right.':'❌ Not quite. The answer is: "'+b.answers[0]+'"';
    inp.disabled=true;
    const btn=el('blank-check-btn');
    if(btn){
      btn.textContent=blankIndex+1<blanks.length?'Next Question →':'See Summary';
      btn.onclick=()=>{blankIndex++;renderBlankQuestion()};
    }
  }

  /* ═══════════════════════════════════════
     NAVIGATION
     ═══════════════════════════════════════ */
  function goBackToBatches(){
    currentBatch=null;
    const bp=el('batch-pill');if(bp)bp.style.display='none';
    if(el('topbar-mod'))el('topbar-mod').textContent='Batch Library';
    const bn=el('bottom-nav');if(bn)bn.style.display='none';
    renderBatchGrid();
    showScreen('screen-batches');
  }

  /* Keyboard shortcuts */
  document.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT')return;
    if(e.key==='ArrowRight'&&currentSection==='flash')flashNext(1);
    if(e.key==='ArrowLeft'&&currentSection==='flash')flashNext(0);
    if((e.key===' '||e.key==='Enter')&&currentSection==='flash'&&e.target!==document.body){e.preventDefault();flipFlashCard()}
    if(e.key==='Escape')closeScoreModal();
  });

  /* Ensure pill position on load / resize */
  window.addEventListener('resize',()=>{
    if(currentSection)updateNavPill(currentSection);
  });

  </script>
</body>
</html>
'@

Set-Content -Path "j:\Excelias V2\Study Guide & Excersies\index.html" -Value $html -Encoding UTF8
$lines = (Get-Content "j:\Excelias V2\Study Guide & Excersies\index.html").Count
Write-Host "SUCCESS - Study Guide written. Lines: $lines"
