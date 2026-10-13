import type { Lang } from "./types";
import type { ReleaseGroup } from "./releases";
import { RELEASE_FILES, REVOKED_MESSAGE, USED_MESSAGE, esc } from "./shared";

type Gate = "active" | "used" | "revoked";

const CSS = `
:root{
  --shell:#EFEDE8;
  --paper:#F6F4F0;
  --ink:#1C1915;
  --ink-soft:#5E584F;
  --line:rgba(28,25,21,.12);
  --accent:#7B6CF6;
  --accent-deep:#7468B8;
  --sans:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;
  background:
    radial-gradient(900px 420px at 80% -10%,rgba(123,108,246,.16),transparent 60%),
    var(--shell);
  color:var(--ink);
  font:400 17px/1.6 var(--sans);
  -webkit-font-smoothing:antialiased;
}
img{max-width:100%;height:auto}
a{color:inherit}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:8px}
.wrap{width:min(880px,calc(100% - 32px));margin:0 auto}
.top{
  display:flex;align-items:center;justify-content:space-between;
  padding:22px 0 8px;
}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:700;letter-spacing:-.03em;font-size:18px}
.logo i{width:22px;height:22px;border-radius:7px;background:var(--accent-deep);display:block;box-shadow:inset 0 0 0 5px rgba(255,255,255,.18)}
.lang{
  text-decoration:none;font-size:13px;font-weight:600;
  border:1px solid var(--line);border-radius:999px;padding:6px 10px;color:var(--ink-soft);
}
h1{margin:18px 0 8px;font-size:clamp(36px,6vw,56px);letter-spacing:-.045em;line-height:1.02}
.lede{margin:0 0 28px;max-width:38rem;color:var(--ink-soft);font-size:18px}
.kicker{
  margin:0 0 8px;
  font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);
}
.cards{display:grid;gap:14px}
.plat{
  background:var(--paper);
  border:1px solid var(--line);
  border-radius:18px;
  padding:22px;
}
.plat.is-yours{
  border-color:var(--accent);
  box-shadow:0 0 0 3px rgba(123,108,246,.22);
}
.plat-h{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px}
.plat h2{margin:0;font-size:26px;letter-spacing:-.03em}
.yours{
  display:none;
  flex:none;
  font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
  color:#fff;background:var(--accent);border-radius:999px;padding:5px 10px;
}
.plat.is-yours .yours,.badge{display:inline-flex}
.badge{
  font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
  color:#fff;background:var(--accent);border-radius:999px;padding:5px 10px;
}
.file{margin:0 0 12px;color:var(--ink-soft);font-size:14px}
.file code,.steps code,.import code,code{
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:.92em;
  background:#E7E4DE;
  border-radius:6px;
  padding:1px 6px;
}
.steps{margin:0 0 16px;padding-left:1.15em;color:var(--ink-soft)}
.steps li{margin:4px 0}
.actions{display:flex;flex-wrap:wrap;gap:10px}
.btn{
  display:inline-flex;align-items:center;justify-content:center;
  text-decoration:none;font-weight:600;font-size:16px;
  background:#1C1915;color:#fff;border-radius:999px;padding:12px 18px;
  border:1px solid #1C1915;cursor:pointer;font-family:inherit;
}
.plat.is-yours .btn{background:var(--accent-deep);border-color:var(--accent-deep)}
.btn-alt{background:transparent;color:var(--ink);border-color:var(--line)}
.plat.is-yours .btn-alt{background:transparent;color:var(--ink);border-color:var(--accent)}
.btn[disabled]{background:#C9C4BA;color:#5E584F;border-color:transparent;cursor:not-allowed}
.panel{
  margin-top:14px;
  background:var(--paper);
  border:1px solid var(--line);
  border-radius:18px;
  padding:22px;
}
.panel h2{margin:0 0 8px;font-size:26px;letter-spacing:-.03em}
.panel p,.panel li{color:var(--ink-soft)}
.panel ol{margin:8px 0 0;padding-left:1.15em}
.panel li{margin:6px 0}
.support a{font-weight:600;color:var(--ink)}
.foot{margin:28px 0 40px;color:var(--ink-soft);font-size:14px}
.banner{
  margin:0 0 18px;padding:14px 16px;border-radius:14px;
  background:#fff;border:1px solid var(--line);font-weight:600;
}
.files{list-style:none;margin:12px 0 0;padding:0}
.files li{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;padding:8px 0;border-top:1px solid var(--line)}
.files .btn{padding:8px 12px;font-size:14px}
label{display:block;font-size:14px;font-weight:600;margin:12px 0}
input,select{
  display:block;width:100%;margin-top:6px;
  font:400 16px/1.4 var(--sans);padding:10px 12px;border-radius:12px;
  border:1px solid var(--line);background:#fff;color:var(--ink);
}
.form-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px}
table{width:100%;border-collapse:collapse;font-size:14px;margin-top:12px}
th,td{text-align:left;padding:8px 6px;border-bottom:1px solid var(--line);vertical-align:top}
.err{color:#8a2b2b;font-weight:600}
[hidden]{display:none !important}
@media(min-width:840px){
  .cards{grid-template-columns:1fr 1fr}
  .plat.is-yours{grid-column:1 / -1}
}
@media(max-width:520px){
  .btn{width:100%}
  h1{font-size:34px}
}
`;

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%237468B8'/%3E%3Crect x='16' y='28' width='32' height='8' rx='2' fill='%23F4F1EA'/%3E%3C/svg%3E";

