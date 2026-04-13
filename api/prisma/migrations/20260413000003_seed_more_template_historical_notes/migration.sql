-- Seed additional historical notes on templates (idempotent — only updates templates with no notes yet)

-- NeXT machines
UPDATE "Template" SET "historicalNotes" = 'The machine Steve Jobs built after Apple fired him. A 68030 in a 12-inch magnesium cube, running NeXTSTEP — a UNIX-based operating system with a display server, object-oriented frameworks, and an interface so far ahead of its time that developers wept when Apple eventually shipped it as macOS. The $6,500 price kept it off most desks, but in universities and research labs it changed how software was written. Tim Berners-Lee used one to invent the World Wide Web.'
  WHERE name IN ('NeXT Cube', 'NeXTcube') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The Turbo upgrade brought a 68040 to the NeXT Cube, pushing it closer to workstation performance at a time when 68040 systems were still rare. NeXT positioned it as their professional high-end option alongside the more affordable NeXTstation. Few were made; fewer survive.'
  WHERE name IN ('NeXTcube Turbo') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The ''affordable'' NeXT — $4,995 instead of $6,500, and slab-shaped instead of cubic, but running the same NeXTSTEP operating system and the same 68040 processor. The NeXTstation was deployed heavily in universities, financial institutions, and research labs throughout the early 1990s. Most of the internet infrastructure concepts that became mainstream in the late 1990s were prototyped and proven on machines exactly like this one.'
  WHERE name IN ('NeXTstation') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The color variant of the NeXTstation, adding a 17-inch NeXT MegaPixel Color Display capable of 4,096 simultaneous colors. Color workstations were still a premium product in 1992; most competing systems required separate graphics hardware at additional cost. The NeXTstation Color bundled everything into the same slab form factor.'
  WHERE name IN ('NeXTstation Color') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The Turbo variants of the NeXTstation upgraded from the 25 MHz 68040 to a faster processor, extending the platform''s useful life into the mid-1990s. By then, NeXTSTEP was also running on Intel hardware — but the original NeXT machines retained a performance advantage for NeXT-native software.'
  WHERE name IN ('NeXTstation Turbo', 'NeXTstation Turbo Color') AND "historicalNotes" IS NULL;

-- Macintosh XL (Lisa upgrade)
UPDATE "Template" SET "historicalNotes" = 'Apple''s attempt to rescue the Lisa by rebranding it as the Macintosh XL — a Mac with a larger screen and more storage, sold at a reduced price to clear inventory. MacWorks software let it run Mac applications, but the underlying hardware was still Lisa hardware: slower than the Mac II, incompatible with standard Mac expansion. Apple discontinued it in April 1985 and buried thousands of unsold units in a Utah landfill.'
  WHERE name IN ('Macintosh XL') AND "historicalNotes" IS NULL;

-- Macintosh Classic (original)
UPDATE "Template" SET "historicalNotes" = 'Apple''s answer to the question of how cheap a Mac could be. The Classic ran the same 8 MHz 68000 as the original 1984 Macintosh — six years of engineering progress had lowered the price without improving the processor. At $999, it was the first Mac under $1,000 and the machine that put Apple into schools and budget-conscious homes throughout the early 1990s. Uncomplicated and reliable, if not fast.'
  WHERE name IN ('Macintosh Classic') AND "historicalNotes" IS NULL;

-- Mac II family extensions
UPDATE "Template" SET "historicalNotes" = 'The IIx upgraded the original Mac II''s 68020 to a 68030, bringing a faster MMU and math performance without changing the chassis or NuBus architecture. Released in 1988, it was immediately overshadowed by the IIcx released at the same time — smaller, cheaper, with the same processor. The IIx was for customers who had already invested in the larger II''s six-slot expansion and didn''t want to downgrade.'
  WHERE name IN ('Macintosh IIx') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The IIvi was Apple''s entry-level 68030 tower in 1992 — clocked at 16 MHz to keep costs down, a decision that made it noticeably slower than its sibling the IIvx. Critics were unkind. Apple''s own engineers called the clock speed limitation a mistake. It served budget-constrained offices that needed a modular Mac but couldn''t afford the IIci or the Quadra line.'
  WHERE name IN ('Macintosh IIvi') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The IIvx was the final 68030 Mac tower, and the first Mac to include a CD-ROM drive as standard equipment. At 32 MHz it was a capable machine, but it arrived as the Quadra line was redefining what a professional Mac could do — and its cache-less bus architecture made it slower in practice than the IIci it replaced. Notable as the transitional product between the Mac II era and the Quadra era.'
  WHERE name IN ('Macintosh IIvx') AND "historicalNotes" IS NULL;

