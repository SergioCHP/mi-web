/* =========================================================
   privacidad.js — Textos en valenciano de privacidad.html
   Las claves coinciden con los atributos data-i18n del HTML.
   El cambio de idioma lo hace js/page-i18n.js (compartido).
   ========================================================= */
(function () {
  "use strict";

  const CORREO = '<a href="mailto:serchoper@alu.edu.gva.es">serchoper@alu.edu.gva.es</a>';

  const VA = {
    docTitle: "Política de privacitat | Sergio Chorques",

    kicker: "Protecció de dades",
    title: "Política de privacitat",
    lead: "Quines dades arreplegue en esta web, per a què les use i com pots demanar-me que les esborre. Sense lletra menuda.",
    metaOwnerT: "Responsable",
    metaContactT: "Contacte",
    metaDateT: "Última actualització",
    metaDate: "20 d'octubre de 2026",

    sumTitle: "En resum",
    sumOwnerT: "Responsable",
    sumPurposeT: "Per a què",
    sumPurpose: "Cridar-te o contestar-te quan m'ho demanes amb el formulari «Et cride?».",
    sumBasisT: "Base legal",
    sumBasis: "El teu consentiment, que dones en enviar el formulari.",
    sumRecipT: "Qui més les veu",
    sumRecip: "Ningú. Supabase i Google (Gmail) només em donen el servei tècnic.",
    sumKeepT: "Quant de temps",
    sumKeep: "Fins que atenc la teua sol·licitud i, com a màxim, 6 mesos.",
    sumRightsT: "Els teus drets",
    sumRights: "Veure, corregir o esborrar les teues dades, entre altres. Escriu-me a " + CORREO + ".",

    s1Title: "Qui és el responsable",
    s1Text:
      "<p>Esta web és un projecte personal i educatiu de <strong>Sergio Chorques</strong>, estudiant de 1r DAM a l'IES Simarro. Jo soc qui decidix què es fa amb les teues dades i qui en respon.</p>" +
      "<p>Per a qualsevol qüestió sobre les teues dades, escriu-me a " + CORREO + ".</p>",

    s2Title: "Quines dades arreplegue",
    s2Text:
      "<p>Només les que escrius en el formulari «Et cride?» de la portada:</p>" +
      '<ul class="case-list">' +
      "<li>Nom</li>" +
      "<li>Correu electrònic</li>" +
      "<li>Telèfon</li>" +
      "<li>Franja horària en què preferixes que et cride</li>" +
      "<li>El missatge, si n'escrius un (és opcional)</li>" +
      "</ul>" +
      "<p>També es guarden la data i l'hora de l'enviament. No guarde la teua adreça IP junt amb la sol·licitud. Si no omplis el formulari, no arreplegue res sobre tu.</p>" +
      "<p>Per favor, no poses en el missatge dades sensibles, com ara informació de salut: no les necessite.</p>",

    s3Title: "Per a què les use i amb quina base legal",
    s3Text:
      '<ul class="case-list">' +
      "<li><strong>Cridar-te o contestar-te</strong> en la franja que tries. Base legal: el teu <strong>consentiment</strong> (art. 6.1.a del RGPD), que dones en enviar el formulari. Pots retirar-lo quan vulgues; això no afecta el que ja s'haguera fet abans.</li>" +
      "<li><strong>Enviar-te un correu de confirmació</strong> automàtic, que no copia el teu missatge. La mateixa base legal.</li>" +
      "<li><strong>Frenar l'spam</strong>: abans de guardar la teua sol·licitud es comprova quantes n'han arribat des del mateix correu en l'última hora (màxim 3). Base legal: el meu <strong>interés legítim</strong> a protegir la web (art. 6.1.f del RGPD).</li>" +
      "</ul>" +
      "<p>No envie publicitat, no faig perfils i no prenc decisions automàtiques sobre tu.</p>",

    s4Title: "Quant de temps les guarde",
    s4Text:
      "<p>Fins que atenc la teua sol·licitud i, com a màxim, <strong>6 mesos</strong> des que l'envies. Passat eixe termini, la base de dades l'esborra sola (ho comprova cada nit), i jo esborre també el correu d'avís que m'arriba.</p>" +
      "<p>Si em demanes que esborre les teues dades abans, ho faig tan prompte com llija el teu correu.</p>",

    s5Title: "Qui més les tracta",
    s5Text:
      "<p>No cedisc les teues dades a ningú, tret que una llei m'hi obligue. Perquè el formulari funcione utilitze estos serveis, que només les tracten seguint les meues instruccions (són «encarregats del tractament»):</p>" +
      '<ul class="case-list">' +
      "<li><strong>Supabase</strong>: la base de dades on es guarda la sol·licitud i el servidor que envia els correus.</li>" +
      "<li><strong>Google (Gmail)</strong>: envia el correu de confirmació i rep el meu avís.</li>" +
      "</ul>" +
      "<p>Són empreses dels Estats Units, així que les teues dades poden eixir de l'Espai Econòmic Europeu. Eixes transferències es fan amb les garanties que exigix el RGPD, com el Marc de Privacitat de Dades UE-EUA o les clàusules contractuals tipus de la Comissió Europea.</p>",

    s6Title: "Els teus drets",
    s6Text:
      "<p>Pots demanar-me en qualsevol moment:</p>" +
      '<ul class="case-list">' +
      "<li><strong>Accés</strong>: saber quines dades tinc sobre tu.</li>" +
      "<li><strong>Rectificació</strong>: corregir-les.</li>" +
      "<li><strong>Supressió</strong>: esborrar-les.</li>" +
      "<li><strong>Oposició</strong> i <strong>limitació</strong> del tractament.</li>" +
      "<li><strong>Portabilitat</strong>: rebre-les en un format que pugues reutilitzar.</li>" +
      "<li><strong>Retirar el teu consentiment</strong>.</li>" +
      "</ul>" +
      "<p>Escriu-me a " + CORREO + ", si pot ser des del mateix correu que vas usar en el formulari, perquè puga comprovar que eres tu. Et conteste en un termini màxim d'un mes.</p>" +
      '<p>Si creus que no he respectat els teus drets, pots presentar una reclamació davant de l\'<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">Agència Espanyola de Protecció de Dades<span class="sr-only"> (s\'obri en una pestanya nova)</span></a>.</p>',

    s7Title: "Quan navegues per la web",
    s7Text:
      "<p><strong>No utilitze galetes</strong> (cookies), ni analítica, ni publicitat.</p>" +
      "<p>Per a recordar les teues preferències, la web guarda en el teu propi navegador (<code>localStorage</code>) unes poques coses: el tema clar o fosc, el color d'accent, l'idioma, la foto de portada que estàs veient, si el so del grimori està activat i una còpia temporal (1 hora) del meu perfil públic de GitHub, per a no repetir la petició. Farolillo recorda durant la sessió si ja t'ha mostrat la seua pista. Res d'això m'arriba a mi, i pots esborrar-ho des de la configuració del teu navegador.</p>" +
      "<p>Algunes pàgines carreguen contingut d'altres serveis. Com en qualsevol connexió a internet, eixos serveis reben la teua adreça IP i la tracten segons les seues pròpies polítiques:</p>" +
      '<ul class="case-list">' +
      "<li><strong>GitHub</strong>: allotja la web (GitHub Pages), i la seua API mostra la meua activitat en la portada.</li>" +
      "<li><strong>Open-Meteo</strong>: el temps d'Enguera en la portada.</li>" +
      "<li><strong>RAWG, TMDB i AniList</strong>: els cercadors de videojocs, cinema i anime, amb les seues portades.</li>" +
      "<li><strong>YouTube</strong>, en mode de privacitat millorada (<code>youtube-nocookie.com</code>): només quan obris un anime que té tràiler.</li>" +
      "<li><strong>cdnjs i jsDelivr</strong>: les llibreries del grimori de llibres.</li>" +
      "</ul>" +
      "<p>Les tipografies estan allotjades en esta mateixa web, així que no es demanen a Google Fonts.</p>",

    s8Title: "Menors de 14 anys",
    s8Text:
      "<p>Si tens menys de 14 anys, no utilitzes el formulari: demana a la teua mare, al teu pare o al teu tutor que m'escriga. Si descobrisc que he rebut dades d'un menor de 14 anys sense eixe permís, les esborre.</p>",

    s9Title: "Canvis en esta política",
    s9Text:
      "<p>Si canvie alguna cosa (per exemple, si afig un servei nou), actualitzaré esta pàgina i la data de dalt.</p>",
    back: "← Tornar a l'inici",

    contactTitle: "Contacte",
    contactDesc: "Interessat a parlar sobre desenvolupament de programari, projectes o col·laborar? Escriu-me.",
    contactSend: "Enviar correu",
    copyWeb: "Web personal."
  };

  if (window.pageI18n) window.pageI18n(VA);
})();
