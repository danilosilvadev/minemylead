/* MineMyLead Consult preview.
   Scripted replies only. No fetch, no API, no typing. */
(function () {
  var root = document.querySelector("[data-consult]");
  if (!root) return;

  var lang = document.documentElement.lang === "pt-BR" ? "pt" : "en";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var thread = root.querySelector("[data-thread]");
  var status = root.querySelector("[data-status]");
  var cta = root.querySelector("[data-cta]");
  var composer = root.querySelector("[data-composer]");
  var composerText = root.querySelector("[data-composer-text]");
  var chips = root.querySelectorAll("[data-demo]");
  var queue = [];
  var busy = false;
  var seq = 0;

  var LEADS = {
    en: [
      ["A", "Ada Okonkwo", "Head of Support", 91],
      ["A", "Marco Velez", "Founder", 86],
      ["A", "Priya Shah", "Operations lead", 84],
      ["A", "Lena Cho", "Support manager", 81],
      ["B", "Theo Nguyen", "CTO", 78],
      ["B", "Samir Patel", "RevOps", 74],
      ["B", "Jonah Ellis", "Founder", 71],
      ["C", "Riley Brooks", "CS lead", 66],
      ["C", "Hana Ito", "Ops coordinator", 63],
      ["C", "Chris Alvarez", "Team lead", 61]
    ],
    pt: [
      ["A", "Ada Okonkwo", "Head de Suporte", 91],
      ["A", "Marco Velez", "Fundador", 86],
      ["A", "Priya Shah", "Líder de operações", 84],
      ["A", "Lena Cho", "Gerente de suporte", 81],
      ["B", "Theo Nguyen", "CTO", 78],
      ["B", "Samir Patel", "RevOps", 74],
      ["B", "Jonah Ellis", "Fundador", 71],
      ["C", "Riley Brooks", "Líder de CS", 66],
      ["C", "Hana Ito", "Coordenação de ops", 63],
      ["C", "Chris Alvarez", "Líder de time", 61]
    ]
  };

  var COPY = {
    en: {
      typingOff: "Typing is off",
      reading: "Reading the sample pack",
      copied: "Copied",
      copy: "Copy",
      unsent: "UNSENT",
      selectDraft: "Select the draft",
      download: "Download free sample",
      pricing: "Pack pricing",
      graphLabel: "Similarity constellation for the sample pack. Ada, Priya, and Lena cluster on manual weekly work. Marco, Samir, and Jonah cluster on replacing a spreadsheet. Theo sits between them: budget approved, less pain language.",
      legendA: "A lead",
      legendB: "B lead",
      legendLine: "Shared public pain",
      pan: "On a narrow screen, scroll the graph sideways. The clusters are also described above.",
      scoreboard: {
        prompt: "Show the pipeline scoreboard for this sample pack.",
        status: "Pipeline scoreboard ready. Sample pack: 4 A, 3 B, 3 C. None contacted. Download free sample is below the thread.",
        title: "Pipeline scoreboard",
        body: "Sample pack on this machine: 10 leads, graded A to C. None of them have been contacted. Drafts stay unsent until you paste them yourself.",
        meta: "Contacted 0 · Unsent drafts ready for Ada",
        tiles: [
          ["A", "4", "Ready to draft"],
          ["B", "3", "Strong fit"],
          ["C", "3", "Worth a look"]
        ],
        headers: ["Grade", "Lead", "Role", "Score"],
        caption: "10 illustrative sample leads. Not a live search."
      },
      neuro: {
        prompt: "Show the neurograph for this sample.",
        status: "Neurograph ready. Two clusters in the 10-lead sample. Download free sample is below the thread.",
        title: "Neurograph",
        body: "Leads in this sample cluster by the pain they described in public. Proximity is shared language, not a private social graph.",
        detail: "Left: Ada, Priya, and Lena — hours every week, done by hand. Right: Marco, Samir, and Jonah — replacing a spreadsheet before a hire. Theo sits between the clusters: budget approved, thinner pain language."
      },
      drafts: {
        prompt: "Draft outreach for Ada. Do not send it.",
        status: "Three unsent DM variants for Ada are on screen. Nothing was sent. Download free sample is below the thread.",
        title: "Draft outreach for Ada",
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
        title: "ICP fit · Ada Okonkwo",
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
        title: "Full pack",
        body: "This screen is the free sample. The full niche pack is a larger SQLite file of the same kind of lead. Chat still only reads the file you have. It does not mine, and it does not send.",
        sampleTitle: "On this screen",
        samplePrice: "Free",
        sampleUnit: "with the app",
        samplePoints: [
          "10 sample leads",
          "4 A · 3 B · 3 C",
          "One illustrative niche",
          "Consult on your machine"
        ],
        fullTitle: "Full niche pack",
        fullPrice: "$199",
        fullUnit: "once",
        fullPoints: [
          "About 100 A–C leads",
          "Quote, source, score, contact",
          "Drafts you consult in the app",
          "SQLite file you keep"
        ],
        after: "Another niche, or a refresh, is another pack at the same price."
      }
    },
    pt: {
      typingOff: "Digitação desligada",
      reading: "Lendo o pacote de amostra",
      copied: "Copiado",
      copy: "Copiar",
      unsent: "SEM ENVIO",
      selectDraft: "Selecione o rascunho",
      download: "Baixar amostra grátis",
      pricing: "Preço do pacote",
      graphLabel: "Constelação de similaridade da amostra. Ada, Priya e Lena se agrupam no trabalho manual da semana. Marco, Samir e Jonah se agrupam em trocar a planilha. Theo fica no meio: orçamento aprovado, menos linguagem de dor.",
      legendA: "Lead A",
      legendB: "Lead B",
      legendLine: "Dor pública em comum",
      pan: "Em tela estreita, role o grafo para o lado. Os grupos também estão descritos acima.",
      scoreboard: {
        prompt: "Mostra o placar do pipeline desta amostra.",
        status: "Placar pronto. Amostra: 4 A, 3 B, 3 C. Ninguém contatado. Baixar amostra grátis está abaixo da conversa.",
        title: "Placar do pipeline",
        body: "Pacote de amostra nesta máquina: 10 leads, notas A a C. Nenhum foi contatado. Os rascunhos ficam sem envio até você colar.",
        meta: "Contatados 0 · Rascunhos sem envio prontos para a Ada",
        tiles: [
          ["A", "4", "Prontos para rascunho"],
          ["B", "3", "Bom encaixe"],
          ["C", "3", "Vale olhar"]
        ],
        headers: ["Nota", "Lead", "Papel", "Pontos"],
        caption: "10 leads ilustrativos de amostra. Não é uma busca ao vivo."
      },
      neuro: {
        prompt: "Mostra o neurografo desta amostra.",
        status: "Neurografo pronto. Dois grupos na amostra de 10 leads. Baixar amostra grátis está abaixo da conversa.",
        title: "Neurografo",
        body: "Os leads desta amostra se agrupam pela dor que descreveram em público. Proximidade é linguagem em comum, não um grafo social privado.",
        detail: "À esquerda: Ada, Priya e Lena — horas toda semana, na mão. À direita: Marco, Samir e Jonah — trocar a planilha antes de contratar. Theo fica entre os grupos: orçamento aprovado, linguagem de dor mais fina."
      },
      drafts: {
        prompt: "Redige a abordagem para a Ada. Não envie.",
        status: "Três variantes de DM sem envio para a Ada estão na tela. Nada foi enviado. Baixar amostra grátis está abaixo da conversa.",
        title: "Rascunho para a Ada",
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
        title: "Aderência ao ICP · Ada Okonkwo",
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
        title: "Pacote completo",
        body: "Esta tela é a amostra grátis. O pacote completo do nicho é um arquivo SQLite maior, com o mesmo tipo de lead. O chat continua só lendo o arquivo que você tem. Ele não minera e não envia.",
        sampleTitle: "Nesta tela",
        samplePrice: "Grátis",
        sampleUnit: "com o app",
        samplePoints: [
          "10 leads de amostra",
          "4 A · 3 B · 3 C",
          "Um nicho ilustrativo",
          "Consulta na sua máquina"
        ],
        fullTitle: "Pacote do nicho",
        fullPrice: "R$ 990",
        fullUnit: "uma vez",
        fullPoints: [
          "Cerca de 100 leads A–C",
          "Citação, fonte, nota e contato",
          "Rascunhos para consultar no app",
          "Arquivo SQLite que você guarda"
        ],
        after: "Outro nicho, ou uma atualização, é outro pacote pelo mesmo preço."
      }
    }
  };

  var T = COPY[lang];

  var NODES = [
    { id: "priya", x: 108, y: 72, r: 20, grade: "A", score: 84, name: "Priya" },
    { id: "ada", x: 176, y: 158, r: 30, grade: "A", score: 91, name: "Ada" },
    { id: "lena", x: 112, y: 246, r: 20, grade: "A", score: 81, name: "Lena" },
    { id: "theo", x: 348, y: 64, r: 18, grade: "B", score: 78, name: "Theo" },
    { id: "marco", x: 498, y: 132, r: 26, grade: "A", score: 86, name: "Marco" },
    { id: "jonah", x: 430, y: 240, r: 18, grade: "B", score: 71, name: "Jonah" },
    { id: "samir", x: 586, y: 210, r: 18, grade: "B", score: 74, name: "Samir" }
  ];
  var EDGES = [
    ["ada", "priya", "strong"],
    ["ada", "lena", "strong"],
    ["priya", "lena", "mid"],
    ["marco", "samir", "strong"],
    ["marco", "jonah", "strong"],
    ["samir", "jonah", "mid"],
    ["ada", "marco", "mid"],
    ["theo", "marco", "weak"],
    ["theo", "ada", "weak"]
  ];
  var STARS = [[48, 36], [250, 28], [300, 200], [390, 286], [560, 46], [640, 108], [230, 286], [470, 48], [40, 180], [620, 280]];

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

  function byId(id) {
    for (var i = 0; i < NODES.length; i++) if (NODES[i].id === id) return NODES[i];
    return null;
  }

  function bot(title) {
    var body = el("div", { class: "msg-body" });
    body.appendChild(el("h3", { text: title }));
    var article = el("article", { class: "msg msg-bot" },
      el("div", { class: "msg-av", "aria-hidden": "true" }, el("i")),
      body
    );
    return { article: article, body: body };
  }

  function pin(node) {
    window.requestAnimationFrame(function () {
      var threadRect = thread.getBoundingClientRect();
      var nodeRect = node.getBoundingClientRect();
      thread.scrollTop += nodeRect.top - threadRect.top - 8;
    });
  }

  function growBars(scope) {
    var bars = scope.querySelectorAll(".track i");
    Array.prototype.forEach.call(bars, function (bar) {
      var target = bar.getAttribute("data-w");
      if (reduce) {
        bar.style.width = target;
        return;
      }
      bar.style.width = "0%";
      window.requestAnimationFrame(function () {
        bar.style.transition = "width .6s ease";
        bar.style.width = target;
      });
    });
  }

  function renderScoreboard() {
    var c = T.scoreboard;
    var view = bot(c.title);
    view.body.appendChild(el("p", { text: c.body }));
    view.body.appendChild(el("p", { class: "msg-meta", text: c.meta }));
    var tiles = el("div", { class: "tiles" });
    c.tiles.forEach(function (tile) {
      tiles.appendChild(el("div", { class: "tile tile-" + tile[0] },
        el("span", { class: "tile-g", text: tile[0] }),
        el("b", { text: tile[1] }),
        el("span", { class: "tile-h", text: tile[2] })
      ));
    });
    view.body.appendChild(tiles);
    view.body.appendChild(el("div", { class: "stack", "aria-hidden": "true" },
      el("i", { class: "sA", style: "width:40%" }),
      el("i", { class: "sB", style: "width:30%" }),
      el("i", { class: "sC", style: "width:30%" })
    ));
    var table = el("table");
    var caption = el("caption", { text: c.caption });
    table.appendChild(caption);
    var thead = el("thead");
    var hr = el("tr");
    c.headers.forEach(function (header) {
      hr.appendChild(el("th", { scope: "col", text: header }));
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    var tbody = el("tbody");
    LEADS[lang].forEach(function (lead) {
      var tr = el("tr");
      tr.appendChild(el("td", {}, el("span", { class: "grade grade-" + lead[0], text: lead[0] })));
      tr.appendChild(el("td", { text: lead[1] }));
      tr.appendChild(el("td", { text: lead[2] }));
      tr.appendChild(el("td", { class: "num", text: String(lead[3]) }));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    view.body.appendChild(el("div", { class: "board-wrap" }, table));
    return view.article;
  }

  function renderGraph() {
    var c = T.neuro;
    var view = bot(c.title);
    view.body.appendChild(el("p", { text: c.body }));
    view.body.appendChild(el("p", { text: c.detail }));
    var svg = svgEl("svg", {
      viewBox: "0 0 680 320",
      role: "img",
      "aria-label": T.graphLabel
    });
    STARS.forEach(function (star) {
      svg.appendChild(svgEl("circle", {
        cx: star[0], cy: star[1], r: "1.6", fill: "#d5e2f2", opacity: "0.45"
      }));
    });
    var stroke = { strong: "#ffe14d", mid: "#9fb0c7", weak: "#6d829b" };
    var width = { strong: "2.4", mid: "1.6", weak: "1.2" };
    var opacity = { strong: "0.95", mid: "0.75", weak: "0.6" };
    EDGES.forEach(function (edge) {
      var a = byId(edge[0]);
      var b = byId(edge[1]);
      svg.appendChild(svgEl("line", {
        x1: a.x, y1: a.y, x2: b.x, y2: b.y,
        stroke: stroke[edge[2]],
        "stroke-width": width[edge[2]],
        "stroke-linecap": "round",
        opacity: opacity[edge[2]]
      }));
    });
    NODES.forEach(function (node) {
      var group = svgEl("g");
      group.appendChild(svgEl("circle", {
        cx: node.x, cy: node.y, r: node.r + 7,
        fill: "none",
        stroke: node.grade === "A" ? "#ffe14d" : "#8ec5f0",
        "stroke-opacity": "0.28",
        "stroke-width": "1"
      }));
      group.appendChild(svgEl("circle", {
        cx: node.x,
        cy: node.y,
        r: node.r,
        fill: node.grade === "A" ? "#ffe14d" : "#8ec5f0",
        stroke: "#0f1b2d",
        "stroke-width": "2"
      }));
      var score = svgEl("text", {
        x: node.x,
        y: node.y + 5,
        "text-anchor": "middle",
        fill: "#0f1b2d",
        "font-size": node.r > 24 ? "15" : "12",
        "font-family": "JetBrains Mono, ui-monospace, monospace",
        "font-weight": "700"
      });
      score.textContent = String(node.score);
      group.appendChild(score);
      var label = svgEl("text", {
        x: node.x,
        y: node.y + node.r + 18,
        "text-anchor": "middle",
        fill: "#e7eef7",
        "font-size": "15",
        "font-family": "Instrument Sans, system-ui, sans-serif",
        "font-weight": "600"
      });
      label.textContent = node.name;
      group.appendChild(label);
      svg.appendChild(group);
    });
    view.body.appendChild(el("div", { class: "graph-scroll" }, svg));
    view.body.appendChild(el("div", { class: "graph-legend" },
      el("span", {}, el("i", { class: "sw-a", "aria-hidden": "true" }), T.legendA),
      el("span", {}, el("i", { class: "sw-b", "aria-hidden": "true" }), T.legendB),
      el("span", {}, el("i", { class: "sw-line", "aria-hidden": "true" }), T.legendLine)
    ));
    view.body.appendChild(el("p", { class: "graph-pan", text: T.pan }));
    return view.article;
  }

  function renderDrafts() {
    var c = T.drafts;
    var view = bot(c.title);
    view.body.appendChild(el("p", { text: c.body }));
    var list = el("div", { class: "drafts" });
    c.variants.forEach(function (variant, index) {
      var copyBtn = el("button", {
        type: "button",
        class: "copy",
        "data-copy": "1",
        "data-label": T.copy,
        text: T.copy
      });
      copyBtn.setAttribute("aria-label", T.copy + " · " + variant[0]);
      list.appendChild(el("article", { class: "draft" },
        el("div", { class: "draft-top" },
          el("strong", { text: variant[0] }),
          el("div", { class: "draft-actions" },
            el("span", { class: "unsent", text: T.unsent }),
            copyBtn
          )
        ),
        el("p", { "data-draft-body": String(index + 1), text: variant[1] })
      ));
    });
    view.body.appendChild(list);
    return view.article;
  }

  function renderIcp() {
    var c = T.icp;
    var view = bot(c.title);
    view.body.appendChild(el("p", { text: c.body }));
    var quote = el("blockquote", { class: "icp-quote" });
    quote.appendChild(document.createTextNode(c.quote));
    quote.appendChild(el("cite", { text: c.source }));
    view.body.appendChild(el("div", { class: "icp-top" },
      el("p", { class: "icp-who", text: c.who }),
      el("p", { class: "icp-score" }, el("span", { text: "A" }), "91")
    ));
    view.body.appendChild(quote);
    var list = el("ul", { class: "reasons" });
    c.reasons.forEach(function (reason) {
      var pct = Math.round((reason[1] / reason[2]) * 100) + "%";
      list.appendChild(el("li", {},
        el("div", { class: "reason-top" },
          el("span", { text: reason[0] }),
          el("b", { text: reason[1] + "/" + reason[2] })
        ),
        el("div", { class: "track", "aria-hidden": "true" }, el("i", { "data-w": pct })),
        el("p", { text: reason[3] })
      ));
    });
    view.body.appendChild(list);
    return view.article;
  }

  function renderUpgrade() {
    var c = T.upgrade;
    var view = bot(c.title);
    view.body.appendChild(el("p", { text: c.body }));
    function card(full, title, price, unit, points) {
      var ul = el("ul");
      points.forEach(function (point) { ul.appendChild(el("li", { text: point })); });
      return el("div", { class: full ? "pack-card full" : "pack-card" },
        el("h3", { text: title }),
        el("p", { class: "pack-price" }, price, el("span", { text: unit })),
        ul
      );
    }
    view.body.appendChild(el("div", { class: "pack-grid" },
      card(false, c.sampleTitle, c.samplePrice, c.sampleUnit, c.samplePoints),
      card(true, c.fullTitle, c.fullPrice, c.fullUnit, c.fullPoints)
    ));
    view.body.appendChild(el("p", { class: "msg-meta", text: c.after }));
    view.body.appendChild(el("div", { class: "msg-actions" },
      el("a", { class: "btn hl", href: "#download", text: T.download }),
      el("a", { class: "consult-textlink", href: "#pricing", text: T.pricing })
    ));
    return view.article;
  }

  var RENDER = {
    scoreboard: renderScoreboard,
    neurograph: renderGraph,
    drafts: renderDrafts,
    icp: renderIcp,
    upgrade: renderUpgrade
  };

  function appendUser(text) {
    var node = el("article", { class: "msg msg-user" }, el("p", { text: text }));
    thread.appendChild(node);
    return node;
  }

  function appendPending() {
    var view = bot(T.reading);
    view.body.querySelector("h3").appendChild(el("span", { class: "consult-dots", "aria-hidden": "true" }, el("i"), el("i"), el("i")));
    thread.appendChild(view.article);
    return view.article;
  }

  function showCta() {
    if (!cta || !cta.hasAttribute("hidden")) return;
    cta.removeAttribute("hidden");
  }

  function setPressed(active) {
    Array.prototype.forEach.call(chips, function (chip) {
      chip.setAttribute("aria-pressed", chip === active ? "true" : "false");
    });
  }

  function play(job, done) {
    var spec = T[job.key];
    seq += 1;
    composerText.textContent = spec.prompt;
    composer.classList.add("is-filled");
    window.setTimeout(function () {
      appendUser(spec.prompt);
      composerText.textContent = T.typingOff;
      composer.classList.remove("is-filled");
      var pending = appendPending();
      pin(pending);
      if (status) status.textContent = T.reading + "…";
      window.setTimeout(function () {
        if (pending.parentNode) pending.parentNode.removeChild(pending);
        var node = RENDER[job.id]();
        thread.appendChild(node);
        growBars(node);
        if (status) status.textContent = spec.status;
        showCta();
        pin(node);
        done();
      }, reduce ? 0 : 680);
    }, reduce ? 0 : 280);
  }

  function drain() {
    if (busy || !queue.length) return;
    var job = queue.shift();
    busy = true;
    setPressed(job.btn);
    play(job, function () {
      busy = false;
      drain();
    });
  }

  var KEY = {
    scoreboard: "scoreboard",
    neurograph: "neuro",
    drafts: "drafts",
    icp: "icp",
    upgrade: "upgrade"
  };

  Array.prototype.forEach.call(chips, function (chip) {
    chip.addEventListener("click", function () {
      var id = chip.getAttribute("data-demo");
      if (!RENDER[id] || queue.length > 6) return;
      queue.push({ id: id, key: KEY[id], btn: chip });
      drain();
    });
  });

  thread.addEventListener("click", function (event) {
    var btn = event.target.closest ? event.target.closest("[data-copy]") : null;
    if (!btn || !thread.contains(btn)) return;
    var card = btn.closest(".draft");
    var body = card && card.querySelector("[data-draft-body]");
    if (!body) return;
    var text = body.textContent;
    var label = btn.getAttribute("data-label") || T.copy;
    function mark(next) {
      btn.textContent = next;
      window.setTimeout(function () { btn.textContent = label; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { mark(T.copied); }, function () { selectFallback(); });
    } else {
      selectFallback();
    }
    function selectFallback() {
      var range = document.createRange();
      range.selectNodeContents(body);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      mark(T.selectDraft);
    }
  });
})();
