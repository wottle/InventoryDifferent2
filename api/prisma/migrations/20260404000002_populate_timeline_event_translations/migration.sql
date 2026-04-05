-- Populate German and French translations for seeded timeline events

UPDATE "TimelineEvent" SET
  "titleDe" = $$Altair 8800 erscheint$$,
  "descriptionDe" = $$MITS liefert den Altair 8800 als Bausatz aus und löst damit die Heimcomputerrevolution aus – und inspiriert Bill Gates und Paul Allen, BASIC dafür zu schreiben.$$,
  "titleFr" = $$Sortie de l'Altair 8800$$,
  "descriptionFr" = $$MITS expédie l'Altair 8800 en kit, déclenchant la révolution de l'ordinateur personnel et inspirant Bill Gates et Paul Allen à écrire BASIC pour lui.$$
WHERE "title" = 'Altair 8800 ships' AND "year" = 1975;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Apple Computer gegründet$$,
  "descriptionDe" = $$Steve Jobs, Steve Wozniak und Ronald Wayne gründen Apple Computer am 1. April. Der Apple I wird als blanke Platine verkauft.$$,
  "titleFr" = $$Fondation d'Apple Computer$$,
  "descriptionFr" = $$Steve Jobs, Steve Wozniak et Ronald Wayne fondent Apple Computer le 1er avril. L'Apple I est vendu comme simple circuit imprimé.$$
WHERE "title" = 'Apple Computer founded' AND "year" = 1976;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Apple II vorgestellt$$,
  "descriptionDe" = $$Der Apple II wird auf der West Coast Computer Faire vorgestellt – einer der ersten Massenmarkt-PCs mit Farbgrafik und offener Architektur.$$,
  "titleFr" = $$Présentation de l'Apple II$$,
  "descriptionFr" = $$L'Apple II est lancé à la West Coast Computer Faire – l'un des premiers ordinateurs personnels grand public avec graphiques couleur et architecture ouverte.$$
WHERE "title" = 'Apple II introduced' AND "year" = 1977;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Die Dreiheit von 1977$$,
  "descriptionDe" = $$Apple II, Commodore PET und TRS-80 debütieren alle – und definieren den Markt für Heimcomputer.$$,
  "titleFr" = $$La trinité de 1977$$,
  "descriptionFr" = $$L'Apple II, le Commodore PET et le TRS-80 font tous leurs débuts – définissant le marché de l'ordinateur personnel.$$
WHERE "title" = 'The 1977 Trinity' AND "year" = 1977;

UPDATE "TimelineEvent" SET
  "titleDe" = $$VisiCalc veröffentlicht$$,
  "descriptionDe" = $$Die erste Killer-App: VisiCalc, die Tabellenkalkulation, die den Apple II für Unternehmen unverzichtbar macht.$$,
  "titleFr" = $$Sortie de VisiCalc$$,
  "descriptionFr" = $$La première application incontournable : VisiCalc, le tableur qui rend l'Apple II indispensable aux entreprises.$$
WHERE "title" = 'VisiCalc released' AND "year" = 1979;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Apple geht an die Börse$$,
  "descriptionDe" = $$Apples Börsengang bringt 101 Millionen Dollar ein – der größte seit Ford 1956 – und schafft über Nacht mehr Millionäre als jedes andere Unternehmen in der Geschichte.$$,
  "titleFr" = $$Introduction en Bourse d'Apple$$,
  "descriptionFr" = $$L'introduction en Bourse d'Apple lève 101 millions de dollars – la plus importante depuis Ford en 1956 – créant plus de millionnaires en une nuit que toute autre entreprise de l'histoire.$$
WHERE "title" = 'Apple goes public' AND "year" = 1980;

UPDATE "TimelineEvent" SET
  "titleDe" = $$IBM PC vorgestellt$$,
  "descriptionDe" = $$IBM bringt den IBM Personal Computer 5150 mit PC-DOS auf den Markt. Seine offene Architektur bringt eine Klonindustrie hervor, die die Computerwelt umgestaltet.$$,
  "titleFr" = $$Présentation de l'IBM PC$$,
  "descriptionFr" = $$IBM lance l'IBM Personal Computer 5150 sous PC-DOS. Son architecture ouverte engendre une industrie de clones qui redéfinit l'informatique.$$
WHERE "title" = 'IBM PC introduced' AND "year" = 1981;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Apple Lisa vorgestellt$$,
  "descriptionDe" = $$Apples Lisa debütiert als erster kommerzieller PC mit grafischer Oberfläche und Maus – zum Preis von 9.995 Dollar.$$,
  "titleFr" = $$Présentation de l'Apple Lisa$$,
  "descriptionFr" = $$L'Apple Lisa débute comme le premier ordinateur personnel commercial doté d'une interface graphique et d'une souris – au prix de 9 995 $.$$
