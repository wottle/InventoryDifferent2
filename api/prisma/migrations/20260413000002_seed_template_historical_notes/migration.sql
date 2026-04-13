-- Seed historical notes on templates if none have been set yet (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Template" WHERE "historicalNotes" IS NOT NULL) THEN

    -- Apple II family
    UPDATE "Template" SET "historicalNotes" = 'Apple''s landmark home computer, introduced in 1977 with color graphics and an open architecture that invited third-party expansion. The Apple II defined the personal computer industry for nearly a decade and is the machine that made Apple profitable. Software like VisiCalc — the world''s first spreadsheet — ran exclusively on the Apple II and created an entirely new reason to own a computer.'
      WHERE name = 'Apple II';

    UPDATE "Template" SET "historicalNotes" = 'The first truly portable Apple II — a self-contained unit at 7.5 pounds with a built-in 5.25" drive and a handle for carrying. The IIc was Apple''s first attempt to present the Apple II as a finished product rather than a kit, and it was the best-selling Apple II of its era. It arrived the same year as the Macintosh, and represented the old guard''s last moment in the spotlight.'
      WHERE name = 'Apple IIc';

    UPDATE "Template" SET "historicalNotes" = 'The Apple IIc Plus added a 4 MHz accelerated processor and a 3.5" drive — the same drive the original Mac used — to the IIc''s clean portable design. By 1988, it was something of an anachronism alongside the Mac, but it kept the Apple II tradition alive for schools and businesses that had invested heavily in Apple II software.'
      WHERE name = 'Apple IIc Plus';

    UPDATE "Template" SET "historicalNotes" = 'The Apple IIe was the workhorse of the Apple II family — durable, expandable, and supported by Apple for twelve years, making it one of the longest-lived personal computers ever produced. Its 80-column text card made it viable for serious word processing; its IIe Card for the LC series let it outlive the hardware that replaced it.'
      WHERE name = 'Apple IIe';

    UPDATE "Template" SET "historicalNotes" = 'The final and most powerful Apple II, released the same year as the Macintosh SE. The IIgs used a 16-bit 65C816 processor and a custom Ensoniq sound chip capable of producing audio that the early Macs couldn''t match. Steve Jobs reportedly resented it for being too capable and quietly throttled its clock speed to avoid undermining Mac sales. The IIgs community never forgave him.'
      WHERE name = 'Apple IIgs';

    -- Apple III
    UPDATE "Template" SET "historicalNotes" = 'Apple''s first attempt at a serious business machine, and one of the most expensive product failures in the company''s history. Jobs overruled the engineers — insisting on a fanless design and a case too small for the components — and the result was a machine whose chips literally expanded from heat and popped out of their sockets. Over 14,000 were recalled at launch. The Apple III spent four years trying to recover its reputation and never did, but the lessons it taught Apple shaped everything that came after.'
      WHERE name = 'Apple III';

    -- Apple Lisa
    UPDATE "Template" SET "historicalNotes" = 'The first commercial personal computer with a true graphical user interface, sold for $9,995 in 1983 — roughly $31,000 in today''s money. Named, despite years of official denial, for Steve Jobs''s daughter. Apple sold fewer than 10,000 before quietly writing off 2,700 units in a Utah landfill in 1989. Commercially, the Lisa was a catastrophe. Historically, it was the proof of concept that made the Macintosh possible.'
      WHERE name IN ('Apple Lisa', 'Apple Lisa 2', 'Apple Lisa 2/5', 'Apple Lisa 2/10');

    -- Compact Macs
    UPDATE "Template" SET "historicalNotes" = 'The computer that changed everything, introduced with Ridley Scott''s ''1984'' Super Bowl commercial. The original Macintosh had 128 kilobytes of RAM, a 400K floppy, and an OS that fit in 64K of ROM. Jobs called it insanely great; engineers called it underpowered from day one. The world called it a revolution. Discontinued within a year as the 512K Fat Mac proved the concept needed more memory to breathe.'
      WHERE name = 'Macintosh 128k';

    UPDATE "Template" SET "historicalNotes" = 'Known as the Fat Mac for its quadrupled RAM, the 512K was the machine that made the original Macintosh actually usable. The 128K struggled to run MacWrite and MacPaint simultaneously; the 512K gave users room to work. Apple priced it at $2,795 — $200 less than the original — and the computing public finally started to believe the Mac was something real.'
      WHERE name = 'Macintosh 512k';

    UPDATE "Template" SET "historicalNotes" = 'The 512Ke upgraded the Fat Mac with the 800K double-sided floppy drive, dramatically improving storage capacity and compatibility with the Mac Plus. It was Apple''s bridge product — acknowledging the 512K was obsolete without fully replacing it. The ''e'' stood for ''enhanced,'' a word Apple would use again when it couldn''t quite call something new.'
      WHERE name = 'Macintosh 512Ke';

    UPDATE "Template" SET "historicalNotes" = 'The first Mac that was genuinely good enough. The Plus shipped with 1MB of RAM standard, a double-sided 800K floppy, and — crucially — a SCSI port for external storage. Sold continuously for three years and six months, longer than any other Mac before it. Apple manufactured so many that a Plus often costs less than a Classic today, despite being older. The machine that proved the Macintosh concept was commercially sustainable.'
      WHERE name = 'Macintosh Plus';

    UPDATE "Template" SET "historicalNotes" = 'The SE added two things the original compact Mac desperately needed: an expansion slot and a fan. The fan meant you could run it all day without the case reaching dangerous temperatures. The PDS expansion slot meant you could add an accelerator, a second CPU, or a hard disk controller. These small additions opened the compact Mac to serious professional use for the first time.'
      WHERE name = 'Macintosh SE';

    UPDATE "Template" SET "historicalNotes" = 'The FDHD (SuperDrive) variant of the SE was the first Mac that could read — and write — both 1.44MB Mac disks and IBM-format DOS disks. At a time when Macs and PCs were increasingly expected to coexist in offices, this was practically significant. The same SuperDrive mechanism would persist in Apple hardware for another decade.'
      WHERE name = 'Macintosh SE FDHD';

    UPDATE "Template" SET "historicalNotes" = 'Widely considered the greatest compact Mac ever made. The SE/30 packed a 16 MHz 68030 and 68882 FPU into the same case that started with the 128K in 1984 — and ran circles around most of the Mac II line despite fitting in a smaller box. With MODE32 it could address up to 128MB of RAM. The last of the original compact form factor, and definitively the best.'
      WHERE name = 'Macintosh SE/30';

    UPDATE "Template" SET "historicalNotes" = 'Apple''s first laptop — a machine so far ahead of its time and so far behind what the market wanted that it became a legend in its own lifetime. At 16 pounds and $6,500, it was neither portable nor affordable. But it had a genuine active-matrix display, a trackball, and full Mac capability. Apple engineers learned exactly what not to do, and redirected that knowledge into the PowerBook 100 two years later.'
      WHERE name IN ('Macintosh Portable', 'Macintosh Portable Backlit');

    UPDATE "Template" SET "historicalNotes" = 'The first and only all-black Mac Apple ever sold commercially. Only 10,000 were made, in a four-month production run from October 1993 to February 1994. A real cable television tuner let you watch TV through your computer — an idea so ahead of its time that Apple couldn''t explain it or market it. Today it is among the most sought-after compact Macs.'
      WHERE name = 'Macintosh TV';

    UPDATE "Template" SET "historicalNotes" = 'Apple''s last compact Mac, and its first with color — but not without compromise. The Color Classic''s fixed 512×384 Sony Trinitron display was narrower than every other Mac of its era. Apple''s cost-cutting created a machine beloved precisely for its limitations. The ''Mystic'' upgrade — swapping in a Color Classic II board — gives it a 68030 and double the RAM without changing the cult-status exterior.'
      WHERE name = 'Macintosh Color Classic';

    UPDATE "Template" SET "historicalNotes" = 'The Color Classic II improved on its predecessor with a faster 68030 at 33 MHz and more RAM capacity, but was sold only in Japan and Canada — making it rarer and more desirable than the original in the North American market. It shares the same iconic compact form factor with a notably capable processor for its era.'
      WHERE name = 'Macintosh Color Classic II';

    UPDATE "Template" SET "historicalNotes" = 'The first 68030-based compact Mac, and a capable workhorse. The Classic II improved on the original Classic with a faster processor and more expandable RAM — but Apple''s cost-cutting showed: it ran at only 16 MHz and shipped with a slow hard drive. Beloved for its reliability and the fact that it kept the classic compact form alive into the 1990s.'
      WHERE name = 'Macintosh Classic II';

    -- Mac II family
    UPDATE "Template" SET "historicalNotes" = 'The first modular Macintosh — a radical departure from the all-in-one compact. The Mac II used a Motorola 68020 in an open, expandable case with six NuBus slots. It was the first color Mac (with the right card) and the first Mac professionals could genuinely expand to meet their needs. It established the architecture that would carry Apple through the rest of the decade.'
      WHERE name = 'Macintosh II';

    UPDATE "Template" SET "historicalNotes" = 'Apple called it ''wicked fast'' in the marketing, and for 1990 the description was honest. At $10,000 retail — more than most cars — the IIfx used dedicated I/O processors for each NuBus slot, custom DRAM timing developed in-house, and a 40 MHz 68030 that was measurably faster than any other Mac available. The most expensive and most powerful 68k Mac Apple ever built.'
      WHERE name = 'Macintosh IIfx';

    UPDATE "Template" SET "historicalNotes" = 'The IIcx offered the expandability of the Mac II in a smaller, quieter case with three NuBus slots instead of six. It was the choice of designers and publishers who needed expansion without the full footprint of the IIfx. Introduced at the same time as the IIci, it was positioned as the more affordable professional option.'
      WHERE name = 'Macintosh IIcx';

    UPDATE "Template" SET "historicalNotes" = 'The IIci was the sweet spot of the Mac II family: a 25 MHz 68030 with built-in video, 8-bit color without an expansion card, and a cache slot that made it significantly faster with the right accessory. It became the standard professional Mac for graphic designers and desktop publishers throughout the early 1990s.'
      WHERE name = 'Macintosh IIci';

    UPDATE "Template" SET "historicalNotes" = 'The IIsi was Apple''s attempt to bring the modular Mac down in price without entirely gutting its capabilities. Running at 20 MHz with a single NuBus-via-PDS slot, it was slower than the IIci but cost considerably less. A popular choice for schools and small businesses that needed Mac expandability on a limited budget.'
      WHERE name = 'Macintosh IIsi';

    -- Quadra family
    UPDATE "Template" SET "historicalNotes" = 'The first 68040 Mac, and Apple''s most uncompromising professional desktop of its era. At $5,700, no expense was spared: onboard Ethernet, 20MB of RAM standard, NuBus expansion in a tower footprint. The Quadra 700 was designed to look like a professional instrument, not a consumer appliance, and it established the premium Mac workstation standard for the decade ahead.'
      WHERE name = 'Macintosh Quadra 700';

    UPDATE "Template" SET "historicalNotes" = 'The Quadra 800 brought the 68040 to a full tower with three NuBus slots, built-in Ethernet and video, and the fastest SCSI implementation Apple had offered to date. It was the preferred workstation for video production and high-end desktop publishing throughout 1993 — a reliable, powerful, and upgradeable machine at a time when those qualities were not guaranteed.'
      WHERE name = 'Macintosh Quadra 800';

    UPDATE "Template" SET "historicalNotes" = 'The most powerful 68040 Mac ever shipped, and the last significant 68k workstation before Apple''s transition to PowerPC. The 840AV added a DSP chip capable of real-time audio processing, voice recognition, and video capture at a time when those features required dedicated hardware. At 40 MHz with AV capabilities, it was Apple''s answer to the professional workstation market — and a preview of where computing was going.'
      WHERE name = 'Macintosh Quadra 840AV';

    UPDATE "Template" SET "historicalNotes" = 'The Quadra 610 brought 68040 performance to a compact desktop at a price point accessible to more businesses. Also sold as the Centris 610, it shared its case with several other models of the era and was a common sight in offices that needed real computing performance without the cost of a full tower. A reliable, if unglamorous, professional machine.'
      WHERE name IN ('Macintosh Quadra 610', 'Centris 610');

    UPDATE "Template" SET "historicalNotes" = 'The Quadra 650, also sold as the Centris 650, was a mid-range workhorse with three NuBus slots and a 68040 running at 33 MHz. It became a popular choice for schools and mid-sized businesses in 1993 and was one of the most widely deployed professional Macs of the era. Reliable, expandable, and capable of running comfortably into the PowerPC transition with a processor upgrade card.'
      WHERE name IN ('Macintosh Quadra 650', 'Centris 650');

    -- PowerBook family
    UPDATE "Template" SET "historicalNotes" = 'The PowerBook 100 was designed with Sony and introduced everything the Macintosh Portable had failed to be: light, affordable, and genuinely portable at 5.1 pounds. It sold 100,000 units in its first three months and defined the laptop category for years. The trackball positioned behind the keyboard became the template every competitor copied. It was Apple''s most successful new product launch to that point.'
      WHERE name = 'PowerBook 100';

    UPDATE "Template" SET "historicalNotes" = 'The PowerBook 500 series introduced the built-in trackpad to personal computers before anyone else — a feature so obvious in retrospect that every laptop on earth has used it since. The 540c ''Blackbird'' was the top of the line: active-matrix color, 33 MHz 68LC040, stereo speakers. Its benchmark scores embarrassed PC laptops that cost twice as much.'
      WHERE name IN ('PowerBook 540', 'PowerBook 540c');

    UPDATE "Template" SET "historicalNotes" = 'The PowerBook 160 brought the 68030 to a more affordable laptop price point, featuring a dual-scan passive-matrix display at a time when active-matrix was still a premium. It served the broad middle of the PowerBook market in 1992 — capable enough for real work, affordable enough for education. A reliable road warrior of its era.'
      WHERE name = 'PowerBook 160';

    UPDATE "Template" SET "historicalNotes" = 'The PowerBook 165 improved on the 160 with a faster 33 MHz 68030, bringing the entry-level PowerBook performance closer to the premium models. By 1993 it had become the workhorse of the PowerBook line — schools, businesses, and travelers who needed real Mac performance in a portable form without paying for the premium active-matrix display.'
      WHERE name = 'PowerBook 165';

    UPDATE "Template" SET "historicalNotes" = 'The PowerBook 190cs was one of the last 68k PowerBooks before the PowerPC transition — a capable machine hamstrung by a processor that was already falling behind. Its 100 MHz 68LC040 was fast by 68k standards but slower than the PowerPC 5300 that replaced it. Reliable and well-regarded, the 190cs marked the end of an era.'
      WHERE name = 'PowerBook 190cs';

    -- PowerBook G3/G4
    UPDATE "Template" SET "historicalNotes" = 'The PowerBook G4 Titanium was the machine that proved Apple still knew how to design a laptop. At 1 inch thin with a titanium enclosure, it was thinner, lighter, and faster than anything else on the market in 2001. The 15.2-inch widescreen display was the largest in any laptop at the time. The Ti-Book, as it became known, is widely considered one of the most beautiful laptops ever designed.'
      WHERE name LIKE 'PowerBook G4 Titanium%';

    UPDATE "Template" SET "historicalNotes" = 'The aluminum PowerBook G4 replaced titanium with anodized aluminum that was more durable and even more precisely machined. Available in 12, 15, and 17-inch configurations, the aluminum G4 family carried Apple''s laptop line through the final years before the Intel transition. The 17-inch model was the largest laptop Apple had ever made; the 12-inch the smallest and most compact professional Mac.'
      WHERE name LIKE 'PowerBook G4 Aluminum%' OR name LIKE 'PowerBook G4 17%' OR name LIKE 'PowerBook G4 15%' OR name LIKE 'PowerBook G4 12%';

    -- Newton
    UPDATE "Template" SET "historicalNotes" = 'The Newton MessagePad was Apple''s first handheld computer — and one of its most visionary products, launched in 1993 under CEO John Sculley. The original MessagePad''s handwriting recognition was imperfect and became the punchline of a thousand jokes, but it pioneered concepts — syncing, handwriting input, assistant software — that wouldn''t be mainstream for another decade. Steve Jobs killed the entire Newton line on his first day back. The Newton community never forgave him.'
      WHERE name LIKE 'Newton MessagePad%' OR name = 'Newton Messagepad Original';

    UPDATE "Template" SET "historicalNotes" = 'The MessagePad 2000 (upgradeable to the 2100 with a processor expansion) was the most powerful Newton ever made — a 162 MHz StrongARM processor, a large display, and a software platform that had matured significantly since the 1993 original. By 1997 the handwriting recognition worked well and the device had a devoted professional following. Jobs cancelled it anyway, calling it too far from the Mac ecosystem.'
      WHERE name LIKE 'Newton MessagePad 2%';

    UPDATE "Template" SET "historicalNotes" = 'The eMate 300 was Apple''s Newton-based laptop designed for education — a clamshell device with a real keyboard, a 28-hour battery life, and a design intended to survive student handling. Schools loved it; Apple killed it in 1998 along with the rest of the Newton line when Jobs returned. The eMate is a striking example of what Apple''s product portfolio might have looked like if Jobs had returned a year later.'
      WHERE name = 'Newton eMate 300';

    -- Power Macs
    UPDATE "Template" SET "historicalNotes" = 'The first Power Mac, introduced as Apple''s transition to PowerPC — a joint architecture developed with IBM and Motorola designed to leapfrog Intel performance. The 6100 used the same PDS expansion slot from the Quadra it physically resembled, making the PowerPC transition relatively smooth for existing Mac owners. Running at 60 MHz, it was significantly faster than any 68k Mac for most tasks.'
      WHERE name LIKE 'Power Macintosh 6100%' OR name LIKE 'PowerMac 6100%';

    UPDATE "Template" SET "historicalNotes" = 'The Power Mac 8100 was the performance option in Apple''s first PowerPC lineup, running at 80 or 100 MHz in a full tower with three NuBus slots. At a time when most computers were still running at 66 MHz 486 speeds, the 8100 was genuinely fast by any measure. Its successor, the 8500, is credited with making desktop digital video editing mainstream.'
      WHERE name LIKE 'Power Macintosh 8100%' OR name LIKE 'PowerMac 8100%';

    UPDATE "Template" SET "historicalNotes" = 'The Power Mac G3 was the machine that began Apple''s recovery. Introduced in 1997 under Steve Jobs, it replaced the chaotic Performa, Centris, and Power Mac product lines with a clear professional desktop. The G3 chip''s performance-per-watt was exceptional; it ran faster than Intel''s Pentium II at the same clock speed. The G3 tower is the machine that stabilized Apple''s product line and restored confidence in the Mac platform.'
      WHERE name LIKE 'Power Mac G3%' OR name LIKE 'PowerMac G3%';

    UPDATE "Template" SET "historicalNotes" = 'The Power Mac G4 was the machine the U.S. government briefly classified as a supercomputer — its AltiVec ''Velocity Engine'' SIMD unit ran certain calculations at 1 GFLOP, the threshold for export-controlled computing hardware at the time. Apple used this fact in its advertising. In practice, it made the G4 the premier choice for digital video editing and 3D rendering throughout the early 2000s.'
      WHERE name LIKE 'Power Mac G4%' OR name LIKE 'PowerMac G4%';

    UPDATE "Template" SET "historicalNotes" = 'The first 64-bit consumer computer, housed in a case so precisely engineered that the aluminum towers are still used as audiophile speaker enclosures today. The G5 ran so hot that high-end dual-processor configurations required liquid cooling — a rarity in desktop computers at the time. IBM''s inability to produce a laptop-capable G5 chip drove Apple''s historic switch to Intel processors in 2006.'
      WHERE name LIKE 'Power Mac G5%' OR name LIKE 'PowerMac G5%';

    -- G4 Cube
    UPDATE "Template" SET "historicalNotes" = 'Suspended in a perfect cube of clear acrylic. No fan. A touch-sensitive power button that activated with a brush of a finger. The G4 Cube was the most beautiful computer Apple ever made — and a commercial failure because consumers expected $1,299 and Apple charged $1,799. Production ran for exactly one year before Steve Jobs ''put it on ice.'' Those who have one consider it among the finest objects Apple ever produced.'
      WHERE name LIKE '%G4 Cube%' OR name LIKE '%Power Mac G4 Cube%';

    -- Twentieth Anniversary Mac
    UPDATE "Template" SET "historicalNotes" = 'Only 12,000 were made, each personally delivered by a trained Macintosh specialist in a business suit, with a bottle of wine. At $7,499 — later reduced to $1,999 in a clearance sale — it was Apple''s celebration of twenty years of the Mac and a vision of where personal computing was headed: vertical LCD, integrated Bose audio, television tuner, all in a single slim enclosure. One of the rarest and most desirable Macs ever built.'
      WHERE name LIKE 'Twentieth Anniversary%';

    -- Performa family
    UPDATE "Template" SET "historicalNotes" = 'The Performa line was Apple''s attempt to reach the consumer market through big-box retailers like Sears and Circuit City — a strategy that created a confusing alphabet soup of model numbers and frustrated customers who couldn''t tell one machine from another. Despite the marketing chaos, Performa hardware was often identical or nearly identical to the professional models sold under the Quadra and Power Mac names.'
      WHERE name LIKE 'Performa%' OR name LIKE 'Macintosh Performa%';

    -- iMac G3
    UPDATE "Template" SET "historicalNotes" = 'The machine that saved Apple. When Steve Jobs returned in 1997, the company had 90 days of operating cash remaining. The Bondi Blue iMac launched in 1998 at $1,299, eliminated the floppy drive before anyone thought that was possible, and sold 800,000 units in its first 139 days — the best-selling Mac to that point. Translucent candy-colored plastic rewrote what a computer was allowed to look like. ''There is no step 3'' became the benchmark for product simplicity.'
      WHERE name LIKE 'iMac G3%';

    -- iMac G4
    UPDATE "Template" SET "historicalNotes" = 'Jony Ive''s most audacious design: a flat LCD screen on a jointed arm above a hemisphere containing everything else. The arm could be positioned at any angle with one finger and would hold its position — the engineering required to counterbalance a display precisely was genuinely difficult. Steve Jobs called it ''the coolest computer I''ve ever seen.'' No Mac before or since has attracted as much attention from people who weren''t looking for a computer.'
      WHERE name LIKE 'iMac G4%';

    -- iMac G5
    UPDATE "Template" SET "historicalNotes" = 'The iMac G5 put the entire computer — logic board, power supply, optical drive — behind a single thin panel that looked like a display. When it launched, reviewers who opened the back cover found a complete computer inside. The design philosophy became the blueprint for every iMac built since 2004: everything hidden, everything integrated, as little visual noise as possible.'
      WHERE name LIKE 'iMac G5%';

    -- iMac Intel
    UPDATE "Template" SET "historicalNotes" = 'The aluminum iMac replaced the white polycarbonate design that had served since the G4, and set the template all iMacs would follow for a decade. Thinner, harder, and with an edge-to-edge glass display. The 2007 aluminum iMac marked Apple''s full confidence in Intel architecture and the end of the PowerPC era.'
      WHERE name LIKE 'iMac Intel%' OR name LIKE 'iMac%Core 2%' OR name LIKE 'iMac%Core i%' OR name LIKE 'iMac 5K%';

    -- eMac
    UPDATE "Template" SET "historicalNotes" = 'The eMac was Apple''s answer to a market reality: schools needed CRTs because CRTs were cheaper, but Apple had abandoned CRTs for LCDs. Apple built one final CRT-based all-in-one, originally sold only to education, then opened to consumers after they asked loudly enough. The flat-face 17" Trinitron was among the best displays Apple ever shipped on a sub-$1,000 machine.'
      WHERE name LIKE 'eMac%';

    -- iBook G3
    UPDATE "Template" SET "historicalNotes" = 'The ''consumer iMac to go'' that Jobs announced at Macworld 1999. The clamshell design was aggressively polarizing — critics mocked it, buyers purchased it by the millions. It was the first consumer laptop with built-in wireless networking (AirPort), hidden in the handle. Available in Tangerine, Blueberry, Graphite, Lime, and Indigo — the most colorful laptop lineup Apple has ever sold.'
      WHERE name LIKE 'iBook G3%';

    -- iBook G4
    UPDATE "Template" SET "historicalNotes" = 'The iBook G4 replaced the beloved clamshell with a white polycarbonate design that would define Apple''s consumer laptop aesthetic for years. The G4''s reliable performance and the white case''s café-culture appeal made it the most visible laptop in coffee shops and universities throughout the mid-2000s. It was Apple''s best-selling laptop until the MacBook replaced it in 2006.'
      WHERE name LIKE 'iBook G4%';

    -- Mac Mini
    UPDATE "Template" SET "historicalNotes" = '''BYODKM: Bring Your Own Display, Keyboard, and Mouse.'' The Mac Mini launched at $499 and changed the argument about what a computer needed to include. Jobs placed it on a stage and it was smaller than any computer the audience had imagined possible. The G4 first generation proved there was a market for Apple''s most affordable Mac; the Intel transition made it the foundation of Apple''s consumer desktop lineup.'
      WHERE name LIKE 'Mac Mini%' OR name LIKE 'Mac mini%';

    -- Mac Pro
    UPDATE "Template" SET "historicalNotes" = 'The Mac Pro replaced the Power Mac G5 in 2006 as Apple''s professional desktop, now powered by Intel Xeon processors in a case virtually identical to its predecessor. The 2006 and 2008 towers established Apple''s premium workstation credentials in the Intel era, offering expansion, dual-processor options, and the raw performance that professional video, audio, and science applications demanded.'
      WHERE name LIKE 'Mac Pro%' AND name NOT LIKE '%2013%' AND name NOT LIKE '%Trash%';

    UPDATE "Template" SET "historicalNotes" = 'The most controversial professional Mac Apple ever built. Announced with the memorable ''Can''t innovate anymore, my ass'' from Phil Schiller, the cylindrical design required custom dual GPUs that couldn''t be independently upgraded. By 2017 Apple publicly apologized for it, acknowledging the thermal design had trapped them. Now a cult object — the machine that forced Apple to rethink what professional users actually needed.'
      WHERE name LIKE '%Mac Pro%2013%' OR name LIKE '%Trash Can%';

    -- Macintosh Server G3
    UPDATE "Template" SET "historicalNotes" = 'The Macintosh Server G3 was Apple''s professional server offering in 1997 — a minitower configured for network services, file sharing, and web hosting at a time when AppleShare and Mac OS X Server were Apple''s enterprise play. It represents Apple''s brief serious attempt to compete in the server market before ultimately abandoning rackmount hardware for the Xserve.'
      WHERE name LIKE '%Server G3%' OR name LIKE '%G3 Server%';

  END IF;
END $$;