-- Macintosh LC family
UPDATE "Template" SET "historicalNotes" = 'The first affordable color Mac — $2,499 with a 12-inch RGB monitor in 1990, compared to $3,700 for the IIsi. The LC used a 16 MHz 68020 (not the 68030 in the IIsi) and a single PDS slot, but it brought color to schools and homes for the first time. The ''LC'' stood for ''Low Cost,'' which Apple never officially acknowledged. Teachers and students who learned on an LC in the early 1990s remember it fondly despite its limitations.'
  WHERE name IN ('Macintosh LC') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The LC II improved the original LC with a 68030 processor but kept the same 16 MHz clock speed and single PDS expansion slot. It was Apple''s workhorse education machine throughout 1992 and 1993, deployed in schools across North America and widely used for the first experiments in classroom computing. Incremental, reliable, and everywhere.'
  WHERE name IN ('Macintosh LC II') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The LC III bumped the processor to 25 MHz and the address bus to 32-bit, allowing it to address more RAM than its predecessors. It was the most capable low-cost Mac Apple had built to that point, and it bridged the consumer LC line forward into the Quadra era. The LC III+ later pushed to 33 MHz, making it the fastest 68030 LC before the transition to 68040-based LC models.'
  WHERE name IN ('Macintosh LC III', 'Macintosh LC III+') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The LC 475 put a full 25 MHz 68040 into the affordable LC chassis — the same processor as the Quadra 605, in the same small case, at an education-focused price. It was Apple''s most capable low-cost desktop of 1993 and became the standard computer in many schools well into the mid-1990s. A significant machine for anyone who learned computing in that era.'
  WHERE name IN ('Macintosh LC 475') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The LC 520 was Apple''s first all-in-one color Mac since the Color Classic, combining an LC motherboard with a built-in 14-inch Sony Trinitron display. It was designed for education — no desk space wasted on a separate monitor, easy to move between classrooms. The 520 and its successors (the 550, 575, 580) became the standard form factor for classroom Macs throughout the mid-1990s.'
  WHERE name IN ('Macintosh LC 520') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The LC 550 replaced the 520 with a faster 33 MHz 68030 and 4MB of RAM standard. In 1993 and 1994, it was the all-in-one Mac in most elementary school classrooms — familiar, reliable, and capable enough to run Oregon Trail, ClarisWorks, and HyperCard simultaneously. Millions of children learned to type on machines exactly like this one.'
  WHERE name IN ('Macintosh LC 550') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The LC 575 brought a full 68040 processor to the all-in-one consumer/education Mac for the first time — the same chip as the Quadra 605, in the same compact 14-inch Trinitron chassis. A capable machine that marked the high point of the classic LC all-in-one design before Apple moved on to the PowerPC-based 5200.'
  WHERE name IN ('Macintosh LC 575') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The LC 580 upgraded the all-in-one chassis with a 33 MHz 68LC040 and a larger display option, representing the final evolution of the 68k-based education all-in-one before Apple''s PowerPC transition. Released alongside early PowerPC Macs, the 580 served schools that weren''t yet ready to upgrade their software ecosystem.'
  WHERE name IN ('Macintosh LC 580') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The LC 630 was the last 68k LC — a 33 MHz 68LC040 in a pizza-box design with built-in video and support for the TV/Video System expansion. Also sold as the Performa 630 and the Quadra 630 (with a different processor). It served as Apple''s entry-level desktop right through the early PowerPC transition, when software compatibility with the 68k catalog still mattered.'
  WHERE name IN ('Macintosh LC 630') AND "historicalNotes" IS NULL;