const PLATFORM_SCRIPT = `<script>(function(){var ua=navigator.userAgent||"";var platform=navigator.platform||"";var touch=navigator.maxTouchPoints||0;var id="";if(/iPhone|iPad|iPod/i.test(ua)||(platform==="MacIntel"&&touch>1))id="ios";else if(/Android/i.test(ua))id="android";else if(/Windows/i.test(ua))id="windows";else if(/Macintosh|Mac OS X/i.test(ua))id="macos";else if(/Linux/i.test(ua))id="linux";if(!id)return;var card=document.querySelector('[data-platform="'+id+'"]');if(!card)return;card.classList.add("is-yours");var list=card.parentNode;if(list&&list.firstElementChild!==card)list.insertBefore(card,list.firstElementChild);})();</script>`;

type Copy = {
  htmlLang: string;
  title: string;
  description: string;
  switchHref: string;
  switchLabel: string;
  switchHreflang: string;
  switchLang: string;
  kicker: string;
  heading: string;
  lede: string;
  yours: string;
  importKicker: string;
  importTitle: string;
  importHtml: string;
  supportKicker: string;
  supportTitle: string;
  supportHtml: string;
  foot: string;
  platforms: PlatformCopy[];
};

type PlatformCopy = {
  id: string;
  title: string;
  file: string;
  steps: string[];
  button: string;
  zip?: { file: string; note: string; button: string };
};

const EN: Copy = {
  htmlLang: "en",
  title: "Install MineMyLead",
  description: "Install MineMyLead after payment, then import your pack.zip.",
  switchHref: "?lang=pt",
  switchLabel: "PT",
  switchHreflang: "pt-BR",
  switchLang: "pt-BR",
  kicker: "After payment",
  heading: "Install the app.",
  lede: "Thanks for your purchase. Pick your platform below.",
  yours: "This device",
  importKicker: "Your niche pack",
  importTitle: "How to import your pack.zip",
  importHtml: `<ol>
      <li>Keep the <code>pack.zip</code> that arrives for your niche.</li>
      <li>Open MineMyLead and import that file: drag <code>pack.zip</code> onto the window, or choose Import and pick it.</li>
      <li>The leads stay on this device. The app does not upload the pack.</li>
    </ol>`,
  supportKicker: "Support",
  supportTitle: "Same contacts as the site",
  supportHtml: `<p>Email <a href="mailto:support@minemylead.com">support@minemylead.com</a> or <a href="mailto:contact@minemylead.com">contact@minemylead.com</a>.</p>`,
  foot: "One-time pack. No monthly fee. You own the file.",
  platforms: [
    {
      id: "windows",
      title: "Windows",
      file: "MineMyLead-windows-x64-setup.exe",
      steps: [
        "Download the installer and run it.",
        "If SmartScreen appears, choose <b>More info</b>, then <b>Run anyway</b>.",
      ],
      button: "Download for Windows",
      zip: {
        file: "MineMyLead-windows-x64.zip",
        note: "Or download the portable zip <code>MineMyLead-windows-x64.zip</code> and unzip it.",
        button: "Download Windows zip",
      },
    },
    {
      id: "macos",
      title: "macOS",
      file: "MineMyLead-macos.dmg",
      steps: [
        "Download the disk image and open it.",
        "If macOS blocks the app, right-click it and choose <b>Open</b>.",
      ],
      button: "Download for macOS",
    },
    {
      id: "linux",
      title: "Linux",
      file: "MineMyLead-linux-x64.AppImage",
      steps: [
        "Download the AppImage.",
        "Mark it executable: <code>chmod +x MineMyLead-linux-x64.AppImage</code>",
        "Run that file.",
      ],
      button: "Download for Linux",
    },
    {
      id: "android",
      title: "Android",
      file: "MineMyLead-android.apk",
      steps: [
        "Download the APK and open it.",
        "If Android blocks the install, allow unknown apps for this source, then continue.",
      ],
      button: "Download for Android",
    },
    {
      id: "ios",
      title: "iPhone",
      file: "MineMyLead-ios-unsigned.ipa",
      steps: [
        "Download the unsigned IPA on a computer.",
        "Sideload it with AltStore or Sideloadly.",
      ],
      button: "Download for iPhone",
    },
  ],
};