WHERE "title" = 'Apple Lisa introduced' AND "year" = 1983;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Macintosh 128K vorgestellt$$,
  "descriptionDe" = $$Der originale Macintosh erscheint am 24. Januar nach dem legendären '1984'-Super-Bowl-Werbespot. Er wird mit MacPaint und MacWrite geliefert und verändert die PC-Welt für immer.$$,
  "titleFr" = $$Présentation du Macintosh 128K$$,
  "descriptionFr" = $$Le Macintosh original est lancé le 24 janvier après la publicité emblématique du Super Bowl '1984'. Livré avec MacPaint et MacWrite, il révolutionne l'informatique personnelle.$$
WHERE "title" = 'Macintosh 128K introduced' AND "year" = 1984;

UPDATE "TimelineEvent" SET
  "titleDe" = $$System 1.0 veröffentlicht$$,
  "descriptionDe" = $$System 1.0 wird mit dem originalen Macintosh geliefert – ein grafisches Single-Tasking-Betriebssystem mit Finder, MacPaint und MacWrite. Es passt auf eine 400-KB-Diskette und setzt den Standard für grafische Benutzeroberflächen.$$,
  "titleFr" = $$Sortie de System 1.0$$,
  "descriptionFr" = $$System 1.0 est livré avec le Macintosh original – un OS graphique monotâche avec le Finder, MacPaint et MacWrite. Il tient sur une disquette de 400 Ko et établit le modèle des interfaces graphiques.$$
WHERE "title" = 'System 1.0 released' AND "year" = 1984;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Mac 512K (Fat Mac)$$,
  "descriptionDe" = $$Apple veröffentlicht den Macintosh 512K mit viermal so viel RAM wie das Original – daher der Spitzname 'Fat Mac'.$$,
  "titleFr" = $$Mac 512K (Fat Mac)$$,
  "descriptionFr" = $$Apple lance le Macintosh 512K, quadruplant la RAM par rapport à l'original, lui valant le surnom de 'Fat Mac'.$$
WHERE "title" = 'Mac 512K (Fat Mac)' AND "year" = 1984;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Steve Jobs verlässt Apple$$,
  "descriptionDe" = $$Jobs tritt nach einem Machtkampf im Vorstand von Apple zurück und gründet NeXT Computer.$$,
  "titleFr" = $$Steve Jobs quitte Apple$$,
  "descriptionFr" = $$Jobs démissionne d'Apple après une lutte de pouvoir au conseil d'administration et fonde NeXT Computer.$$
WHERE "title" = 'Steve Jobs leaves Apple' AND "year" = 1985;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Windows 1.0 erscheint$$,
  "descriptionDe" = $$Microsoft liefert Windows 1.0 aus, eine grafische Oberfläche für MS-DOS – scharf kritisiert, aber der Beginn einer 40-jährigen Plattform.$$,
  "titleFr" = $$Sortie de Windows 1.0$$,
  "descriptionFr" = $$Microsoft lance Windows 1.0, une interface graphique pour MS-DOS – très critiquée, mais le début d'une plateforme vieille de 40 ans.$$
WHERE "title" = 'Windows 1.0 ships' AND "year" = 1985;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Mac Plus vorgestellt$$,
  "descriptionDe" = $$Der Mac Plus bringt 1 MB RAM, SCSI und eine verbesserte Tastatur – und wird zum am längsten verkauften Mac-Modell mit fast 5 Jahren Laufzeit.$$,
  "titleFr" = $$Présentation du Mac Plus$$,
  "descriptionFr" = $$Le Mac Plus apporte 1 Mo de RAM, le SCSI et un clavier amélioré – devenant le modèle Mac le plus longtemps vendu pendant près de 5 ans.$$
WHERE "title" = 'Mac Plus introduced' AND "year" = 1986;

UPDATE "TimelineEvent" SET
  "titleDe" = $$System 3.0 veröffentlicht$$,
  "descriptionDe" = $$System 3.0 führt das Hierarchical File System (HFS) ein, ersetzt das flache MFS und ermöglicht Ordner in Ordnern – eine grundlegende Änderung, die das Mac-Dateisystem für Festplatten praktikabel machte.$$,
  "titleFr" = $$Sortie de System 3.0$$,
  "descriptionFr" = $$System 3.0 introduit le Hierarchical File System (HFS), remplaçant le MFS plat et permettant les dossiers imbriqués – un changement fondamental qui a rendu le système de fichiers Mac pratique pour les disques durs.$$
WHERE "title" = 'System 3.0 released' AND "year" = 1986;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Mac II und SE vorgestellt$$,
  "descriptionDe" = $$Apple stellt den modularen Mac II mit Farbunterstützung und NuBus-Erweiterungssteckplätzen vor, zusammen mit dem kompakten Mac SE.$$,
  "titleFr" = $$Présentation du Mac II et du Mac SE$$,
  "descriptionFr" = $$Apple présente le Mac II modulaire avec support couleur et emplacements NuBus, ainsi que le Mac SE compact.$$