-- Quadra 605, 630, 660AV, 900, 950
UPDATE "Template" SET "historicalNotes" = 'Apple''s entry-level 68040 Mac — a 25 MHz 68LC040 in a tiny pizza-box case at $800 in 1993. The 605 brought genuine 68040 performance to budget buyers, though the LC variant of the 68040 omitted the FPU. It occupied the same form factor as the LC 475 and sold alongside it as the ''professional'' version of the same compact design.'
  WHERE name IN ('Macintosh Quadra 605') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The Quadra 630 was Apple''s final 68040 Mac — released in 1994, just as the first PowerPC Macs were shipping. It offered an upgrade path via a PowerPC processor card, acknowledging that the 68k era was ending. Also sold as the LC 630 and Performa 630 with different processor configurations. One of the most widely deployed Macs of the mid-1990s transition period.'
  WHERE name IN ('Macintosh Quadra 630') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The 660AV added real-time audio and video capabilities to the Quadra line — a dedicated DSP chip handled telephony, voice recognition, and video capture at a time when those functions required separate expansion cards. It shared the compact desktop case of the 610 and shipped the same month as the more powerful 840AV. Together, the AV Macs previewed a future where computers could process multimedia without special hardware.'
  WHERE name IN ('Macintosh Quadra 660AV', 'Centris 660AV') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The Quadra 900 was Apple''s first professional tower since the IIfx — a full tower with five NuBus slots, room for multiple drives, and the same 25 MHz 68040 as the 700 in a chassis designed for maximum expansion. At $7,200 it was for power users who needed everything. The 950 that followed it pushed the clock to 33 MHz and became the most powerful 68k Mac Apple ever shipped.'
  WHERE name IN ('Macintosh Quadra 900') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The most powerful 68k Mac Apple ever made — a 33 MHz 68040 in a full tower with five NuBus slots and support for up to 256MB of RAM. The 950 was the choice for professional video editors, 3D animators, and anyone who pushed the Mac platform to its limits in the early 1990s. When PowerPC arrived in 1994, the 950 was still fast enough to compete. A landmark machine.'
  WHERE name IN ('Macintosh Quadra 950') AND "historicalNotes" IS NULL;

-- PowerBook Duo series
UPDATE "Template" SET "historicalNotes" = 'The PowerBook Duo was Apple''s radical answer to the question of what a laptop should be: strip out everything that belongs on a desk — large display, full keyboard, expansion slots, floppy drive — and make the laptop as thin and light as possible. The result weighed 4.2 pounds and docked into the Duo Dock to become a full-featured desktop Mac. The Duo 210 and 230 launched the concept in 1992; the 270c, released in 1993, added color.'
  WHERE name IN ('PowerBook Duo 210', 'PowerBook Duo 230', 'PowerBook Duo 250', 'PowerBook Duo 280') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The PowerBook Duo 270c was the first color Duo — an active-matrix 640×480 display in the same ultra-thin chassis as the original Duo 210. Color came at a cost in battery life, but the 270c proved that the Duo concept could scale to the display quality professionals needed. It remains one of the most sought-after 68k PowerBooks: a color laptop thin enough to slip into a padfolio.'
  WHERE name IN ('PowerBook Duo 270c') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The Duo 280c updated the 270c with a faster 33 MHz 68LC040, the first 68040-based Duo. Still in the same ultra-thin chassis introduced in 1992, the 280c represented the pinnacle of the 68k Duo line before the PowerPC transition. Its successor, the 2300c, would bring a PowerPC G3 to the same concept.'
  WHERE name IN ('PowerBook Duo 280c') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The final and most powerful Duo — a PowerPC 603e in the same slim chassis that had defined the line since 1992. The 2300c was a transitional product: a modern processor in a design that was already four years old. Apple discontinued the entire Duo line in 1997, but the concept of an ultra-thin laptop that docks for full functionality anticipated a conversation that would recur with every MacBook Air.'
  WHERE name IN ('PowerBook Duo 2300c') AND "historicalNotes" IS NULL;