const PT: Copy = {
  htmlLang: "pt-BR",
  title: "Instalar o MineMyLead",
  description: "Instale o MineMyLead depois do pagamento e importe o seu pack.zip.",
  switchHref: "?lang=en",
  switchLabel: "EN",
  switchHreflang: "en",
  switchLang: "en",
  kicker: "Depois do pagamento",
  heading: "Instale o app.",
  lede: "Obrigado pela compra. Escolha a sua plataforma abaixo.",
  yours: "Este aparelho",
  importKicker: "Pacote do nicho",
  importTitle: "Como importar o seu pack.zip",
  importHtml: `<ol>
      <li>Guarde o <code>pack.zip</code> que chega para o seu nicho.</li>
      <li>Abra o MineMyLead e importe esse arquivo: arraste o <code>pack.zip</code> para a janela, ou escolha Importar e selecione o arquivo.</li>
      <li>Os leads ficam neste aparelho. O app não envia o pacote para lugar nenhum.</li>
    </ol>`,
  supportKicker: "Suporte",
  supportTitle: "Os mesmos contatos do site",
  supportHtml: `<p>Escreva para <a href="mailto:support@minemylead.com">support@minemylead.com</a> ou <a href="mailto:contact@minemylead.com">contact@minemylead.com</a>.</p>`,
  foot: "Pacote de pagamento único. Sem mensalidade. O arquivo é seu.",
  platforms: [
    {
      id: "windows",
      title: "Windows",
      file: "MineMyLead-windows-x64-setup.exe",
      steps: [
        "Baixe o instalador e execute.",
        "Se o SmartScreen aparecer, escolha <b>Mais informações</b> e depois <b>Executar assim mesmo</b>.",
      ],
      button: "Baixar para Windows",
      zip: {
        file: "MineMyLead-windows-x64.zip",
        note: "Ou baixe o zip portátil <code>MineMyLead-windows-x64.zip</code> e descompacte.",
        button: "Baixar zip para Windows",
      },
    },
    {
      id: "macos",
      title: "macOS",
      file: "MineMyLead-macos.dmg",
      steps: [
        "Baixe a imagem de disco e abra.",
        "Se o macOS bloquear o app, clique com o botão direito e escolha <b>Abrir</b>.",
      ],
      button: "Baixar para macOS",
    },
    {
      id: "linux",
      title: "Linux",
      file: "MineMyLead-linux-x64.AppImage",
      steps: [
        "Baixe o AppImage.",
        "Marque como executável: <code>chmod +x MineMyLead-linux-x64.AppImage</code>",
        "Rode o arquivo.",
      ],
      button: "Baixar para Linux",
    },
    {
      id: "android",
      title: "Android",
      file: "MineMyLead-android.apk",
      steps: [
        "Baixe o APK e abra.",
        "Se o Android bloquear a instalação, permita apps desconhecidos para esta fonte e continue.",
      ],
      button: "Baixar para Android",
    },
    {
      id: "ios",
      title: "iPhone",
      file: "MineMyLead-ios-unsigned.ipa",
      steps: [
        "Baixe o IPA não assinado num computador.",
        "Instale por sideload com AltStore ou Sideloadly.",
      ],
      button: "Baixar para iPhone",
    },
  ],
};

