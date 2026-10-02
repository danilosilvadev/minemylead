/* MineMyLead Consult preview.
   Scripted replies only. No fetch, no API, no typing.
   Message chrome follows the desktop app: user bubble, "who" label,
   plain scoreboard / draft text, and the neurograph panel. */
(function () {
  var root = document.querySelector("[data-consult]");
  if (!root) return;

  var lang = document.documentElement.lang === "pt-BR" ? "pt" : "en";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var thread = root.querySelector("[data-thread]");
  var emptyEl = root.querySelector("[data-empty]");
  var messagesEl = root.querySelector("[data-messages]");
  var suggestions = root.querySelector("[data-suggestions]");
  var status = root.querySelector("[data-status]");
  var cta = root.querySelector("[data-cta]");
  var sidebar = root.querySelector("[data-sidebar]");
  var convList = root.querySelector("[data-conv-list]");
  var menuBtn = root.querySelector("[data-menu]");
  var modelBtn = root.querySelector("[data-model]");
  var modelMenu = root.querySelector("[data-model-menu]");
  var modelWrap = root.querySelector(".model-wrap");
  var modelNote = root.querySelector("[data-model-note]");
  var settingsEl = root.querySelector("[data-settings]");
  var packInput = root.querySelector("[data-pack-path]");
  var packFine = root.querySelector("[data-pack-fine]");
  var packSource = root.querySelector("[data-pack-source]");
  var saveNote = root.querySelector("[data-save-note]");
  var stubLine = root.querySelector("[data-stub]");
  var graphEl = root.querySelector("[data-graph]");
  var graphStage = root.querySelector("[data-graph-stage]");
  var graphSide = root.querySelector("[data-graph-side]");
  var composer = root.querySelector("[data-composer]");

  var HOSTS = {
    codex: "Codex",
    claude_code: "Claude Code",
    gemini: "Gemini (Antigravity)",
    grok: "Grok",
    cursor_composer: "Cursor Composer"
  };
  var host = "codex";
  var store = { activeId: null, convos: [] };
  var queue = [];
  var busy = false;
  var flight = 0;
  var activeCluster = null;

  var NODES = [
    { id: "ada", label: "Ada", tier: "A" },
    { id: "marco", label: "Marco", tier: "A" },
    { id: "priya", label: "Priya", tier: "A" },
    { id: "lena", label: "Lena", tier: "A" },
    { id: "theo", label: "Theo", tier: "B" },
    { id: "samir", label: "Samir", tier: "B" },
    { id: "jonah", label: "Jonah", tier: "B" },
    { id: "riley", label: "Riley", tier: "C" },
    { id: "hana", label: "Hana", tier: "C" },
    { id: "chris", label: "Chris", tier: "C" }
  ];
  var EDGES = [
    { source: "ada", target: "priya", reason: "manual" },
    { source: "ada", target: "lena", reason: "manual" },
    { source: "priya", target: "lena", reason: "manual" },
    { source: "marco", target: "samir", reason: "sheet" },
    { source: "marco", target: "jonah", reason: "sheet" },
    { source: "samir", target: "jonah", reason: "sheet" },
    { source: "ada", target: "marco", reason: "bothA" },
    { source: "theo", target: "marco", reason: "budget" },
    { source: "theo", target: "ada", reason: "between" }
  ];

  var COPY = {
    en: {
      copy: "Copy",
      copied: "Copied",
      selectDraft: "Select the draft",
      download: "Download free sample",
      pricing: "Pack pricing",
      ui: {
        fallbackTitle: "New chat",
        deleteConv: "Delete conversation",
        noteCli: "{label} CLI not on PATH — pack skills still answer",
        stubCli: "{label} CLI was not found on PATH. Pack skills still answer.",
        saved: "Saved on this machine.",
        quit: "This preview stays on the page.",
        noPack: "No pack selected.",
        sourceFixture: "Using a fixture path.",
        sourceUnset: "No pack is selected.",
        graphHead: "{people} leads · {edges} edges. A click lists the cluster and its draft hook.",
        draftHook: "Draft hook: ",
        noHook: "No opening line is stored for this cluster.",
        draftFrom: "Draft from this hook",
        whyTitle: "MineMyLead — why them",
        clusterWord: "Cluster: ",
        peopleWord: "People: ",
        edgesNote: "Edges are shared stored fields. Nothing was sent."
      },
      edgeReasons: {
        manual: "Shared public pain: weekly manual hours",
        sheet: "Shared public pain: replacing a spreadsheet",
        bothA: "Both grade A in the sample",
        budget: "Budget language, thinner pain",
        between: "Sits between the two clusters"
      },
      clusters: [
        { id: "manual-hours", labels: ["Ada", "Priya", "Lena"], lead_ids: ["ada", "priya", "lena"], draft_hook: "We spend hours every week doing this by hand." },
        { id: "spreadsheet", labels: ["Marco", "Samir", "Jonah"], lead_ids: ["marco", "samir", "jonah"], draft_hook: "Looking to replace our spreadsheet process before we hire." },
        { id: "between", labels: ["Theo"], lead_ids: ["theo"], draft_hook: "Budget is approved, just need to pick one." }
      ],
      scoreboard: {
        prompt: "Show the pipeline scoreboard",
        status: "Pipeline scoreboard ready. Sample pack: 4 A, 3 B, 3 C. None contacted. Download free sample is below the thread.",
        text: "Pipeline scoreboard (10 people, counted from the pack).\nTiers: A 4, B 3, C 3, D 0, unscored 0.\nWith a stored quote: 10.\nA-tier and not contacted: 4.\nOutbound from this app: none."
      },
      neuro: {
        prompt: "Show the neurograph",
        status: "Neurograph ready. Two clusters in the 10-lead sample. Download free sample is below the thread.",
        lead: "Neurograph: 10 leads, 9 edges. Each edge names a shared stored field. Open the Neurograph panel for the picture.",
        body: "Leads in this sample cluster by the pain they described in public. Proximity is shared language, not a private social graph.",
        detail: "Left: Ada, Priya, and Lena — hours every week, done by hand. Right: Marco, Samir, and Jonah — replacing a spreadsheet before a hire. Theo sits between the clusters: budget approved, thinner pain language."
      },
      drafts: {
        prompt: "Draft outreach for Ada",
        status: "Three unsent DM variants for Ada are on screen. Nothing was sent. Download free sample is below the thread.",
        lead: "Draft variants for Ada Okonkwo. Not sent — copy one and send it yourself.",
        body: "Three DM variants for Ada Okonkwo, Head of Support, score 91. All unsent. Consult does not deliver them. You paste the one you want.",
        variants: [
          ["1 · Direct", "Ada — you wrote that the team spends hours every week doing this by hand. That sentence is the whole brief. If it is still true, I can send four lines on how support leads in the same spot cut the manual pass. You can ignore this."],
          ["2 · Question", "Ada, still the weekly manual pass, or did a tool stick? I read the public thread. I am not guessing from a title. If it is open, I will reply with only what matches that post."],
          ["3 · Quote back", "“We spend hours every week doing this by hand.” Ada, I am quoting you so this is not a template. The draft stops here. Nothing sends unless you paste it."]
        ]
      },
      icp: {
        prompt: "Why does Ada fit our ICP?",
        status: "ICP fit for Ada is 91, grade A. Reasons sum to the score. Download free sample is below the thread.",
        body: "Ada scores 91, grade A, against the sample buyer. The points below are the whole reason. They sum to the score.",
        who: "Head of Support · grade A · forum thread",
        quote: "“We spend hours every week doing this by hand. Is there anything that just handles it?”",
        source: "Source on the lead: forum thread · sample",
        reasons: [
          ["Pain, in their words", 33, 35, "Named the weekly manual hours in public."],
          ["Usage intensity", 12, 15, "A repeating team workflow, not a one-off."],
          ["Fit with your offer", 14, 15, "The offer replaces that manual pass."],
          ["Buyer profile", 13, 15, "Head of Support. Owns the queue."],
          ["Recency", 9, 10, "Sample stamp: 6 days ago."],
          ["Reachability", 10, 10, "Public profile link is on the lead."]
        ]
      },
      upgrade: {
        prompt: "What do I get in the full pack?",
        status: "Full pack tease ready. Sample stays 10 leads. Full niche pack is $199 once. Download free sample is below the thread.",
        lead: "This feature needs the paid SQLite pack.",
        body: "This screen is the free sample. The full niche pack is a larger SQLite file of the same kind of lead. Chat still only reads the file you have. It does not mine, and it does not send.",
        sampleTitle: "On this screen",
        samplePrice: "Free",
        sampleUnit: "with the app",
        samplePoints: ["10 sample leads", "4 A · 3 B · 3 C", "One illustrative niche", "Consult on your machine"],
        fullTitle: "Full niche pack",
        fullPrice: "$199",
        fullUnit: "once",
        fullPoints: ["About 100 A–C leads", "Quote, source, score, contact", "Drafts you consult in the app", "SQLite file you keep"],
        after: "Another niche, or a refresh, is another pack at the same price."
      }
    },
    pt: {
      copy: "Copiar",
      copied: "Copiado",
      selectDraft: "Selecione o rascunho",
      download: "Baixar amostra grátis",
      pricing: "Preço do pacote",
      ui: {
        fallbackTitle: "Nova conversa",
        deleteConv: "Apagar conversa",
        noteCli: "{label} CLI não está no PATH — as habilidades do pacote ainda respondem",
        stubCli: "O CLI do {label} não foi encontrado no PATH. As habilidades do pacote ainda respondem.",
        saved: "Salvo nesta máquina.",
        quit: "Esta prévia continua nesta página.",
        noPack: "Nenhum pacote selecionado.",
        sourceFixture: "Usando um caminho de amostra.",
        sourceUnset: "Nenhum pacote selecionado.",
        graphHead: "{people} leads · {edges} arestas. Um clique lista o grupo e o gancho do rascunho.",
        draftHook: "Gancho: ",
        noHook: "Não há frase de abertura para este grupo.",
        draftFrom: "Rascunho a partir deste gancho",
        whyTitle: "MineMyLead — por que eles",
        clusterWord: "Grupo: ",
        peopleWord: "Pessoas: ",
        edgesNote: "As arestas são campos guardados em comum. Nada foi enviado."
      },
      edgeReasons: {
        manual: "Dor pública em comum: horas manuais da semana",
        sheet: "Dor pública em comum: trocar a planilha",
        bothA: "Os dois são nota A na amostra",
        budget: "Linguagem de orçamento, dor mais fina",
        between: "Fica entre os dois grupos"
      },
      clusters: [
        { id: "manual-hours", labels: ["Ada", "Priya", "Lena"], lead_ids: ["ada", "priya", "lena"], draft_hook: "Gastamos horas toda semana fazendo isso na mão." },
        { id: "spreadsheet", labels: ["Marco", "Samir", "Jonah"], lead_ids: ["marco", "samir", "jonah"], draft_hook: "Trocar a planilha antes de contratar." },
        { id: "between", labels: ["Theo"], lead_ids: ["theo"], draft_hook: "Orçamento aprovado, linguagem de dor mais fina." }
      ],
      scoreboard: {
        prompt: "Mostra o placar do pipeline desta amostra.",
        status: "Placar pronto. Amostra: 4 A, 3 B, 3 C. Ninguém contatado. Baixar amostra grátis está abaixo da conversa.",
        text: "Placar do pipeline (10 pessoas, contadas do pacote).\nNotas: A 4, B 3, C 3, D 0, sem nota 0.\nCom citação guardada: 10.\nNota A e sem contato: 4.\nSaída deste app: nenhuma."
      },
      neuro: {
        prompt: "Mostra o neurografo desta amostra.",
        status: "Neurografo pronto. Dois grupos na amostra de 10 leads. Baixar amostra grátis está abaixo da conversa.",
        lead: "Neurografo: 10 leads, 9 arestas. Cada aresta nomeia um campo guardado em comum. Abra o painel do neurografo para ver o desenho.",
        body: "Os leads desta amostra se agrupam pela dor que descreveram em público. Proximidade é linguagem em comum, não um grafo social privado.",
        detail: "À esquerda: Ada, Priya e Lena — horas toda semana, na mão. À direita: Marco, Samir e Jonah — trocar a planilha antes de contratar. Theo fica entre os grupos: orçamento aprovado, linguagem de dor mais fina."
      },
      drafts: {
        prompt: "Redige a abordagem para a Ada. Não envie.",
        status: "Três variantes de DM sem envio para a Ada estão na tela. Nada foi enviado. Baixar amostra grátis está abaixo da conversa.",
        lead: "Variantes de rascunho para Ada Okonkwo. Sem envio — copie uma e envie você.",
        body: "Três variantes de DM para Ada Okonkwo, Head de Suporte, nota 91. Todas sem envio. O Consult não entrega. Você cola a que quiser.",
        variants: [
          ["1 · Direta", "Ada — você escreveu que o time gasta horas toda semana fazendo isso na mão. Essa frase é o briefing inteiro. Se ainda for verdade, mando quatro linhas de como líderes de suporte no mesmo ponto cortaram o trabalho manual. Pode ignorar."],
          ["2 · Pergunta", "Ada, o passe manual da semana ainda está aí, ou alguma ferramenta ficou? Li o tópico público. Não estou chutando pelo cargo. Se ainda estiver aberto, respondo só com o que combina com aquele post."],
          ["3 · Citação", "“Gastamos horas toda semana fazendo isso na mão.” Ada, estou citando você para isto não ser um modelo genérico. O rascunho para aqui. Nada sai se você não colar."]
        ]
      },
      icp: {
        prompt: "Por que a Ada encaixa no nosso ICP?",
        status: "Aderência da Ada: 91, nota A. Os motivos somam a nota. Baixar amostra grátis está abaixo da conversa.",
        body: "Ada tira 91, nota A, contra o comprador da amostra. Os pontos abaixo são o motivo inteiro. A soma é a nota.",
        who: "Head de Suporte · nota A · tópico de fórum",
        quote: "“Gastamos horas toda semana fazendo isso na mão. Existe algo que resolva isso sozinho?”",
        source: "Fonte no lead: tópico de fórum · amostra",
        reasons: [
          ["Dor, nas palavras dela", 33, 35, "Citou as horas manuais da semana, em público."],
          ["Intensidade de uso", 12, 15, "Um fluxo do time que se repete, não um caso isolado."],
          ["Aderência à oferta", 14, 15, "A oferta substitui esse passe manual."],
          ["Perfil de comprador", 13, 15, "Head de Suporte. Dona da fila."],
          ["Recência", 9, 10, "Carimbo da amostra: há 6 dias."],
          ["Alcançabilidade", 10, 10, "O link do perfil público está no lead."]
        ]
      },
      upgrade: {
        prompt: "O que vem no pacote completo?",
        status: "Prévia do pacote completo pronta. A amostra continua com 10 leads. O pacote do nicho é R$ 990, uma vez. Baixar amostra grátis está abaixo da conversa.",
        lead: "Este recurso precisa do pacote SQLite pago.",
        body: "Esta tela é a amostra grátis. O pacote completo do nicho é um arquivo SQLite maior, com o mesmo tipo de lead. O chat continua só lendo o arquivo que você tem. Ele não minera e não envia.",
        sampleTitle: "Nesta tela",
        samplePrice: "Grátis",
        sampleUnit: "com o app",
        samplePoints: ["10 leads de amostra", "4 A · 3 B · 3 C", "Um nicho ilustrativo", "Consulta na sua máquina"],
        fullTitle: "Pacote do nicho",
        fullPrice: "R$ 990",
        fullUnit: "uma vez",
        fullPoints: ["Cerca de 100 leads A–C", "Citação, fonte, nota e contato", "Rascunhos para consultar no app", "Arquivo SQLite que você guarda"],
        after: "Outro nicho, ou uma atualização, é outro pacote pelo mesmo preço."
      }
    }
  };

  var T = COPY[lang];
  var CATALOG = [
    { id: "scoreboard", key: "scoreboard" },
    { id: "neurograph", key: "neuro" },
    { id: "drafts", key: "drafts" },
    { id: "icp", key: "icp" },
    { id: "upgrade", key: "upgrade" }
  ];
  var KEY = { scoreboard: "scoreboard", neurograph: "neuro", drafts: "drafts", icp: "icp", upgrade: "upgrade" };

  function el(tag, attrs) {
    var node = document.createElement(tag);
    var children = Array.prototype.slice.call(arguments, 2);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "class") node.className = attrs[key];
        else if (key === "text") node.textContent = attrs[key];
        else node.setAttribute(key, attrs[key]);
      });
    }
    children.forEach(function (child) {
      if (child == null || child === false) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  function fill(template, map) {
    return String(template).replace(/\{(\w+)\}/g, function (_, key) {
      return map[key] == null ? "" : String(map[key]);
    });
  }

  function active() {
    for (var i = 0; i < store.convos.length; i++) {
      if (store.convos[i].id === store.activeId) return store.convos[i];
    }
    return null;
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("open");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
  }

  function closeMenu() {
    if (!modelMenu) return;
    modelMenu.hidden = true;
    if (modelBtn) modelBtn.setAttribute("aria-expanded", "false");
  }

  function closeSettings() {
    if (settingsEl) settingsEl.hidden = true;
  }

  function openSettings() {
    closeMenu();
    closeSidebar();
    if (settingsEl) settingsEl.hidden = false;
  }

  function closeGraph() {
    if (graphEl) graphEl.hidden = true;
  }

  function applyHost() {
    var label = HOSTS[host] || "Codex";
    if (modelBtn) modelBtn.textContent = label;
    if (modelNote) modelNote.textContent = fill(T.ui.noteCli, { label: label });
    if (stubLine) stubLine.textContent = fill(T.ui.stubCli, { label: label });
    Array.prototype.forEach.call(root.querySelectorAll("[data-host]"), function (node) {
      node.setAttribute("aria-checked", node.getAttribute("data-host") === host ? "true" : "false");
    });
  }

  function specFor(id) {
    return T[KEY[id]];
  }

  function assistant(content) {
    var who = el("div", { class: "who", text: HOSTS[host] || "MineMyLead" });
    var body = el("div", { class: "body" });
    if (typeof content === "string") body.textContent = content;
    else body.appendChild(content);
    return el("div", { class: "msg assistant" }, who, body);
  }

  function icpText() {
    var c = T.icp;
    var lines = [c.body, "", c.who, c.quote, c.source, ""];
    c.reasons.forEach(function (reason) {
      lines.push(reason[0] + " — " + reason[1] + "/" + reason[2]);
      lines.push(reason[3]);
      lines.push("");
    });
    return lines.join("\n").trim();
  }

  function draftsBody() {
    var c = T.drafts;
    var box = el("div");
    box.appendChild(document.createTextNode(c.lead + "\n\n" + c.body));
    c.variants.forEach(function (variant, index) {
      var copyBtn = el("button", {
        type: "button",
        class: "quiet",
        "data-copy": "1",
        "data-label": T.copy,
        text: T.copy
      });
      copyBtn.setAttribute("aria-label", T.copy + " · " + variant[0]);
      box.appendChild(el("div", { class: "variant" },
        el("div", { class: "variant-top" },
          el("strong", { text: variant[0] }),
          copyBtn
        ),
        el("p", { "data-draft-body": String(index + 1), text: variant[1] })
      ));
    });
    return box;
  }

  function upgradeBody() {
    var c = T.upgrade;
    var lines = [
      c.lead,
      "",
      c.body,
      "",
      c.sampleTitle + " — " + c.samplePrice + " " + c.sampleUnit,
      c.samplePoints.map(function (point) { return "• " + point; }).join("\n"),
      "",
      c.fullTitle + " — " + c.fullPrice + " " + c.fullUnit,
      c.fullPoints.map(function (point) { return "• " + point; }).join("\n"),
      "",
      c.after
    ];
    return el("div", {},
      document.createTextNode(lines.join("\n")),
      el("div", { class: "msg-links" },
        el("a", { class: "primary", href: "#download", text: T.download }),
        el("a", { class: "quiet", href: "#pricing", text: T.pricing })
      )
    );
  }

  function neuroText() {
    var c = T.neuro;
    return c.lead + "\n\n" + c.body + "\n\n" + c.detail;
  }

  function messageNode(message) {
    if (message.role === "user") return el("div", { class: "msg user", text: message.text });
    if (message.kind === "scoreboard") return assistant(T.scoreboard.text);
    if (message.kind === "neurograph") return assistant(neuroText());
    if (message.kind === "drafts") return assistant(draftsBody());
    if (message.kind === "icp") return assistant(icpText());
    if (message.kind === "upgrade") return assistant(upgradeBody());
    return assistant(message.text || "");
  }

  function holdPage(fn) {
    var x = window.scrollX;
    var y = window.scrollY;
    fn();
    function restore() { window.scrollTo(x, y); }
    restore();
    window.requestAnimationFrame(restore);
    window.setTimeout(restore, 0);
  }

  function renderThread() {
    var conv = active();
    var msgs = conv ? conv.messages : [];
    holdPage(function () {
    messagesEl.replaceChildren();
    if (!msgs.length) {
      emptyEl.hidden = false;
      messagesEl.hidden = true;
      return;
    }
    emptyEl.hidden = true;
    messagesEl.hidden = false;
    msgs.forEach(function (message) {
      messagesEl.appendChild(messageNode(message));
    });
    thread.scrollTop = thread.scrollHeight;
    });
  }

  function renderConvs() {
    convList.replaceChildren();
    store.convos.forEach(function (conv) {
      var open = el("button", { type: "button", class: "conv-open" },
        el("span", { text: conv.title || T.ui.fallbackTitle })
      );
      var remove = el("button", {
        type: "button",
        class: "x",
        "aria-label": T.ui.deleteConv,
        text: "×"
      });
      var row = el("div", { class: "conv" + (conv.id === store.activeId ? " active" : "") }, open, remove);
      open.addEventListener("click", function () {
        store.activeId = conv.id;
        closeSidebar();
        closeGraph();
        renderConvs();
        renderThread();
        renderSuggestions();
      });
      remove.addEventListener("click", function (ev) {
        ev.stopPropagation();
        store.convos = store.convos.filter(function (item) { return item.id !== conv.id; });
        if (store.activeId === conv.id) store.activeId = store.convos[0] ? store.convos[0].id : null;
        closeGraph();
        renderConvs();
        renderThread();
        renderSuggestions();
      });
      convList.appendChild(row);
    });
  }

  function chipSet() {
    var conv = active();
    var used = conv && conv.used ? conv.used : [];
    var fresh = CATALOG.filter(function (item) { return used.indexOf(item.id) < 0; });
    var rest = CATALOG.filter(function (item) { return used.indexOf(item.id) >= 0; });
    return fresh.concat(rest).slice(0, 3);
  }

  function renderSuggestions() {
    suggestions.replaceChildren();
    chipSet().forEach(function (item) {
      var spec = specFor(item.id);
      var button = el("button", { type: "button", "data-demo": item.id, text: spec.prompt });
      if (busy) button.disabled = true;
      suggestions.appendChild(button);
    });
  }

  function showCta() {
    if (!cta || !cta.hasAttribute("hidden")) return;
    cta.removeAttribute("hidden");
  }

  function typingNode() {
    return assistant(el("div", { class: "typing", "aria-hidden": "true" }, el("i"), el("i"), el("i")));
  }

  function enqueue(id) {
    if (!KEY[id] || queue.length > 6) return;
    queue.push(id);
    drain();
  }

  function drain() {
    if (busy || !queue.length) return;
    var id = queue.shift();
    busy = true;
    renderSuggestions();
    var spec = specFor(id);
    var mine = ++flight;
    if (!active()) {
      var created = "c" + Date.now();
      store.convos.unshift({ id: created, title: spec.prompt.slice(0, 42), messages: [], used: [] });
      store.activeId = created;
    }
    var conv = active();
    if (!conv.messages.length) conv.title = spec.prompt.slice(0, 42);
    conv.messages.push({ role: "user", text: spec.prompt });
    closeSidebar();
    if (id !== "neurograph") closeGraph();
    renderConvs();
    renderThread();
    var pending = typingNode();
    messagesEl.appendChild(pending);
    thread.scrollTop = thread.scrollHeight;
    if (status) status.textContent = lang === "pt" ? "Lendo o pacote de amostra…" : "Reading the sample pack…";
    window.setTimeout(function () {
      if (pending.parentNode) pending.parentNode.removeChild(pending);
      conv.messages.push({ role: "assistant", kind: id });
      if (conv.used.indexOf(id) < 0) conv.used.push(id);
      if (mine === flight || active() === conv) {
        if (active() === conv) {
          renderThread();
          if (id === "neurograph") openGraph();
        }
      }
      renderConvs();
      busy = false;
      renderSuggestions();
      showCta();
      if (status) status.textContent = spec.status;
      drain();
    }, reduce ? 0 : 680);
  }

  function tierRadius(tier) {
    if (tier === "A") return 90;
    if (tier === "B") return 150;
    if (tier === "C") return 210;
    return 260;
  }

  function angleOf(id) {
    var hash = 0;
    for (var i = 0; i < id.length; i++) hash = (hash * 33 + id.charCodeAt(i)) >>> 0;
    return (hash % 360) * Math.PI / 180;
  }

  function tierColor(tier) {
    if (tier === "A") return "#f2d27a";
    if (tier === "B") return "#9ecbff";
    if (tier === "C") return "#b7e3c2";
    return "#c8c8c8";
  }

  function showCluster(cluster) {
    activeCluster = cluster;
    Array.prototype.forEach.call(graphSide.querySelectorAll(".cluster"), function (node) {
      node.classList.toggle("active", node.textContent.indexOf(cluster.id) === 0);
    });
    var box = graphSide.querySelector("#cluster-detail");
    if (!box) {
      box = el("div", { id: "cluster-detail" });
      graphSide.appendChild(box);
    }
    box.replaceChildren();
    box.appendChild(el("strong", { text: cluster.id }));
    box.appendChild(el("p", { text: (cluster.labels || cluster.lead_ids || []).join(", ") }));
    box.appendChild(el("p", {
      text: cluster.draft_hook ? (T.ui.draftHook + cluster.draft_hook) : T.ui.noHook
    }));
    var go = el("button", { type: "button", class: "primary", text: T.ui.draftFrom });
    go.addEventListener("click", function () {
      closeGraph();
      enqueue("drafts");
    });
    box.appendChild(go);
  }

  function openGraph() {
    if (!graphEl) return;
    graphEl.hidden = false;
    closeSidebar();
    var cx = 360;
    var cy = 320;
    var pos = {};
    NODES.forEach(function (node) {
      var angle = angleOf(node.id);
      var radius = tierRadius(node.tier);
      pos[node.id] = { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius, n: node };
    });
    var svg = svgEl("svg", { class: "neuro", viewBox: "0 0 720 640", role: "img" });
    svg.setAttribute("aria-label", T.neuro.lead);
    [[90, "A"], [150, "B"], [210, "C"], [260, "D"]].forEach(function (ring) {
      svg.appendChild(svgEl("circle", {
        cx: cx, cy: cy, r: ring[0], fill: "none", stroke: "rgba(255,255,255,.12)"
      }));
      var label = svgEl("text", { x: cx + 6, y: cy - ring[0] + 12, fill: "#b4b4b4", "font-size": "11" });
      label.textContent = ring[1];
      svg.appendChild(label);
    });
    EDGES.forEach(function (edge) {
      var a = pos[edge.source];
      var b = pos[edge.target];
      if (!a || !b) return;
      var line = svgEl("line", {
        x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: "rgba(255,255,255,.35)"
      });
      var title = svgEl("title");
      title.textContent = T.edgeReasons[edge.reason] || "";
      line.appendChild(title);
      svg.appendChild(line);
    });
    NODES.forEach(function (node) {
      var point = pos[node.id];
      var dot = svgEl("circle", {
        cx: point.x, cy: point.y, r: "7", fill: tierColor(node.tier)
      });
      var title = svgEl("title");
      title.textContent = node.label + " · tier " + node.tier;
      dot.appendChild(title);
      svg.appendChild(dot);
      var label = svgEl("text", {
        x: point.x + 9, y: point.y + 4, fill: "#ececec", "font-size": "11"
      });
      label.textContent = node.label;
      svg.appendChild(label);
    });
    graphStage.replaceChildren(svg);
    graphSide.replaceChildren();
    graphSide.appendChild(el("p", {
      class: "product-note",
      text: fill(T.ui.graphHead, { people: NODES.length, edges: EDGES.length })
    }));
    T.clusters.forEach(function (cluster) {
      var button = el("button", {
        type: "button",
        class: "cluster",
        text: cluster.id + " (" + cluster.lead_ids.length + ")"
      });
      button.addEventListener("click", function () { showCluster(cluster); });
      graphSide.appendChild(button);
    });
    if (T.clusters[0]) showCluster(T.clusters[0]);
  }

  function showWhy() {
    var lines = [T.ui.whyTitle, ""];
    if (activeCluster) {
      lines.push(T.ui.clusterWord + activeCluster.id);
      lines.push(T.ui.peopleWord + (activeCluster.labels || []).join(", "));
      lines.push(T.ui.draftHook + (activeCluster.draft_hook || ""));
      lines.push("");
    }
    EDGES.forEach(function (edge) {
      lines.push(edge.source + " — " + edge.target + ": " + (T.edgeReasons[edge.reason] || ""));
    });
    lines.push("");
    lines.push(T.ui.edgesNote);
    var box = graphSide.querySelector(".why");
    if (!box) {
      box = el("p", { class: "why" });
      graphSide.appendChild(box);
    }
    box.textContent = lines.join("\n");
  }

  suggestions.addEventListener("click", function (event) {
    var button = event.target.closest ? event.target.closest("[data-demo]") : null;
    if (!button || !suggestions.contains(button) || button.disabled) return;
    enqueue(button.getAttribute("data-demo"));
  });

  messagesEl.addEventListener("click", function (event) {
    var button = event.target.closest ? event.target.closest("[data-copy]") : null;
    if (!button || !messagesEl.contains(button)) return;
    var card = button.closest(".variant");
    var body = card && card.querySelector("[data-draft-body]");
    if (!body) return;
    var text = body.textContent;
    var label = button.getAttribute("data-label") || T.copy;
    button.classList.add("is-copied");
    button.textContent = T.copied;
    window.setTimeout(function () {
      button.classList.remove("is-copied");
      button.textContent = label;
    }, 2200);
    function selectFallback() {
      var range = document.createRange();
      range.selectNodeContents(body);
      var sel = window.getSelection();
      if (!sel) return;
      sel.removeAllRanges();
      sel.addRange(range);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {}, selectFallback);
    } else {
      selectFallback();
    }
  });

  root.querySelector("[data-new-chat]").addEventListener("click", function () {
    store.activeId = null;
    closeSidebar();
    closeGraph();
    renderConvs();
    renderThread();
    renderSuggestions();
  });
  root.querySelector("[data-open-graph]").addEventListener("click", openGraph);
  root.querySelector("[data-close-graph]").addEventListener("click", closeGraph);
  root.querySelector("[data-why]").addEventListener("click", showWhy);
  root.querySelector("[data-open-settings]").addEventListener("click", openSettings);
  root.querySelector("[data-menu-settings]").addEventListener("click", openSettings);
  root.querySelector("[data-close-settings]").addEventListener("click", closeSettings);
  root.querySelector("[data-save-settings]").addEventListener("click", function () {
    var path = packInput.value.trim();
    if (packFine) packFine.textContent = path || T.ui.noPack;
    if (packSource) packSource.textContent = path ? T.ui.sourceFixture : T.ui.sourceUnset;
    if (saveNote) saveNote.textContent = T.ui.saved;
  });
  root.querySelector("[data-quit]").addEventListener("click", function () {
    if (saveNote) saveNote.textContent = T.ui.quit;
  });
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      var open = sidebar.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  if (modelBtn) {
    modelBtn.addEventListener("click", function () {
      modelMenu.hidden = !modelMenu.hidden;
      modelBtn.setAttribute("aria-expanded", modelMenu.hidden ? "false" : "true");
    });
  }
  Array.prototype.forEach.call(root.querySelectorAll(".menu-item[data-host]"), function (button) {
    button.addEventListener("click", function () {
      host = button.getAttribute("data-host");
      applyHost();
      closeMenu();
      renderThread();
    });
  });
  Array.prototype.forEach.call(root.querySelectorAll(".host-choice"), function (button) {
    button.addEventListener("click", function () {
      host = button.getAttribute("data-host");
      applyHost();
    });
  });
  if (composer) composer.addEventListener("submit", function (event) { event.preventDefault(); });
  if (settingsEl) {
    settingsEl.addEventListener("click", function (event) {
      if (event.target === settingsEl) closeSettings();
    });
  }
  root.addEventListener("click", function (event) {
    if (modelWrap && !modelWrap.contains(event.target)) closeMenu();
  });
  root.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    closeSettings();
    closeMenu();
    closeSidebar();
    closeGraph();
  });

  applyHost();
  renderConvs();
  renderThread();
  renderSuggestions();
})();