-- PowerBook family (additional models)
UPDATE "Template" SET "historicalNotes" = 'The PowerBook 140 was the mid-range of Apple''s original 1991 PowerBook lineup — a 16 MHz 68030 with a passive-matrix display, positioned between the Sony-designed 100 and the premium 170 with its active-matrix screen. It established the PowerBook form factor that competitors scrambled to copy: trackball centered below the keyboard, wide palm rest, portrait-oriented display.'
  WHERE name IN ('PowerBook 140') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The PowerBook 145 and 145B were modest refinements of the 140 — a slightly faster clock, a cleaner LCD. Intended to maintain the PowerBook line''s price/performance position while Apple developed the 500 series. Solid road warriors for anyone who needed full Mac software in a laptop package without paying for the premium active-matrix display of the 170.'
  WHERE name IN ('PowerBook 145', 'PowerBook 145B') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The PowerBook 150 was the final 68k PowerBook — a budget model released in 1994 as the PowerPC transition was beginning, designed to serve price-sensitive buyers who couldn''t yet afford the newer hardware. It used an IDE hard drive instead of SCSI, which caused compatibility headaches. An unremarkable machine remembered mostly as the last representative of an era.'
  WHERE name IN ('PowerBook 150') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The PowerBook 170 was the flagship of Apple''s original 1991 PowerBook lineup and the first laptop many professionals trusted to replace a desktop. Its active-matrix display was a revelation — sharp, fast, and unsmeared by the ghosting that plagued passive-matrix screens. At $4,599, it cost more than most desktops. Those who had one considered it worth every dollar.'
  WHERE name IN ('PowerBook 170') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The PowerBook 180 was the performance flagship of 1992 — a 33 MHz 68030, active-matrix display, and an FPU that the competing 160 and 165 lacked. It completed the first generation of PowerBook refinements, establishing that the laptop platform could deliver genuinely fast computation. The 180c added color to the active-matrix display, at significant expense.'
  WHERE name IN ('PowerBook 180', 'PowerBook 180c') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The PowerBook 165c was Apple''s first color laptop — a passive-matrix color display that was dimmer and slower than the active-matrix screens on competing models, but dramatically cheaper. Color on a PowerBook was a statement of intent. The 165c proved the concept; the 540c''s active-matrix Blackbird a year later proved it could be done properly.'
  WHERE name IN ('PowerBook 165c') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The PowerBook 520 series introduced the built-in trackpad to personal computers — a feature so fundamental to laptop design that it has appeared on every notebook computer since. The 520 and 520c used 68LC040 processors and the new PB5xx form factor that moved the trackpad below the keyboard, giving users a more natural pointing experience than the old center-mounted trackball.'
  WHERE name IN ('PowerBook 520', 'PowerBook 520c') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The PowerBook 5300 was Apple''s first PowerPC laptop, and one of its most troubled products. Its lithium-ion batteries caught fire during testing and were replaced with slower nickel-metal-hydride cells at the last minute. The plastic case cracked easily. Early units had to be recalled. Despite the troubled launch, the 5300 established the PowerPC PowerBook line that would become the foundation of Apple''s laptop business for the next decade.'
  WHERE name LIKE 'PowerBook 5300%' AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The PowerBook 1400 was Apple''s mid-range laptop for 1996 and 1997, notable for its Book Cover feature — a replaceable bezel that let owners swap decorative covers on the lid. Available in both c (color) and cs (color passive-matrix) configurations across three clock speeds. The 1400 also supported a CD-ROM module in the expansion bay, a first for a PowerBook at its price point.'
  WHERE name LIKE 'PowerBook 1400%' AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The PowerBook 2400c was designed in collaboration with IBM Japan for the Japanese market — the smallest and lightest PowerPC PowerBook Apple ever made, at 4.4 pounds with a 10.4-inch display. A cult classic among collectors who value ultra-compact portables. Its keyboard layout required an optional numerical keypad accessory, a trade-off its devoted users accepted without complaint.'
  WHERE name LIKE 'PowerBook 2400c%' AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The PowerBook 3400c was the fastest laptop in the world when it launched in 1997 — a 240 MHz PowerPC 603e that outran competing Pentium and Pentium MMX laptops on most benchmarks. Apple''s promotional materials made this claim directly, and reviewers confirmed it. The 3400c signaled that Apple intended to compete seriously in professional laptop performance rather than trade purely on design.'
  WHERE name LIKE 'PowerBook 3400c%' AND "historicalNotes" IS NULL;