function copyFor(lang: Lang): Copy {
  return lang === "pt" ? PT : EN;
}

function shell(options: {
  lang: string;
  title: string;
  description: string;
  body: string;
  headExtra?: string;
}): string {
  return `<!doctype html>
<html lang="${esc(options.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light">
<title>${esc(options.title)}</title>
<meta name="description" content="${esc(options.description)}">
<meta name="theme-color" content="#EFEDE8">
<link rel="icon" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
${options.headExtra ?? ""}
</head>
<body>
${options.body}
</body>
</html>`;
}

function button(label: string, href: string | null, alt = false): string {
  const cls = alt ? "btn btn-alt" : "btn";
  if (!href) return `<button class="${cls}" type="button" disabled>${esc(label)}</button>`;
  return `<a class="${cls}" href="${esc(href)}">${esc(label)}</a>`;
}

function fileHref(token: string, filename: string): string {
  return `/d/${encodeURIComponent(token)}/file/${encodeURIComponent(filename)}`;
}

export function clientPage(options: { lang: Lang; token: string; gate: Gate }): string {
  const copy = copyFor(options.lang);
  const open = options.gate === "active";
  const banner =
    options.gate === "used"
      ? USED_MESSAGE
      : options.gate === "revoked"
        ? REVOKED_MESSAGE
        : "";
  const cards = copy.platforms
    .map((platform) => {
      const steps = platform.steps.map((step) => `<li>${step}</li>`).join("");
      const zip = platform.zip
        ? `<p class="file">${platform.zip.note}</p>`
        : "";
      const actions = [
        button(platform.button, open ? fileHref(options.token, platform.file) : null),
        platform.zip
          ? button(platform.zip.button, open ? fileHref(options.token, platform.zip.file) : null, true)
          : "",
      ].join("");
      return `<article class="plat" data-platform="${platform.id}">
      <div class="plat-h"><h2>${esc(platform.title)}</h2><span class="yours">${esc(copy.yours)}</span></div>
      <p class="file"><code>${esc(platform.file)}</code></p>
      <ol class="steps">${steps}</ol>
      ${zip}
      <div class="actions">${actions}</div>
    </article>`;
    })
    .join("");

  const home = options.lang === "pt" ? "https://minemylead.com/pt/" : "https://minemylead.com/";
  const body = `<main class="wrap">
  <div class="top">
    <a class="logo" href="${home}"><i></i>MineMyLead</a>
    <a class="lang" href="${copy.switchHref}" hreflang="${copy.switchHreflang}" lang="${copy.switchLang}" onclick="try{localStorage.setItem('mml_lang','${options.lang === "pt" ? "en" : "pt"}')}catch(e){}">${copy.switchLabel}</a>
  </div>
  <p class="kicker">${esc(copy.kicker)}</p>
  <h1>${esc(copy.heading)}</h1>
  <p class="lede">${esc(copy.lede)}</p>
  ${banner ? `<p class="banner" role="alert">${esc(banner)}</p>` : ""}
  <div class="cards">${cards}</div>
  <section class="panel import" aria-labelledby="import-title">
    <p class="kicker">${esc(copy.importKicker)}</p>
    <h2 id="import-title">${esc(copy.importTitle)}</h2>
    ${copy.importHtml}
  </section>
  <section class="panel support" aria-labelledby="support-title">
    <p class="kicker">${esc(copy.supportKicker)}</p>
    <h2 id="support-title">${esc(copy.supportTitle)}</h2>
    ${copy.supportHtml}
  </section>
  <p class="foot">${esc(copy.foot)}</p>
</main>
${PLATFORM_SCRIPT}`;

  return shell({
    lang: copy.htmlLang,
    title: copy.title,
    description: copy.description,
    headExtra: `<script>(function(){try{var q=new URLSearchParams(location.search).get("lang");if(q==="en"||q==="pt"){localStorage.setItem("mml_lang",q);return;}var p=localStorage.getItem("mml_lang");if(p==="en"||p==="pt")location.replace(location.pathname+"?lang="+p+location.hash);}catch(e){}})();</script>`,
    body,
  });
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function masterPage(options: {
  token: string;
  latest: string | null;
  releases: ReleaseGroup[];
}): string {
  const releases = options.releases
    .map((release) => {
      const badge = release.version === options.latest ? ` <span class="badge">Latest</span>` : "";
      const files = release.files
        .map((file) => {
          const href = `/m/${encodeURIComponent(options.token)}/file/${encodeURIComponent(release.version)}/${encodeURIComponent(file.name)}`;
          return `<li><code>${esc(file.name)}</code><span>${esc(formatBytes(file.size))}</span><a class="btn" href="${esc(href)}">Download</a></li>`;
        })
        .join("");
      return `<section class="panel"><h2>${esc(release.version)}${badge}</h2><ul class="files">${files}</ul></section>`;
    })
    .join("");
  const empty = releases
    ? ""
    : `<section class="panel"><p>No releases in the bucket yet.</p></section>`;
  const pointer = options.latest
    ? `<p class="lede">Latest pointer: <code>${esc(options.latest)}</code>. This master link does not expire.</p>`
    : `<p class="lede">No latest pointer yet. This master link does not expire.</p>`;
  const known = RELEASE_FILES.map((name) => `<code>${esc(name)}</code>`).join(" ");
  const body = `<main class="wrap">
  <div class="top"><a class="logo" href="https://minemylead.com/"><i></i>MineMyLead</a></div>
  <p class="kicker">Master</p>
  <h1>Releases.</h1>
  ${pointer}
  <p class="file">Installer names: ${known}</p>
  ${releases}${empty}
  <p class="foot">Downloads from this page are unlimited.</p>
</main>`;
  return shell({
    lang: "en",
    title: "MineMyLead releases",
    description: "Private master list of MineMyLead installers.",
    body,
  });
}

export function adminPage(): string {
  const body = `<main class="wrap">
  <div class="top"><a class="logo" href="https://minemylead.com/"><i></i>MineMyLead</a></div>
  <p class="kicker">Owner</p>
  <h1>Download links.</h1>
  <p class="lede">Mint a one-time link, copy it, and revoke it when you need to.</p>
  <section class="panel" id="auth-panel">
    <h2>Admin token</h2>
    <p>The token stays in sessionStorage for this tab. It is not sent until you save it.</p>
    <form id="auth-form">
      <label>Token <input id="token" type="password" autocomplete="current-password" required></label>
      <div class="form-actions">
        <button class="btn" type="submit">Save in this tab</button>
        <button class="btn btn-alt" id="clear" type="button">Clear</button>
      </div>
    </form>
    <p id="auth-msg"></p>
  </section>
  <section class="panel" id="mint-panel" hidden>
    <h2>New link</h2>
    <form id="mint-form">
      <label>Email <input name="email" type="email" autocomplete="off"></label>
      <label>Note <input name="note" type="text" maxlength="500" autocomplete="off"></label>
      <label>Language
        <select name="lang">
          <option value="">Auto</option>
          <option value="en">English</option>
          <option value="pt">Portuguese</option>
        </select>
      </label>
      <div class="form-actions"><button class="btn" type="submit">Mint link</button></div>
    </form>
    <div id="minted" hidden>
      <label>URL <input id="minted-url" readonly></label>
      <div class="form-actions"><button class="btn" id="copy" type="button">Copy</button></div>
    </div>
    <p id="mint-msg"></p>
  </section>
  <section class="panel" id="list-panel" hidden>
    <h2>Links</h2>
    <div class="form-actions"><button class="btn btn-alt" id="refresh" type="button">Refresh</button></div>
    <div id="list"></div>
  </section>
</main>
<script>
(function () {
  var KEY = "mml_admin_token";
  var authForm = document.getElementById("auth-form");
  var tokenInput = document.getElementById("token");
  var authMsg = document.getElementById("auth-msg");
  var mintPanel = document.getElementById("mint-panel");
  var listPanel = document.getElementById("list-panel");
  var mintForm = document.getElementById("mint-form");
  var minted = document.getElementById("minted");
  var mintedUrl = document.getElementById("minted-url");
  var mintMsg = document.getElementById("mint-msg");
  var list = document.getElementById("list");

  function token() { return sessionStorage.getItem(KEY) || ""; }
  function showApp(on) {
    mintPanel.hidden = !on;
    listPanel.hidden = !on;
  }
  function say(el, text, bad) {
    el.textContent = text || "";
    el.className = bad ? "err" : "";
  }
  async function api(path, options) {
    var headers = options.headers || {};
    headers.authorization = "Bearer " + token();
    var response = await fetch(path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body
    });
    var data = null;
    try { data = await response.json(); } catch (e) { data = null; }
    return { response: response, data: data };
  }
  function render(links) {
    list.textContent = "";
    if (!links.length) {
      var empty = document.createElement("p");
      empty.textContent = "No links yet.";
      list.appendChild(empty);
      return;
    }
    var table = document.createElement("table");
    var head = document.createElement("tr");
    ["Created", "Email", "Note", "Status", ""].forEach(function (label) {
      var th = document.createElement("th");
      th.textContent = label;
      head.appendChild(th);
    });
    table.appendChild(head);
    links.forEach(function (link) {
      var tr = document.createElement("tr");
      [link.createdAt, link.email || "", link.note || "", statusText(link)].forEach(function (value) {
        var td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
      var action = document.createElement("td");
      var button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-alt";
      button.textContent = link.status === "revoked" ? "Revoked" : "Revoke";
      button.disabled = link.status === "revoked";
      button.addEventListener("click", function () { revoke(link.token); });
      action.appendChild(button);
      var copy = document.createElement("button");
      copy.type = "button";
      copy.className = "btn";
      copy.textContent = "Copy";
      copy.addEventListener("click", function () { copyText(link.url); });
      action.appendChild(copy);
      tr.appendChild(action);
      table.appendChild(tr);
    });
    list.appendChild(table);
  }
  function statusText(link) {
    if (link.status === "revoked") return "Revoked";
    if (link.status === "used") return "Used" + (link.usedFile ? " (" + link.usedFile + ")" : "");
    return "Active";
  }
  async function load() {
    var result = await api("/admin/links", {});
    if (result.response.status === 401) {
      showApp(false);
      say(authMsg, "That token was rejected.", true);
      return;
    }
    if (!result.response.ok) {
      say(authMsg, "Could not load links.", true);
      return;
    }
    say(authMsg, "Token saved in this tab.", false);
    showApp(true);
    render((result.data && result.data.links) || []);
  }
  async function revoke(value) {
    var result = await api("/admin/links/" + encodeURIComponent(value) + "/revoke", { method: "POST" });
    if (result.response.status === 401) {
      showApp(false);
      say(authMsg, "That token was rejected.", true);
      return;
    }
    await load();
  }
  function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).catch(function () {});
      return;
    }
    mintedUrl.value = value;
    mintedUrl.focus();
    mintedUrl.select();
  }
  authForm.addEventListener("submit", function (event) {
    event.preventDefault();
    sessionStorage.setItem(KEY, tokenInput.value.trim());
    tokenInput.value = "";
    load();
  });
  document.getElementById("clear").addEventListener("click", function () {
    sessionStorage.removeItem(KEY);
    showApp(false);
    say(authMsg, "Cleared.", false);
    list.textContent = "";
  });
  document.getElementById("refresh").addEventListener("click", load);
  document.getElementById("copy").addEventListener("click", function () {
    copyText(mintedUrl.value);
  });
  mintForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var form = new FormData(mintForm);
    var payload = {};
    if (form.get("email")) payload.email = form.get("email");
    if (form.get("note")) payload.note = form.get("note");
    if (form.get("lang")) payload.lang = form.get("lang");
    api("/admin/links", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (result) {
      if (result.response.status === 401) {
        showApp(false);
        say(authMsg, "That token was rejected.", true);
        return;
      }
      if (!result.response.ok || !result.data || !result.data.url) {
        say(mintMsg, "Could not mint a link.", true);
        return;
      }
      minted.hidden = false;
      mintedUrl.value = result.data.url;
      say(mintMsg, "Link minted.", false);
      mintForm.reset();
      load();
    });
  });
  if (token()) load();
})();
</script>`;
  return shell({
    lang: "en",
    title: "MineMyLead download links",
    description: "Mint and revoke private MineMyLead download links.",
    body,
  });
}
