-- Fix Newton and eMate notes (prior migrations used wrong prefix — actual names start with "Apple")
-- Also add Apple Studio Display historical notes

-- Original Newton MessagePad (all non-2000-series models)
UPDATE "Template" SET "historicalNotes" = 'Apple''s first handheld computer, launched in 1993 under CEO John Sculley. The original MessagePad''s handwriting recognition was imperfect and became the punchline of a thousand jokes, but it pioneered concepts — syncing, handwriting input, persistent assistant software — that wouldn''t be mainstream for another decade. The 100, 110, 120, and 130 iterated steadily on the hardware while Newton OS matured. Steve Jobs killed the entire platform on his first day back. The Newton community never forgave him.'
  WHERE name IN (
    'Apple Newton MessagePad',
    'Apple Newton MessagePad 100',
    'Apple Newton MessagePad 110',
    'Apple Newton MessagePad 120',
    'Apple Newton MessagePad 130'
  ) AND "historicalNotes" IS NULL;

-- MessagePad 2000 / 2100
UPDATE "Template" SET "historicalNotes" = 'The most powerful Newton ever made — a 162 MHz StrongARM processor, a large backlit display, and a software platform that had matured enormously since the 1993 original. By 1997 the handwriting recognition actually worked, and the device had a devoted professional following. Jobs cancelled it anyway in 1998, calling it too far from the Mac ecosystem. The Newton community had already been through this once with Sculley; this time they knew it was permanent.'
  WHERE name IN ('Apple Newton MessagePad 2000', 'Apple Newton MessagePad 2100') AND "historicalNotes" IS NULL;

-- eMate 300
UPDATE "Template" SET "historicalNotes" = 'Apple''s Newton-based laptop designed for education — a clamshell device with a real keyboard, a 28-hour battery life, and a design intended to survive a student''s backpack. The translucent green and white casing predated the iMac G3''s translucent aesthetic by a year. Schools loved it; Apple killed it in 1998 along with the rest of the Newton line when Jobs returned. The eMate is a striking preview of what Apple''s product line might have looked like if he''d come back a year later.'
  WHERE name = 'Apple eMate 300' AND "historicalNotes" IS NULL;

-- Apple Studio Display 17" CRT (the original, 1998)
UPDATE "Template" SET "historicalNotes" = 'Apple''s first Studio Display, released alongside the blue-and-white Power Mac G3 in 1999. A 17-inch CRT in a matching translucent blue-and-white enclosure — the first display Apple designed to match the new G3 aesthetic rather than the beige towers that preceded it. Purely a CRT in an era when flat-panels were still prohibitively expensive for most buyers.'
  WHERE name = 'Apple Studio Display 17" CRT' AND "historicalNotes" IS NULL;

-- Apple Studio Display 17" ADC CRT (last CRT, 2000)
UPDATE "Template" SET "historicalNotes" = 'Apple''s last CRT display — and the one that introduced the Apple Display Connector. ADC combined power, video, and USB into a single cable, eliminating the tangle of connectors that had frustrated users since the first monitors shipped. The 17-inch ADC CRT carried this elegant solution into the final generation of CRT displays before Apple moved entirely to flat panels. No other major computer company had ever condensed monitor cabling to a single wire; it would be over a decade before the industry reached the same conclusion with USB-C.'
  WHERE name = 'Apple Studio Display 17" ADC CRT' AND "historicalNotes" IS NULL;

-- Apple Studio Display 17" LCD (first LCD Studio Display)
UPDATE "Template" SET "historicalNotes" = 'Apple''s transition from CRT to LCD in the Studio Display line, shipped as flat panels became affordable enough for professional buyers. The 17-inch LCD marked Apple''s commitment to the format that would define its display lineup for the next two decades. Thinner, cooler, and easier to position than any CRT — the tradeoff was color accuracy that lagged behind the Trinitron CRTs it replaced, a gap Apple would close with later Cinema and Thunderbolt displays.'
  WHERE name = 'Apple Studio Display 17" LCD' AND "historicalNotes" IS NULL;

-- Apple Studio Display 15" LCD (Apple's first flat-panel display, 1998)
UPDATE "Template" SET "historicalNotes" = 'Apple''s first flat-panel display, launched in November 1998 alongside the original iMac — and one of the first LCD monitors any computer company sold as a standard product. At $999, it cost as much as the iMac itself. The 15-inch 1024×768 panel was sharper and cooler than any CRT of comparable size, and it signaled definitively where Apple thought computing was going. The industry took another four years to catch up. Every flat panel sold since traces a direct line back to this moment.'
  WHERE name = 'Apple Studio Display 15" LCD' AND "historicalNotes" IS NULL;

-- Apple Studio Display 21" CRT (high-end CRT for professional use)
UPDATE "Template" SET "historicalNotes" = 'Apple''s largest and most expensive CRT — a 21-inch Trinitron-based display aimed at professional designers and publishers who needed maximum screen real estate before flat panels could deliver it. At the time, a 21-inch CRT offered color accuracy and pixel density that no affordable LCD could match. The production run overlapped with Apple''s first LCD displays, making the 21" CRT a machine-room fixture for professionals who weren''t ready to sacrifice color fidelity for desk space.'
  WHERE name = 'Apple Studio Display 21" CRT' AND "historicalNotes" IS NULL;