-- PowerBook G3 family
UPDATE "Template" SET "historicalNotes" = 'The PowerBook G3 Kanga was the transitional model — a 250 MHz G3 in the old 3400c chassis, essentially a stop-gap while the full Wallstreet redesign was completed. Only produced for a few months. Most buyers waited for the Wallstreet; the Kanga is now the rarest PowerBook G3 variant and a curiosity for collectors who want the complete G3 timeline.'
  WHERE name IN ('PowerBook G3 (Kanga)') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The PowerBook G3 Wallstreet was a genuine landmark — the first laptop whose processor outperformed Apple''s desktop Macs. Running at 233–300 MHz, it benchmarked faster than the Power Mac G3 desktops it launched alongside, a fact Apple used in advertising. Two expansion bays could hold two batteries, an optical drive, or any combination. Professionals who had been skeptical of laptops started buying them in large numbers.'
  WHERE name IN ('PowerBook G3 Series (Wallstreet)') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The PowerBook G3 Bronze Keyboard — known as ''Lombard'' — refined the Wallstreet in a lighter, thinner package with USB replacing the old serial and ADB ports. At 5.3 pounds, it was half a pound lighter than the Wallstreet and used a bronzed keyboard accent that gave it its nickname. The USB transition made it the first PowerBook that could connect to the accessories being built for the iMac era.'
  WHERE name IN ('PowerBook G3 (Bronze Keyboard)') AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The PowerBook G3 FireWire — nicknamed ''Pismo'' — added FireWire 400 and AirPort wireless to the G3 lineup, making it the most connected Mac laptop yet available. Running at 400 or 500 MHz, it was also fast enough to handle early digital video editing. The Pismo is widely considered the finest PowerBook G3, refined in every dimension from its Wallstreet ancestor while maintaining its expansion bay versatility.'
  WHERE name IN ('PowerBook G3 (FireWire)') AND "historicalNotes" IS NULL;

-- Power Mac mid-range towers
UPDATE "Template" SET "historicalNotes" = 'The Power Mac 7100 was the mid-range of Apple''s first PowerPC trio — positioned between the entry-level 6100 and the flagship 8100. At 66 MHz it offered a meaningful performance step up from the 6100 with two NuBus slots for expansion. Workgroups and design studios that needed PowerPC performance without the full cost of the 8100 tower found it a practical choice.'
  WHERE name LIKE 'Power Macintosh 7100%' AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The Power Mac 7200 and 7300 were Apple''s mid-range towers in the PCI era, offering three PCI slots alongside the integrated video and Ethernet that defined the 7xxx line. These machines were popular with educational institutions and graphic design shops throughout 1995–1997. The 7300 in particular, with its 180–200 MHz 604e, was a capable machine for QuarkXPress and Photoshop work.'
  WHERE name LIKE 'Power Macintosh 7200%' OR name LIKE 'Power Macintosh 7300%' AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The Power Mac 7500 and 7600 added a CPU daughter card upgrade path — the processor was on a removable card that could be replaced with a faster G3 card without changing the entire machine. This made them uniquely upgradeable, and a dedicated upgrade market served 7500 and 7600 owners well into the late 1990s. The 7600 at 132–200 MHz was the most capable tower Apple offered to mid-range buyers in 1996.'
  WHERE name LIKE 'Power Macintosh 7500%' OR name LIKE 'Power Macintosh 7600%' AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The Power Mac 8500 and 8600 were Apple''s performance mid-tower machines for 1995–1997, popular with digital video professionals because of their dedicated video output and the AV capabilities inherited from the 8100AV. The 8500 at 120 MHz was the machine that made desktop video editing without dedicated hardware plausible for the first time.'
  WHERE name LIKE 'Power Macintosh 8500%' OR name LIKE 'Power Macintosh 8600%' AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The Power Mac 9500 and 9600 were Apple''s flagship towers of the PCI era — six PCI slots, room for multiple drives, and 150–350 MHz 604 and 604e processors. The 9600 was the last pre-G3 Mac Apple sold and the fastest 604e machine ever produced. Both machines were used extensively in broadcast television, commercial printing, and scientific computing — environments where raw processing power and maximum expansion were non-negotiable.'
  WHERE name LIKE 'Power Macintosh 9500%' OR name LIKE 'Power Macintosh 9600%' AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The Power Mac 4400, 6200, 6300, 6400, and 6500 series were Apple''s consumer towers — sold through dealers and eventually the company''s own retail channel as affordable alternatives to the professional 7xxx and 9xxx machines. The 6400 and 6500 were among the most widely deployed Macs in North American homes in 1996–1997, bundled with monitors and software as all-in-one consumer computing packages.'
  WHERE name LIKE 'Power Macintosh 6200%' OR name LIKE 'Power Macintosh 6300%' OR name LIKE 'Power Macintosh 6400%' OR name LIKE 'Power Macintosh 6500%' OR name LIKE 'Power Macintosh 4400%' AND "historicalNotes" IS NULL;

