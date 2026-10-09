// Fanale interface translations. English is the default; research data (names, titles, citations) stays as published.
(() => {
  const LANGS = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "pt", name: "Português" },
  ];

  const D = {
    en: {
      langLabel: "Language",
      tagline: "Rare-disease specialist search · PubMed + ClinicalTrials.gov",
      h1: "Let us find the researchers that know this condition best.",
      lede: "Enter a medical diagnosis. Fanale searches PubMed and ClinicalTrials.gov, and ranks them by most recent publication.",
      diagLabel: "Medical diagnosis",
      placeholder: "e.g. systemic lupus erythematosus",
      search: "Search", stop: "Stop", try: "Try:",
      searchHint: "",
      chipLupus: "Lupus", chipHPS: "Hermansky-Pudlak syndrome", chipSickle: "Sickle cell disease", chipFabry: "Fabry disease",
      stepPubmed: "Search PubMed", stepTrials: "Search ClinicalTrials.gov", stepDb: "Build researcher database", stepOrg: "Look up organizations",
      researchers: "Researchers",
      dbSummary: "Temporary researcher database",
      thRecent: "Most recent", thResearcher: "Researcher", thOrg: "Organization", thCountry: "Country", thContinent: "Continent", thEmail: "Email", thPhone: "Phone", thTx: "Treatment and medicine", thRef: "Reference (MLA)",
      footer1: "Fanale is not medical advice. Researcher details come from public PubMed records, ClinicalTrials.gov, ROR, Wikidata and OpenAlex. No user data is collected, archived, or shared.",
      absHead: "Abstract in brief", readAbs: "Read the full abstract on PubMed", readTrial: "Read the full record on ClinicalTrials.gov", mlaAll: "See all research papers in MLA format", mlaTitle: "Research papers by {name}", mlaNote: "Found on PubMed by author name, newest first. Common names can include other researchers, so check before relying on this list.", mlaLoading: "Loading papers…", mlaNone: "No papers found.", mlaCopyAll: "Copy all", mlaPrint: "Print", mlaClose: "Close", mlaCount: "{n} references", tipH: "h-index: a researcher has an h-index of h if h of their papers have each been cited at least h times. It reflects both how much they publish and how often it is cited.", tipWorks: "Works: the total number of papers, reviews and other research outputs credited to this researcher. A higher number means a longer or more active publishing record, not necessarily better care.", tipCites: "Total citations: how many times other researchers have referenced this person's published work. More citations suggest the work has been widely read and used, but they do not measure quality of care.",
      footer2: "The database is temporary: it lives only in this page while it is open and is not saved.",
      credit: "Fanale was created by <b>Struvante</b> · Puerto Rico · © 2026",

      na: "Not listed in source",
      noneNamed: "None named in this researcher's papers or trials",
      notRec: "Named in the research. Not a recommendation.",
      profileExample: "Profile search link appears here",
      findProfile: "Find profile and photo",
      opensTab: "Opens a web search in a new tab",
      lookingUp: "Looking up…",
      orgFromTrial: "Organization contact from the ClinicalTrials.gov site contact for {nct}",
      orgFromWikidata: "Organization contact from Wikidata, for {name}",
      findOrg: "Find organization contact",
      opensSearch: "(opens a web search)",
      unnamed: "Unnamed researcher",
      researcherContact: "Researcher contact", phone: "Phone", email: "Email", workOrg: "Work organization", address: "Address", website: "Website",
      matchedRor: "Matched to {name} in the Research Organization Registry",
      txHead: "Treatment and medicine", medicine: "Medicine", treatment: "Treatment",
      recentTrial: "Most recent work (trial start)", recentPub: "Most recent publication",
      "North America": "North America", "South America": "South America", Europe: "Europe", Asia: "Asia", Africa: "Africa", Oceania: "Oceania", locNotListed: "Location not listed",
      researcher1: "{n} researcher", researcherN: "{n} researchers", record1: "{n} record", recordN: "{n} records",
      resultsFor: "Researchers for “{q}”",
      noneWithContact: "No researchers with contact details and treatments for “{q}”",
      shownSub: "{n} shown · up to {max} per continent, newest first",
      stepCite: "Count citations", rankBy: "Rank by:", sortTop: "Recent + most cited", sortCited: "Most cited", sortNewest: "Newest", citedTimes: "Cited {n} times", hIndex: "h-index {h}", worksN: "{n} works", citeNotFound: "Citation count not found", citePending: "Counting citations…", thCites: "Total citations", totalCites: "Total citations", sugDidYou: "Did you mean", sugLabel: "Suggestions", showBy: "Show:", srcAll: "All", srcPub: "Publications", srcTrial: "Trials", printList: "Print list", printNote: "Printed from Fanale (Struvante). Not medical advice: treatments are those named in the research, not recommendations.", copySummary: "Copy summary", copied: "Copied", copyFailed: "Could not copy", summaryIntro: "A researcher to ask my doctor about", filteredSub: " · {n} hidden by the filter", citeDone: "{m} matched", citeDown: "The citation database (OpenAlex) could not be reached, so citation counts are missing and researchers are ranked by newest publication.", shownSubCited: "{n} shown · up to {max} per continent, most cited first", shownSubTop: "{n} shown · up to {max} per continent, most recent and most cited first",
      overLimit: " · {n} more over the limit",
      hiddenSub: " · {n} hidden for missing contact details or treatments (see database below)",
      nArticles: "{n} articles", nTrials: "{n} trials", nResearchers: "{n} researchers", orgProgress: "{done} of {total}", orgDone: "{m} matched · {p} phones",
      searching: "<b>Searching.</b> This usually takes a few seconds.",
      searchingFor: "Searching for “{q}”",
      pubmedDown: "<b>PubMed</b> could not be reached. Results below come from ClinicalTrials.gov only. Try again in a moment.",
      trialsDown: "<b>ClinicalTrials.gov</b> could not be reached. Results below come from PubMed only. Try again in a moment.",
      bothDown: "Neither PubMed nor ClinicalTrials.gov could be reached. Check your connection and try again.",
      noResults: "No results",
      noneFound: "No researchers found for “{q}”",
      tryBroader: "Try a broader or alternate name for the diagnosis.",
      rorDown: "The organization directory (ROR) could not be reached, so official websites and organization phone numbers are missing. The rest of the results are complete.",
      stopped: "Search stopped.",
      wentWrong: "Something went wrong while building the results. Try again.",
      exampleNotice: "<b>Example layout.</b> These five researchers are fictional, to show how results look, grouped by continent. Search a diagnosis to load real data.",
      exampleTitle: "Researchers for “lupus” (example)",
    },
    es: {
      langLabel: "Idioma",
      tagline: "Búsqueda de especialistas en enfermedades raras · PubMed + ClinicalTrials.gov",
      h1: "Encontremos a los investigadores que mejor conocen esta condición.",
      lede: "Escribe un diagnóstico médico. Fanale busca en PubMed y ClinicalTrials.gov, y ordena a los investigadores por su publicación más reciente.",
      diagLabel: "Diagnóstico médico",
      placeholder: "p. ej., systemic lupus erythematosus",
      search: "Buscar", stop: "Detener", try: "Prueba:",
      searchHint: "Consejo: busca con el nombre médico en inglés (por ejemplo, “sickle cell disease” para anemia falciforme). PubMed y ClinicalTrials.gov indexan la investigación en inglés.",
      chipLupus: "Lupus", chipHPS: "Síndrome de Hermansky-Pudlak", chipSickle: "Anemia falciforme", chipFabry: "Enfermedad de Fabry",
      stepPubmed: "Buscar en PubMed", stepTrials: "Buscar en ClinicalTrials.gov", stepDb: "Crear base de datos de investigadores", stepOrg: "Buscar organizaciones",
      researchers: "Investigadores",
      dbSummary: "Base de datos temporal de investigadores",
      thRecent: "Más reciente", thResearcher: "Investigador", thOrg: "Organización", thCountry: "País", thContinent: "Continente", thEmail: "Correo", thPhone: "Teléfono", thTx: "Tratamiento y medicamento", thRef: "Referencia (MLA)",
      footer1: "Fanale no es consejo médico. Los datos de los investigadores provienen de registros públicos de PubMed, ClinicalTrials.gov, ROR, Wikidata y OpenAlex. No se recopilan, archivan ni comparten datos del usuario.",
      absHead: "Resumen del artículo", readAbs: "Leer el resumen completo en PubMed", readTrial: "Leer el registro completo en ClinicalTrials.gov", mlaAll: "Ver todos los artículos en formato MLA", mlaTitle: "Artículos de {name}", mlaNote: "Encontrados en PubMed por nombre de autor, del más reciente al más antiguo. Los nombres comunes pueden incluir a otros investigadores; verifica antes de confiar en esta lista.", mlaLoading: "Cargando artículos…", mlaNone: "No se encontraron artículos.", mlaCopyAll: "Copiar todo", mlaPrint: "Imprimir", mlaClose: "Cerrar", mlaCount: "{n} referencias", tipH: "Índice h: un investigador tiene índice h igual a h si h de sus artículos han sido citados al menos h veces cada uno. Refleja cuánto publica y cuánto se le cita.", tipWorks: "Obras: el número total de artículos, revisiones y otros trabajos atribuidos a este investigador. Un número mayor indica una trayectoria de publicación más larga o activa, no necesariamente mejor atención.", tipCites: "Citas totales: cuántas veces otros investigadores han citado la obra publicada de esta persona. Más citas sugieren que su trabajo ha sido muy leído y usado, pero no miden la calidad de la atención.",
      footer2: "La base de datos es temporal: solo existe en esta página mientras está abierta y no se guarda.",
      credit: "Fanale fue creado por <b>Struvante</b> · Puerto Rico · © 2026",

      na: "No aparece en la fuente",
      noneNamed: "Ninguno mencionado en los artículos o estudios de este investigador",
      notRec: "Mencionado en la investigación. No es una recomendación.",
      profileExample: "Aquí aparece el enlace para buscar el perfil",
      findProfile: "Buscar perfil y foto",
      opensTab: "Abre una búsqueda web en otra pestaña",
      lookingUp: "Buscando…",
      orgFromTrial: "Contacto de la organización tomado del contacto del centro en ClinicalTrials.gov para {nct}",
      orgFromWikidata: "Contacto de la organización tomado de Wikidata, para {name}",
      findOrg: "Buscar contacto de la organización",
      opensSearch: "(abre una búsqueda web)",
      unnamed: "Investigador sin nombre",
      researcherContact: "Contacto del investigador", phone: "Teléfono", email: "Correo", workOrg: "Organización de trabajo", address: "Dirección", website: "Sitio web",
      matchedRor: "Identificada como {name} en el Research Organization Registry",
      txHead: "Tratamiento y medicamento", medicine: "Medicamento", treatment: "Tratamiento",
      recentTrial: "Trabajo más reciente (inicio del estudio)", recentPub: "Publicación más reciente",
      "North America": "América del Norte", "South America": "América del Sur", Europe: "Europa", Asia: "Asia", Africa: "África", Oceania: "Oceanía", locNotListed: "Ubicación no indicada",
      researcher1: "{n} investigador", researcherN: "{n} investigadores", record1: "{n} registro", recordN: "{n} registros",
      resultsFor: "Investigadores para “{q}”",
      noneWithContact: "No hay investigadores con datos de contacto y tratamientos para “{q}”",
      shownSub: "{n} mostrados · hasta {max} por continente, los más recientes primero",
      stepCite: "Contar citas", rankBy: "Ordenar por:", sortTop: "Recientes + más citados", sortCited: "Más citados", sortNewest: "Más recientes", citedTimes: "Citado {n} veces", hIndex: "índice h {h}", worksN: "{n} trabajos", citeNotFound: "No se encontró el número de citas", citePending: "Contando citas…", thCites: "Citas totales", totalCites: "Citas totales", sugDidYou: "¿Quisiste decir?", sugLabel: "Sugerencias", showBy: "Mostrar:", srcAll: "Todos", srcPub: "Publicaciones", srcTrial: "Ensayos", printList: "Imprimir lista", printNote: "Impreso desde Fanale (Struvante). No es consejo médico: los tratamientos son los nombrados en la investigación, no recomendaciones.", copySummary: "Copiar resumen", copied: "Copiado", copyFailed: "No se pudo copiar", summaryIntro: "Un investigador por el que preguntar a mi médico", filteredSub: " · {n} ocultos por el filtro", citeDone: "{m} identificados", citeDown: "No se pudo conectar con la base de citas (OpenAlex), así que faltan los números de citas y los investigadores se ordenan por publicación más reciente.", shownSubCited: "{n} mostrados · hasta {max} por continente, los más citados primero", shownSubTop: "{n} mostrados · hasta {max} por continente, los más recientes y más citados primero",
      overLimit: " · {n} más sobre el límite",
      hiddenSub: " · {n} ocultos por falta de contacto o tratamientos (ver la base de datos abajo)",
      nArticles: "{n} artículos", nTrials: "{n} estudios", nResearchers: "{n} investigadores", orgProgress: "{done} de {total}", orgDone: "{m} identificadas · {p} teléfonos",
      searching: "<b>Buscando.</b> Suele tardar unos segundos.",
      searchingFor: "Buscando “{q}”",
      pubmedDown: "No se pudo conectar con <b>PubMed</b>. Los resultados vienen solo de ClinicalTrials.gov. Inténtalo de nuevo en un momento.",
      trialsDown: "No se pudo conectar con <b>ClinicalTrials.gov</b>. Los resultados vienen solo de PubMed. Inténtalo de nuevo en un momento.",
      bothDown: "No se pudo conectar ni con PubMed ni con ClinicalTrials.gov. Revisa tu conexión e inténtalo de nuevo.",
      noResults: "Sin resultados",
      noneFound: "No se encontraron investigadores para “{q}”",
      tryBroader: "Prueba con un nombre más amplio o alternativo del diagnóstico.",
      rorDown: "No se pudo conectar con el directorio de organizaciones (ROR), así que faltan los sitios web y teléfonos de las organizaciones. El resto de los resultados está completo.",
      stopped: "Búsqueda detenida.",
      wentWrong: "Algo salió mal al preparar los resultados. Inténtalo de nuevo.",
      exampleNotice: "<b>Diseño de ejemplo.</b> Estos cinco investigadores son ficticios, para mostrar cómo se ven los resultados agrupados por continente. Busca un diagnóstico para cargar datos reales.",
      exampleTitle: "Investigadores para “lupus” (ejemplo)",
    },
    fr: {
      langLabel: "Langue",
      tagline: "Recherche de spécialistes des maladies rares · PubMed + ClinicalTrials.gov",
      h1: "Trouvons les chercheurs qui connaissent le mieux cette maladie.",
      lede: "Saisissez un diagnostic médical. Fanale interroge PubMed et ClinicalTrials.gov, puis classe les chercheurs par publication la plus récente.",
      diagLabel: "Diagnostic médical",
      placeholder: "ex. : systemic lupus erythematosus",
      search: "Rechercher", stop: "Arrêter", try: "Essayez :",
      searchHint: "Conseil : utilisez le nom médical en anglais (par exemple « sickle cell disease » pour la drépanocytose). PubMed et ClinicalTrials.gov indexent la recherche en anglais.",
      chipLupus: "Lupus", chipHPS: "Syndrome d'Hermansky-Pudlak", chipSickle: "Drépanocytose", chipFabry: "Maladie de Fabry",
      stepPubmed: "Interroger PubMed", stepTrials: "Interroger ClinicalTrials.gov", stepDb: "Créer la base de chercheurs", stepOrg: "Rechercher les organisations",
      researchers: "Chercheurs",
      dbSummary: "Base de données temporaire des chercheurs",
      thRecent: "Plus récent", thResearcher: "Chercheur", thOrg: "Organisation", thCountry: "Pays", thContinent: "Continent", thEmail: "Courriel", thPhone: "Téléphone", thTx: "Traitement et médicament", thRef: "Référence (MLA)",
      footer1: "Fanale ne constitue pas un avis médical. Les informations sur les chercheurs proviennent des notices publiques de PubMed, de ClinicalTrials.gov, de ROR, de Wikidata et d'OpenAlex. Aucune donnée d'utilisateur n'est collectée, archivée ni partagée.",
      absHead: "Résumé en bref", readAbs: "Lire le résumé complet sur PubMed", readTrial: "Lire la fiche complète sur ClinicalTrials.gov", mlaAll: "Voir tous les articles au format MLA", mlaTitle: "Articles de {name}", mlaNote: "Trouvés sur PubMed par nom d'auteur, du plus récent au plus ancien. Les noms courants peuvent inclure d'autres chercheurs ; vérifiez avant de vous fier à cette liste.", mlaLoading: "Chargement des articles…", mlaNone: "Aucun article trouvé.", mlaCopyAll: "Tout copier", mlaPrint: "Imprimer", mlaClose: "Fermer", mlaCount: "{n} références", tipH: "Indice h : un chercheur a un indice h égal à h si h de ses articles ont chacun été cités au moins h fois. Il reflète à la fois le volume de publications et leur nombre de citations.", tipWorks: "Travaux : nombre total d'articles, revues et autres productions attribués à ce chercheur. Un nombre élevé indique un parcours de publication plus long ou plus actif, pas forcément de meilleurs soins.", tipCites: "Citations totales : nombre de fois que d'autres chercheurs ont cité les travaux publiés de cette personne. Plus de citations suggèrent des travaux très lus et utilisés, mais ne mesurent pas la qualité des soins.",
      footer2: "La base de données est temporaire : elle n'existe que dans cette page tant qu'elle est ouverte et n'est pas enregistrée.",
      credit: "Fanale a été créé par <b>Struvante</b> · Porto Rico · © 2026",

      na: "Non indiqué dans la source",
      noneNamed: "Aucun mentionné dans les articles ou essais de ce chercheur",
      notRec: "Mentionné dans la recherche. Ce n'est pas une recommandation.",
      profileExample: "Le lien de recherche du profil s'affiche ici",
      findProfile: "Trouver le profil et la photo",
      opensTab: "Ouvre une recherche web dans un nouvel onglet",
      lookingUp: "Recherche…",
      orgFromTrial: "Contact de l'organisation issu du contact du site ClinicalTrials.gov pour {nct}",
      orgFromWikidata: "Contact de l'organisation issu de Wikidata, pour {name}",
      findOrg: "Trouver le contact de l'organisation",
      opensSearch: "(ouvre une recherche web)",
      unnamed: "Chercheur sans nom",
      researcherContact: "Contact du chercheur", phone: "Téléphone", email: "Courriel", workOrg: "Organisation", address: "Adresse", website: "Site web",
      matchedRor: "Associée à {name} dans le Research Organization Registry",
      txHead: "Traitement et médicament", medicine: "Médicament", treatment: "Traitement",
      recentTrial: "Travail le plus récent (début de l'essai)", recentPub: "Publication la plus récente",
      "North America": "Amérique du Nord", "South America": "Amérique du Sud", Europe: "Europe", Asia: "Asie", Africa: "Afrique", Oceania: "Océanie", locNotListed: "Lieu non indiqué",
      researcher1: "{n} chercheur", researcherN: "{n} chercheurs", record1: "{n} enregistrement", recordN: "{n} enregistrements",
      resultsFor: "Chercheurs pour « {q} »",
      noneWithContact: "Aucun chercheur avec coordonnées et traitements pour « {q} »",
      shownSub: "{n} affichés · jusqu'à {max} par continent, les plus récents d'abord",
      stepCite: "Compter les citations", rankBy: "Classer par :", sortTop: "Récents + plus cités", sortCited: "Plus cités", sortNewest: "Plus récents", citedTimes: "Cité {n} fois", hIndex: "indice h {h}", worksN: "{n} travaux", citeNotFound: "Nombre de citations introuvable", citePending: "Comptage des citations…", thCites: "Citations totales", totalCites: "Citations totales", sugDidYou: "Vouliez-vous dire", sugLabel: "Suggestions", showBy: "Afficher :", srcAll: "Tous", srcPub: "Publications", srcTrial: "Essais", printList: "Imprimer la liste", printNote: "Imprimé depuis Fanale (Struvante). Pas un avis médical : les traitements sont ceux cités dans la recherche, pas des recommandations.", copySummary: "Copier le résumé", copied: "Copié", copyFailed: "Copie impossible", summaryIntro: "Un chercheur à mentionner à mon médecin", filteredSub: " · {n} masqués par le filtre", citeDone: "{m} identifiés", citeDown: "La base de citations (OpenAlex) est inaccessible : les nombres de citations manquent et les chercheurs sont classés par publication la plus récente.", shownSubCited: "{n} affichés · jusqu'à {max} par continent, les plus cités d'abord", shownSubTop: "{n} affichés · jusqu'à {max} par continent, les plus récents et les plus cités d'abord",
      overLimit: " · {n} de plus au-delà de la limite",
      hiddenSub: " · {n} masqués faute de coordonnées ou de traitements (voir la base ci-dessous)",
      nArticles: "{n} articles", nTrials: "{n} essais", nResearchers: "{n} chercheurs", orgProgress: "{done} sur {total}", orgDone: "{m} associées · {p} téléphones",
      searching: "<b>Recherche en cours.</b> Cela prend généralement quelques secondes.",
      searchingFor: "Recherche de « {q} »",
      pubmedDown: "<b>PubMed</b> est inaccessible. Les résultats proviennent uniquement de ClinicalTrials.gov. Réessayez dans un instant.",
      trialsDown: "<b>ClinicalTrials.gov</b> est inaccessible. Les résultats proviennent uniquement de PubMed. Réessayez dans un instant.",
      bothDown: "Ni PubMed ni ClinicalTrials.gov ne sont accessibles. Vérifiez votre connexion et réessayez.",
      noResults: "Aucun résultat",
      noneFound: "Aucun chercheur trouvé pour « {q} »",
      tryBroader: "Essayez un nom plus large ou un autre nom pour ce diagnostic.",
      rorDown: "Le répertoire des organisations (ROR) est inaccessible : les sites web et numéros de téléphone des organisations manquent. Le reste des résultats est complet.",
      stopped: "Recherche arrêtée.",
      wentWrong: "Un problème est survenu lors de la préparation des résultats. Réessayez.",
      exampleNotice: "<b>Exemple de présentation.</b> Ces cinq chercheurs sont fictifs, pour montrer l'aspect des résultats regroupés par continent. Recherchez un diagnostic pour charger de vraies données.",
      exampleTitle: "Chercheurs pour « lupus » (exemple)",
    },
    pt: {
      langLabel: "Idioma",
      tagline: "Busca de especialistas em doenças raras · PubMed + ClinicalTrials.gov",
      h1: "Vamos encontrar os pesquisadores que melhor conhecem esta condição.",
      lede: "Digite um diagnóstico médico. O Fanale pesquisa no PubMed e no ClinicalTrials.gov e ordena os pesquisadores pela publicação mais recente.",
      diagLabel: "Diagnóstico médico",
      placeholder: "ex.: systemic lupus erythematosus",
      search: "Pesquisar", stop: "Parar", try: "Experimente:",
      searchHint: "Dica: pesquise com o nome médico em inglês (por exemplo, “sickle cell disease” para doença falciforme). O PubMed e o ClinicalTrials.gov indexam a pesquisa em inglês.",
      chipLupus: "Lúpus", chipHPS: "Síndrome de Hermansky-Pudlak", chipSickle: "Doença falciforme", chipFabry: "Doença de Fabry",
      stepPubmed: "Pesquisar no PubMed", stepTrials: "Pesquisar no ClinicalTrials.gov", stepDb: "Criar base de pesquisadores", stepOrg: "Buscar organizações",
      researchers: "Pesquisadores",
      dbSummary: "Base de dados temporária de pesquisadores",
      thRecent: "Mais recente", thResearcher: "Pesquisador", thOrg: "Organização", thCountry: "País", thContinent: "Continente", thEmail: "E-mail", thPhone: "Telefone", thTx: "Tratamento e medicamento", thRef: "Referência (MLA)",
      footer1: "O Fanale não é aconselhamento médico. Os dados dos pesquisadores vêm de registros públicos do PubMed, ClinicalTrials.gov, ROR, Wikidata e OpenAlex. Nenhum dado do usuário é coletado, arquivado ou compartilhado.",
      absHead: "Resumo em poucas linhas", readAbs: "Ler o resumo completo no PubMed", readTrial: "Ler o registro completo no ClinicalTrials.gov", mlaAll: "Ver todos os artigos em formato MLA", mlaTitle: "Artigos de {name}", mlaNote: "Encontrados no PubMed pelo nome do autor, do mais recente ao mais antigo. Nomes comuns podem incluir outros pesquisadores; confira antes de confiar nesta lista.", mlaLoading: "Carregando artigos…", mlaNone: "Nenhum artigo encontrado.", mlaCopyAll: "Copiar tudo", mlaPrint: "Imprimir", mlaClose: "Fechar", mlaCount: "{n} referências", tipH: "Índice h: um pesquisador tem índice h igual a h se h de seus artigos foram citados pelo menos h vezes cada um. Reflete quanto ele publica e quanto é citado.", tipWorks: "Obras: o número total de artigos, revisões e outras produções atribuídas a este pesquisador. Um número maior indica uma trajetória de publicação mais longa ou ativa, não necessariamente melhor atendimento.", tipCites: "Total de citações: quantas vezes outros pesquisadores citaram a obra publicada desta pessoa. Mais citações sugerem trabalho amplamente lido e usado, mas não medem a qualidade do atendimento.",
      footer2: "A base de dados é temporária: existe apenas nesta página enquanto ela está aberta e não é salva.",
      credit: "O Fanale foi criado pela <b>Struvante</b> · Porto Rico · © 2026",

      na: "Não consta na fonte",
      noneNamed: "Nenhum citado nos artigos ou estudos deste pesquisador",
      notRec: "Citado na pesquisa. Não é uma recomendação.",
      profileExample: "O link para buscar o perfil aparece aqui",
      findProfile: "Buscar perfil e foto",
      opensTab: "Abre uma busca na web em nova aba",
      lookingUp: "Buscando…",
      orgFromTrial: "Contato da organização obtido do contato do centro no ClinicalTrials.gov para {nct}",
      orgFromWikidata: "Contato da organização obtido do Wikidata, para {name}",
      findOrg: "Buscar contato da organização",
      opensSearch: "(abre uma busca na web)",
      unnamed: "Pesquisador sem nome",
      researcherContact: "Contato do pesquisador", phone: "Telefone", email: "E-mail", workOrg: "Organização", address: "Endereço", website: "Site",
      matchedRor: "Identificada como {name} no Research Organization Registry",
      txHead: "Tratamento e medicamento", medicine: "Medicamento", treatment: "Tratamento",
      recentTrial: "Trabalho mais recente (início do estudo)", recentPub: "Publicação mais recente",
      "North America": "América do Norte", "South America": "América do Sul", Europe: "Europa", Asia: "Ásia", Africa: "África", Oceania: "Oceania", locNotListed: "Local não informado",
      researcher1: "{n} pesquisador", researcherN: "{n} pesquisadores", record1: "{n} registro", recordN: "{n} registros",
      resultsFor: "Pesquisadores para “{q}”",
      noneWithContact: "Nenhum pesquisador com contato e tratamentos para “{q}”",
      shownSub: "{n} exibidos · até {max} por continente, mais recentes primeiro",
      stepCite: "Contar citações", rankBy: "Ordenar por:", sortTop: "Recentes + mais citados", sortCited: "Mais citados", sortNewest: "Mais recentes", citedTimes: "Citado {n} vezes", hIndex: "índice h {h}", worksN: "{n} trabalhos", citeNotFound: "Número de citações não encontrado", citePending: "Contando citações…", thCites: "Total de citações", totalCites: "Total de citações", sugDidYou: "Você quis dizer", sugLabel: "Sugestões", showBy: "Mostrar:", srcAll: "Todos", srcPub: "Publicações", srcTrial: "Ensaios", printList: "Imprimir lista", printNote: "Impresso do Fanale (Struvante). Não é aconselhamento médico: os tratamentos são os citados na pesquisa, não recomendações.", copySummary: "Copiar resumo", copied: "Copiado", copyFailed: "Não foi possível copiar", summaryIntro: "Um pesquisador para perguntar ao meu médico", filteredSub: " · {n} ocultos pelo filtro", citeDone: "{m} identificados", citeDown: "Não foi possível acessar a base de citações (OpenAlex), então faltam os números de citações e os pesquisadores são ordenados pela publicação mais recente.", shownSubCited: "{n} exibidos · até {max} por continente, mais citados primeiro", shownSubTop: "{n} exibidos · até {max} por continente, mais recentes e mais citados primeiro",
      overLimit: " · {n} a mais acima do limite",
      hiddenSub: " · {n} ocultos por falta de contato ou tratamentos (veja a base abaixo)",
      nArticles: "{n} artigos", nTrials: "{n} estudos", nResearchers: "{n} pesquisadores", orgProgress: "{done} de {total}", orgDone: "{m} identificadas · {p} telefones",
      searching: "<b>Pesquisando.</b> Isso costuma levar alguns segundos.",
      searchingFor: "Pesquisando “{q}”",
      pubmedDown: "Não foi possível acessar o <b>PubMed</b>. Os resultados vêm só do ClinicalTrials.gov. Tente novamente em instantes.",
      trialsDown: "Não foi possível acessar o <b>ClinicalTrials.gov</b>. Os resultados vêm só do PubMed. Tente novamente em instantes.",
      bothDown: "Não foi possível acessar o PubMed nem o ClinicalTrials.gov. Verifique sua conexão e tente novamente.",
      noResults: "Nenhum resultado",
      noneFound: "Nenhum pesquisador encontrado para “{q}”",
      tryBroader: "Tente um nome mais amplo ou alternativo para o diagnóstico.",
      rorDown: "Não foi possível acessar o diretório de organizações (ROR), então faltam os sites e telefones das organizações. O restante dos resultados está completo.",
      stopped: "Pesquisa interrompida.",
      wentWrong: "Algo deu errado ao preparar os resultados. Tente novamente.",
      exampleNotice: "<b>Exemplo de layout.</b> Estes cinco pesquisadores são fictícios, para mostrar como os resultados aparecem agrupados por continente. Pesquise um diagnóstico para carregar dados reais.",
      exampleTitle: "Pesquisadores para “lupus” (exemplo)",
    },
  };

  // Merge the additional languages from i18n-more.js, if loaded.
  const MORE = window.FANALE_MORE_LANGS || {};
  const RTL = new Set();
  for (const [code, l] of Object.entries(MORE)) { D[code] = l.strings; LANGS.push({ code, name: l.name }); if (l.dir === "rtl") RTL.add(code); }

  let lang = "en";
  const valid = (c) => LANGS.some((l) => l.code === c);
  // Default is English. A ?lang= link or the visitor's earlier choice can change it.
  try {
    const q = new URLSearchParams(location.search).get("lang");
    if (q && valid(q)) lang = q;
    else { const saved = localStorage.getItem("fanale-lang"); if (saved && valid(saved)) lang = saved; }
  } catch {}

  function t(key, vars) {
    let s = (D[lang] && D[lang][key]) ?? D.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split("{" + k + "}").join(String(v));
    return s;
  }
  const plural = (n, one, many) => t(n === 1 ? one : many, { n });

  function applyStatic() {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL.has(lang) ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    const hint = document.getElementById("searchHint");
    if (hint) { const h = t("searchHint"); hint.textContent = h; hint.hidden = !h; }
  }

  const listeners = [];
  function setLang(code) {
    if (!valid(code) || code === lang) return;
    lang = code;
    try { localStorage.setItem("fanale-lang", code); } catch {}
    applyStatic();
    listeners.forEach((fn) => fn(lang));
  }

  window.FanaleI18n = { LANGS, t, plural, applyStatic, setLang, getLang: () => lang, onChange: (fn) => listeners.push(fn) };
})();