WHERE "title" = 'Mac II and SE introduced' AND "year" = 1987;

UPDATE "TimelineEvent" SET
  "titleDe" = $$HyperCard veröffentlicht$$,
  "descriptionDe" = $$Apple liefert HyperCard aus, ein bahnbrechendes Hypermedia-Werkzeug, das das World Wide Web vorwegnimmt.$$,
  "titleFr" = $$Sortie de HyperCard$$,
  "descriptionFr" = $$Apple lance HyperCard, un outil hypermédia révolutionnaire qui préfigure le World Wide Web.$$
WHERE "title" = 'HyperCard released' AND "year" = 1987;

UPDATE "TimelineEvent" SET
  "titleDe" = $$System 6.0 veröffentlicht$$,
  "descriptionDe" = $$System 6.0 integriert MultiFinder und ermöglicht erstmals das gleichzeitige Ausführen mehrerer Anwendungen. Schlank, stabil und schnell – es wurde das definitive Betriebssystem der klassischen kompakten Mac-Ära.$$,
  "titleFr" = $$Sortie de System 6.0$$,
  "descriptionFr" = $$System 6.0 intègre MultiFinder, permettant pour la première fois d'exécuter plusieurs applications simultanément. Léger, stable et rapide, il devient l'OS de référence de l'ère Mac compact classique.$$
WHERE "title" = 'System 6.0 released' AND "year" = 1988;

UPDATE "TimelineEvent" SET
  "titleDe" = $$NeXT Computer vorgestellt$$,
  "descriptionDe" = $$Steve Jobs präsentiert den NeXT Computer – eine elegante Workstation mit optischem Laufwerk und objektorientiertem OS, das später die Grundlage von macOS bildet.$$,
  "titleFr" = $$Présentation du NeXT Computer$$,
  "descriptionFr" = $$Steve Jobs présente le NeXT Computer – une élégante station de travail avec lecteur optique et OS orienté objet, qui deviendra la base de macOS.$$