UPDATE "Template" SET "historicalNotes" = 'The Power Macintosh G3 All-in-One was Apple''s last all-in-one desktop designed specifically for education — a G3 processor and a 15-inch CRT integrated into a single unit with a carrying handle. Schools that had used LC all-in-ones throughout the early 1990s could now get G3 performance in the same familiar footprint. Nicknamed the ''Molar Mac'' for its unusual case design.'
  WHERE name IN ('Power Macintosh G3 All-In-One') AND "historicalNotes" IS NULL;

-- Mac Pro 2009, 2010, 2012
UPDATE "Template" SET "historicalNotes" = 'The Mac Pro continued its evolution through the Nehalem, Westmere, and Ivy Bridge generations — the same aluminum tower refined over six years with faster Xeon processors, faster storage, and newer GPU options. These machines became the backbone of professional video, audio, and scientific computing workflows through the early 2010s, valued for their reliability, repairability, and the enormous third-party expansion ecosystem that grew around them.'
  WHERE name IN ('Mac Pro (Early 2009)', 'Mac Pro (Mid 2010)', 'Mac Pro (Mid 2012)') AND "historicalNotes" IS NULL;

-- Xserve
UPDATE "Template" SET "historicalNotes" = 'The Xserve was Apple''s brief, serious attempt at the server market — a 1U rackmount running Mac OS X Server, designed for data centers that wanted Apple architecture in a professional rack form factor. The G4 models launched in 2002; the G5 models followed in 2003. Apple discontinued the Xserve in 2011 after Intel-based Mac minis and Mac Pros proved more versatile for the same workloads. A machine that existed for exactly one specific moment in Apple''s history.'
  WHERE name IN ('Xserve G4', 'Xserve G5') AND "historicalNotes" IS NULL;

-- Apple II Plus
UPDATE "Template" SET "historicalNotes" = 'The Apple II Plus added Integer and Applesoft BASIC in ROM — giving every user access to floating-point arithmetic without a language card — and a revised keyboard. It was the first Apple II aimed explicitly at business users rather than hobbyists, and the machine that expanded the Apple II from a niche product to a mainstream platform. Most of the early enterprise Apple II software was written for the Plus or its successors.'
  WHERE name IN ('Apple II Plus') AND "historicalNotes" IS NULL;

-- Apple III Plus
UPDATE "Template" SET "historicalNotes" = 'Apple''s second attempt to fix the Apple III — a revised logic board, a real-time clock, a new keyboard, and a lower price. Apple had recalled 14,000 of the original Apple IIIs; the Plus was meant to restore confidence. It didn''t. By 1983 the Lisa had launched and the Macintosh was less than a year away. The Apple III Plus was discontinued after less than two years, a postscript to an already-concluded failure.'
  WHERE name IN ('Apple III Plus') AND "historicalNotes" IS NULL;