WHERE "title" = 'NeXT Computer unveiled' AND "year" = 1988;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Mac IIci und Mac Portable$$,
  "descriptionDe" = $$Apple veröffentlicht den Mac IIci (seinen populärsten Desktop der Ära) und den Mac Portable – den ersten batteriebetriebenen Macintosh.$$,
  "titleFr" = $$Mac IIci et Mac Portable$$,
  "descriptionFr" = $$Apple lance le Mac IIci (son bureau le plus populaire de l'époque) et le Mac Portable – le premier Macintosh alimenté par batterie.$$
WHERE "title" = 'Mac IIci and Mac Portable' AND "year" = 1989;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Mac LC und Classic vorgestellt$$,
  "descriptionDe" = $$Apple richtet sich mit dem erschwinglichen Mac LC an den Bildungsmarkt und bringt mit dem Macintosh Classic ein kompaktes klassisches Design zurück.$$,
  "titleFr" = $$Présentation du Mac LC et du Classic$$,
  "descriptionFr" = $$Apple cible l'éducation avec le Mac LC abordable et renoue avec un design compact classique avec le Macintosh Classic.$$
WHERE "title" = 'Mac LC and Classic introduced' AND "year" = 1990;

UPDATE "TimelineEvent" SET
  "titleDe" = $$PowerBook 100/140/170 Debüt$$,
  "descriptionDe" = $$Apples wegweisende PowerBook-Linie definiert die moderne Laptop-Form mit Trackball, Handballenauflage und zentrierter Tastatur.$$,
  "titleFr" = $$Débuts des PowerBook 100/140/170$$,
  "descriptionFr" = $$La gamme PowerBook d'Apple définit le format moderne de l'ordinateur portable avec trackball, repose-poignets et clavier centré.$$
WHERE "title" = 'PowerBook 100/140/170 debut' AND "year" = 1991;

UPDATE "TimelineEvent" SET
  "titleDe" = $$System 7 veröffentlicht$$,
  "descriptionDe" = $$System 7 bringt Farbe, virtuellen Speicher, Netzwerkfähigkeit und Aliase für das Mac-Betriebssystem – ein großer Sprung für die Plattform.$$,
  "titleFr" = $$Sortie de System 7$$,
  "descriptionFr" = $$System 7 apporte couleur, mémoire virtuelle, mise en réseau et alias au Mac OS – un bond majeur pour la plateforme.$$
WHERE "title" = 'System 7 released' AND "year" = 1991;

UPDATE "TimelineEvent" SET
  "titleDe" = $$World Wide Web wird öffentlich$$,
  "descriptionDe" = $$Tim Berners-Lee öffnet das World Wide Web für die Öffentlichkeit am CERN – entwickelt auf einer NeXT-Workstation.$$,
  "titleFr" = $$Le World Wide Web devient public$$,
  "descriptionFr" = $$Tim Berners-Lee ouvre le World Wide Web au public depuis le CERN – développé sur une station de travail NeXT.$$
WHERE "title" = 'World Wide Web goes public' AND "year" = 1991;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Apple Newton MessagePad$$,
  "descriptionDe" = $$Apple stellt den Newton MessagePad vor, einen frühen PDA mit Handschrifterkennung – ehrgeizig, kontrovers und seiner Zeit voraus.$$,
  "titleFr" = $$Apple Newton MessagePad$$,
  "descriptionFr" = $$Apple présente le Newton MessagePad, un PDA pionnier avec reconnaissance d'écriture manuscrite – ambitieux, controversé et en avance sur son temps.$$
WHERE "title" = 'Apple Newton MessagePad' AND "year" = 1993;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Mosaic-Browser veröffentlicht$$,
  "descriptionDe" = $$NCSA Mosaic macht das Web grafisch und zugänglich und löst den Internetboom der 1990er Jahre aus.$$,
  "titleFr" = $$Sortie du navigateur Mosaic$$,
  "descriptionFr" = $$NCSA Mosaic rend le Web graphique et accessible, déclenchant le boom d'Internet dans les années 1990.$$
WHERE "title" = 'Mosaic browser released' AND "year" = 1993;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Power Macintosh vorgestellt$$,
  "descriptionDe" = $$Apple liefert die ersten Power Macs mit dem IBM/Motorola PowerPC-Chip – die erste von drei großen Mac-Architekturübergängen.$$,
  "titleFr" = $$Présentation du Power Macintosh$$,
  "descriptionFr" = $$Apple lance les premiers Power Mac avec la puce PowerPC IBM/Motorola – la première des trois grandes transitions d'architecture Mac.$$
WHERE "title" = 'Power Macintosh introduced' AND "year" = 1994;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Mac OS 7.5 veröffentlicht$$,
  "descriptionDe" = $$Mac OS 7.5 ist die funktionsreichste System-7-Version mit Apple Guide, WindowShade und Macintosh Drag-and-Drop. Apple stellte es später als kostenlosen Download bereit – eine seltene Geste, die ältere Macs bis Ende der 90er nützlich hielt.$$,
  "titleFr" = $$Sortie de Mac OS 7.5$$,
  "descriptionFr" = $$Mac OS 7.5 est la version System 7 la plus complète, ajoutant Apple Guide, WindowShade et le glisser-déposer Macintosh. Apple l'a ensuite proposé en téléchargement gratuit – un geste rare qui a maintenu les vieux Mac utiles jusqu'à la fin des années 90.$$
WHERE "title" = 'Mac OS 7.5 released' AND "year" = 1994;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Windows 95 erscheint$$,
  "descriptionDe" = $$Windows 95 erscheint unter großem Jubel und führt das Startmenü, 32-Bit-Multitasking und Plug-and-Play-Hardware ein.$$,
  "titleFr" = $$Lancement de Windows 95$$,
  "descriptionFr" = $$Windows 95 sort avec un grand battage médiatique, introduisant le menu Démarrer, le multitâche 32 bits et le matériel plug-and-play.$$
WHERE "title" = 'Windows 95 launches' AND "year" = 1995;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Apple übernimmt NeXT$$,
  "descriptionDe" = $$Apple kauft NeXT für 429 Millionen Dollar und bringt damit Steve Jobs nach Cupertino zurück sowie die Grundlage für das spätere Mac OS X.$$,
  "titleFr" = $$Apple rachète NeXT$$,
  "descriptionFr" = $$Apple achète NeXT pour 429 millions de dollars, ramenant Steve Jobs à Cupertino et posant les fondations de ce qui deviendra Mac OS X.$$
WHERE "title" = 'Apple acquires NeXT' AND "year" = 1996;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Mac OS 7.6 veröffentlicht$$,
  "descriptionDe" = $$Mac OS 7.6 ist die erste Version, die offiziell als 'Mac OS' statt 'System' bezeichnet wird, und markiert das Ende der klassischen System-Software-Benennung. Sie strich auch die Unterstützung für 68000-basierte Macs.$$,
  "titleFr" = $$Sortie de Mac OS 7.6$$,
  "descriptionFr" = $$Mac OS 7.6 est la première version officiellement baptisée 'Mac OS' plutôt que 'System', marquant la fin de l'ère du logiciel système classique. Elle supprime aussi le support des Mac basés sur le 68000.$$
WHERE "title" = 'Mac OS 7.6 released' AND "year" = 1997;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Jobs kehrt als CEO zurück$$,
  "descriptionDe" = $$Steve Jobs wird Apples Interims-CEO. Er streicht Newton, konsolidiert das Produktportfolio auf vier Quadranten und startet die Think-Different-Kampagne.$$,
  "titleFr" = $$Jobs revient en tant que PDG$$,
  "descriptionFr" = $$Steve Jobs devient PDG par intérim d'Apple. Il supprime Newton, consolide la gamme en quatre quadrants et lance la campagne Think Different.$$
WHERE "title" = 'Jobs returns as CEO' AND "year" = 1997;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Mac OS 8 veröffentlicht$$,
  "descriptionDe" = $$Mac OS 8 erscheint als großes Update, das Apple separat verkaufen kann – wodurch die Macintosh-Klonlizenzverträge umgangen werden – und bringt in den ersten zwei Wochen 100 Millionen Dollar ein. Das beendet effektiv die Klon-Ära.$$,
  "titleFr" = $$Sortie de Mac OS 8$$,
  "descriptionFr" = $$Mac OS 8 est une mise à jour majeure qu'Apple peut vendre séparément, contournant les accords de licence des clones Macintosh et générant 100 millions de dollars en deux semaines, mettant fin à l'ère des clones.$$
WHERE "title" = 'Mac OS 8 released' AND "year" = 1997;

UPDATE "TimelineEvent" SET
  "titleDe" = $$iMac G3 vorgestellt$$,
  "descriptionDe" = $$Der durchsichtige Bondi-Blue iMac G3 wird auf der Macworld vorgestellt, stellt Apples Design-Glaubwürdigkeit wieder her und bringt das Unternehmen zurück in die Gewinnzone.$$,
  "titleFr" = $$Présentation de l'iMac G3$$,
  "descriptionFr" = $$L'iMac G3 translucide bleu Bondi est lancé à la Macworld, restaurant la crédibilité design d'Apple et ramenant l'entreprise à la rentabilité.$$
WHERE "title" = 'iMac G3 introduced' AND "year" = 1998;

UPDATE "TimelineEvent" SET
  "titleDe" = $$iBook G3 (Clamshell) und AirPort$$,
  "descriptionDe" = $$Das farbenfrohe Clamshell-iBook überträgt Apples Design auf Laptops; AirPort macht Consumer-WLAN zwei Jahre vor der Konkurrenz zum Massenprodukt.$$,
  "titleFr" = $$iBook G3 (Clamshell) et AirPort$$,
  "descriptionFr" = $$L'iBook coquille colorée apporte le langage design d'Apple aux portables ; AirPort démocratise le Wi-Fi grand public deux ans avant la concurrence.$$
WHERE "title" = 'iBook G3 (Clamshell) and AirPort' AND "year" = 1999;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Mac OS 9 veröffentlicht$$,
  "descriptionDe" = $$Mac OS 9 erscheint als letzte große Classic-Mac-OS-Version mit Keychain, Sherlock 2 und Multi-User-Unterstützung – später die Kompatibilitätsschicht in Mac OS X's Classic-Umgebung.$$,
  "titleFr" = $$Sortie de Mac OS 9$$,
  "descriptionFr" = $$Mac OS 9 arrive comme la dernière grande version de Mac OS classique, ajoutant Keychain, Sherlock 2 et le support multi-utilisateurs – servant ensuite de couche de compatibilité dans l'environnement Classic de Mac OS X.$$
WHERE "title" = 'Mac OS 9 released' AND "year" = 1999;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Power Mac G4 Cube$$,
  "descriptionDe" = $$Der G4 Cube beeindruckt mit seinem lautlosen, grifflosen 20-cm-Würfeldesign – ein Designerfolg, aber ein kommerzieller Misserfolg.$$,
  "titleFr" = $$Power Mac G4 Cube$$,
  "descriptionFr" = $$Le G4 Cube impressionne par son design en cube de 20 cm, silencieux et sans poignée – un triomphe du design mais une déception commerciale.$$
WHERE "title" = 'Power Mac G4 Cube' AND "year" = 2000;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Mac OS X 10.0 erscheint$$,
  "descriptionDe" = $$Mac OS X debütiert mit seiner Aqua-Oberfläche und Unix-Kern – ein klarer Bruch mit dem Classic Mac OS und die Grundlage für die nächsten 25+ Jahre.$$,
  "titleFr" = $$Sortie de Mac OS X 10.0$$,
  "descriptionFr" = $$Mac OS X fait ses débuts avec son interface Aqua et son noyau Unix – une rupture nette avec le Mac OS classique et la base des 25 années suivantes.$$
WHERE "title" = 'Mac OS X 10.0 ships' AND "year" = 2001;

UPDATE "TimelineEvent" SET
  "titleDe" = $$iPod vorgestellt$$,
  "descriptionDe" = $$Der originale iPod mit Scroll Wheel wird am 23. Oktober vorgestellt und leitet Apples Wandlung zum Consumer-Electronics-Unternehmen ein.$$,
  "titleFr" = $$Présentation de l'iPod$$,
  "descriptionFr" = $$L'iPod original avec sa molette est lancé le 23 octobre, marquant la transformation d'Apple en entreprise d'électronique grand public.$$
WHERE "title" = 'iPod introduced' AND "year" = 2001;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Erste Apple Retail Stores eröffnen$$,
  "descriptionDe" = $$Apple eröffnet seine ersten beiden Einzelhandelsgeschäfte in Tysons Corner, VA und Glendale, CA am 19. Mai.$$,
  "titleFr" = $$Ouverture des premiers Apple Retail Stores$$,
  "descriptionFr" = $$Apple ouvre ses deux premiers magasins de vente au détail à Tysons Corner (Virginie) et Glendale (Californie) le 19 mai.$$
WHERE "title" = 'First Apple Retail Stores open' AND "year" = 2001;

UPDATE "TimelineEvent" SET
  "titleDe" = $$iMac G4 (Lampe) vorgestellt$$,
  "descriptionDe" = $$Das schwebende Flachbildschirm-Display des iMac G4 auf einem verchromten Arm wird zu einem der ikonischsten Designmeilensteine der Computergeschichte.$$,
  "titleFr" = $$Présentation de l'iMac G4 (Lampe)$$,
  "descriptionFr" = $$L'écran plat flottant de l'iMac G4 sur un bras chromé devient l'un des jalons design les plus emblématiques de l'histoire informatique.$$
WHERE "title" = 'iMac G4 (Lamp) introduced' AND "year" = 2002;

UPDATE "TimelineEvent" SET
  "titleDe" = $$iTunes Store eröffnet$$,
  "descriptionDe" = $$Apple startet den iTunes Music Store mit 200.000 Songs zu je 99 Cent und krempelt damit die Musikindustrie um.$$,
  "titleFr" = $$Ouverture de l'iTunes Store$$,
  "descriptionFr" = $$Apple lance l'iTunes Music Store avec 200 000 chansons à 99 cents chacune, bouleversant l'industrie musicale.$$
WHERE "title" = 'iTunes Store opens' AND "year" = 2003;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Power Mac G5 vorgestellt$$,
  "descriptionDe" = $$Der Aluminium-Power-Mac-G5 debütiert mit IBMs 64-Bit-G5-Chip – Apples leistungsstärkster Desktop bis dahin und der letzte PowerPC-Tower.$$,
  "titleFr" = $$Présentation du Power Mac G5$$,
  "descriptionFr" = $$Le Power Mac G5 en aluminium débute avec la puce 64 bits G5 d'IBM – le bureau Apple le plus puissant de l'époque et la dernière tour PowerPC.$$
WHERE "title" = 'Power Mac G5 introduced' AND "year" = 2003;

UPDATE "TimelineEvent" SET
  "titleDe" = $$iMac G5 vorgestellt$$,
  "descriptionDe" = $$Der iMac G5 verlagert alle Komponenten hinter das Display und nimmt damit die moderne All-in-One-Formgebung vorweg.$$,
  "titleFr" = $$Présentation de l'iMac G5$$,
  "descriptionFr" = $$L'iMac G5 déplace tous les composants derrière l'écran, préfigurant le format tout-en-un moderne.$$
WHERE "title" = 'iMac G5 introduced' AND "year" = 2004;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Mac mini und iPod nano Debüt$$,
  "descriptionDe" = $$Apple bringt den Mac mini (günstigster Mac aller Zeiten) und den ultradünnen iPod nano heraus – tausend Songs in der Tasche, noch kleiner.$$,
  "titleFr" = $$Débuts du Mac mini et de l'iPod nano$$,
  "descriptionFr" = $$Apple lance le Mac mini (le Mac le moins cher jamais conçu) et l'ultra-fin iPod nano – mille chansons dans votre poche, encore plus petit.$$
WHERE "title" = 'Mac mini and iPod nano debut' AND "year" = 2005;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Intel-Mac-Übergang abgeschlossen$$,
  "descriptionDe" = $$Apple liefert MacBook Pro und iMac mit Intel-Core-Duo-Prozessoren und schließt damit den PowerPC-zu-Intel-Übergang in nur 7 Monaten ab.$$,
  "titleFr" = $$Transition Intel Mac achevée$$,
  "descriptionFr" = $$Apple livre le MacBook Pro et l'iMac avec des puces Intel Core Duo, achevant la transition de PowerPC vers Intel en seulement 7 mois.$$
WHERE "title" = 'Intel Mac transition complete' AND "year" = 2006;

UPDATE "TimelineEvent" SET
  "titleDe" = $$iPhone vorgestellt$$,
  "descriptionDe" = $$Steve Jobs stellt das originale iPhone am 9. Januar vor – ein iPod, ein Telefon und ein Internet-Kommunikationsgerät – und definiert die Mobilbranche neu.$$,
  "titleFr" = $$Présentation de l'iPhone$$,
  "descriptionFr" = $$Steve Jobs présente l'iPhone original le 9 janvier – un iPod, un téléphone et un communicateur Internet – redéfinissant l'industrie mobile.$$
WHERE "title" = 'iPhone introduced' AND "year" = 2007;

UPDATE "TimelineEvent" SET
  "titleDe" = $$MacBook Air und App Store$$,
  "descriptionDe" = $$Das originale MacBook Air gleitet auf der Macworld aus einem Briefumschlag; sechs Monate später startet der App Store mit 500 Apps.$$,
  "titleFr" = $$MacBook Air et App Store$$,
  "descriptionFr" = $$Le MacBook Air original glisse hors d'une enveloppe à la Macworld ; six mois plus tard, l'App Store lance avec 500 applications.$$
WHERE "title" = 'MacBook Air and App Store' AND "year" = 2008;

UPDATE "TimelineEvent" SET
  "titleDe" = $$iPad vorgestellt$$,
  "descriptionDe" = $$Das originale iPad erscheint und schafft den modernen Tablet-Markt, der zur am schnellsten wachsenden Produktlinie Apples aller Zeiten wird.$$,
  "titleFr" = $$Présentation de l'iPad$$,
  "descriptionFr" = $$L'iPad original est lancé, créant le marché moderne des tablettes et devenant la gamme de produits Apple à la croissance la plus rapide.$$
WHERE "title" = 'iPad introduced' AND "year" = 2010;

UPDATE "TimelineEvent" SET
  "titleDe" = $$iCloud, Siri und Steve Jobs$$,
  "descriptionDe" = $$iOS 5 bringt iCloud; das iPhone 4S führt Siri ein. Steve Jobs stirbt am 5. Oktober im Alter von 56 Jahren – am Tag nach der iPhone-4S-Ankündigung.$$,
  "titleFr" = $$iCloud, Siri et Steve Jobs$$,
  "descriptionFr" = $$iOS 5 apporte iCloud ; l'iPhone 4S introduit Siri. Steve Jobs s'éteint le 5 octobre à l'âge de 56 ans, le lendemain de l'annonce de l'iPhone 4S.$$
WHERE "title" = 'iCloud, Siri, and Steve Jobs' AND "year" = 2011;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Retina MacBook Pro und iPhone 5$$,
  "descriptionDe" = $$Apple stellt das erste MacBook Pro mit Retina-Display vor sowie das schlankere iPhone 5 mit Lightning-Anschluss.$$,
  "titleFr" = $$MacBook Pro Retina et iPhone 5$$,
  "descriptionFr" = $$Apple présente le premier MacBook Pro avec écran Retina et l'iPhone 5, plus fin et plus léger, avec connecteur Lightning.$$
WHERE "title" = 'Retina MacBook Pro and iPhone 5' AND "year" = 2012;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Mac Pro (Mülleimer)$$,
  "descriptionDe" = $$Der radikale zylindrische Mac Pro mit Dual-GPU wird vorgestellt – leistungsstark und schön, aber wegen seines thermischen Dead-End-Designs kritisiert.$$,
  "titleFr" = $$Mac Pro (Poubelle)$$,
  "descriptionFr" = $$Le radical Mac Pro cylindrique avec double GPU est lancé – puissant et élégant, mais critiqué pour sa conception thermique sans issue.$$
WHERE "title" = 'Mac Pro (Trash Can)' AND "year" = 2013;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Swift-Programmiersprache$$,
  "descriptionDe" = $$Apple open-sourct Swift, seine neue moderne Programmiersprache, die Objective-C für iOS- und Mac-Entwicklung ablösen soll.$$,
  "titleFr" = $$Langage de programmation Swift$$,
  "descriptionFr" = $$Apple open-source Swift, son nouveau langage de programmation moderne conçu pour remplacer Objective-C dans le développement iOS et Mac.$$
WHERE "title" = 'Swift programming language' AND "year" = 2014;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Apple Watch und 12-Zoll-MacBook$$,
  "descriptionDe" = $$Die Apple Watch betritt den Wearables-Markt; das neue MacBook führt ein Nur-USB-C-Design und die kontroverse Butterfly-Tastatur ein.$$,
  "titleFr" = $$Apple Watch et MacBook 12 pouces$$,
  "descriptionFr" = $$L'Apple Watch entre sur le marché des wearables ; le nouveau MacBook introduit un design tout USB-C et le controversé clavier papillon.$$
WHERE "title" = 'Apple Watch and 12-inch MacBook' AND "year" = 2015;

UPDATE "TimelineEvent" SET
  "titleDe" = $$iMac Pro und iPhone X$$,
  "descriptionDe" = $$Der iMac Pro bringt Workstation-Leistung in einem All-in-One; das iPhone X verzichtet auf Touch ID zugunsten von Face ID und einem OLED-randlosen Display.$$,
  "titleFr" = $$iMac Pro et iPhone X$$,
  "descriptionFr" = $$L'iMac Pro apporte des performances de station de travail dans un tout-en-un ; l'iPhone X abandonne Touch ID pour Face ID et un écran OLED bord à bord.$$
WHERE "title" = 'iMac Pro and iPhone X' AND "year" = 2017;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Mac Pro (Käsereibe) kehrt zurück$$,
  "descriptionDe" = $$Der Tower Mac Pro kehrt mit seinem ikonischen Käsereiben-Design und vollständiger modularer Erweiterbarkeit zurück, mit bis zu 1,5 TB RAM.$$,
  "titleFr" = $$Retour du Mac Pro (grille de fromage)$$,
  "descriptionFr" = $$Le Mac Pro tour revient avec son design iconique en grille de fromage et une expansibilité modulaire complète, jusqu'à 1,5 To de RAM.$$
WHERE "title" = 'Mac Pro (cheese grater) returns' AND "year" = 2019;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Apple Silicon M1$$,
  "descriptionDe" = $$Apple stellt den M1-Chip vor und schließt den Intel-zu-Apple-Silicon-Übergang in Rekordzeit ab. Das M1 MacBook Air läuft kühl und geräuschlos ohne Lüfter.$$,
  "titleFr" = $$Apple Silicon M1$$,
  "descriptionFr" = $$Apple présente la puce M1, achevant la transition d'Intel vers Apple Silicon en un temps record. Le MacBook Air M1 fonctionne sans bruit ni ventilateur.$$
WHERE "title" = 'Apple Silicon M1' AND "year" = 2020;

UPDATE "TimelineEvent" SET
  "titleDe" = $$M1 Pro, Max und neu gestaltete MacBook Pros$$,
  "descriptionDe" = $$Apples M1-Pro- und Max-Chips betreiben neu gestaltete MacBook Pros, die MagSafe, HDMI und SD-Kartenslots zurückbringen – und die Touch Bar verabschieden.$$,
  "titleFr" = $$M1 Pro, Max et MacBook Pro redessinés$$,
  "descriptionFr" = $$Les puces M1 Pro et Max d'Apple propulsent des MacBook Pro redessinés qui ramènent MagSafe, HDMI et les slots SD – et retirent la Touch Bar.$$
WHERE "title" = 'M1 Pro, Max, and redesigned MacBook Pros' AND "year" = 2021;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Mac Studio und M1 Ultra$$,
  "descriptionDe" = $$Das Mac Studio füllt die Lücke zwischen Mac mini und Mac Pro; M1 Ultra verbindet zwei M1-Max-Dies zur leistungsstärksten Consumer-Chip, den Apple je ausgeliefert hat.$$,
  "titleFr" = $$Mac Studio et M1 Ultra$$,
  "descriptionFr" = $$Le Mac Studio comble l'écart entre le Mac mini et le Mac Pro ; le M1 Ultra fusionne deux puces M1 Max pour former la puce grand public la plus puissante jamais livrée par Apple.$$
WHERE "title" = 'Mac Studio and M1 Ultra' AND "year" = 2022;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Apple Vision Pro angekündigt$$,
  "descriptionDe" = $$Apple kündigt Vision Pro an – seine erste neue Produktkategorie seit der Apple Watch – ein Spatial-Computing-Headset ab 3.499 Dollar.$$,
  "titleFr" = $$Annonce de l'Apple Vision Pro$$,
  "descriptionFr" = $$Apple annonce le Vision Pro – sa première nouvelle catégorie de produit depuis l'Apple Watch – un casque de calcul spatial à partir de 3 499 $.$$
WHERE "title" = 'Apple Vision Pro announced' AND "year" = 2023;

UPDATE "TimelineEvent" SET
  "titleDe" = $$Apple Intelligence und M4-Macs$$,
  "descriptionDe" = $$Apple liefert On-Device-KI-Funktionen als Apple Intelligence und stellt seine Mac-Produktlinie auf M4-Chips um.$$,
  "titleFr" = $$Apple Intelligence et Macs M4$$,
  "descriptionFr" = $$Apple propose des fonctionnalités d'IA embarquées avec Apple Intelligence et fait migrer sa gamme Mac vers les puces M4.$$
WHERE "title" = 'Apple Intelligence and M4 Macs' AND "year" = 2024;
