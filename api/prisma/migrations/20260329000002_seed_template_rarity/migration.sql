-- Seed rarity values for known templates based on historical production volumes and collectibility

-- EXTREMELY_RARE
UPDATE "Template" SET rarity = 'EXTREMELY_RARE' WHERE id IN (
  210,  -- Macintosh TV (~10k units, extremely brief production)
  107,  -- Apple Lisa (original)
  9000, -- NeXT Cube
  9005  -- NeXTcube Turbo
);

-- VERY_RARE
UPDATE "Template" SET rarity = 'VERY_RARE' WHERE id IN (
  1,    -- Macintosh 128k (original Mac, ~70k units)
  35,   -- Macintosh Portable (both backlit and non-backlit rows share id 35)
  209,  -- Macintosh Color Classic II (Japan/Canada only, never sold in US)
  68,   -- PowerBook G3 Kanga/3500c (brief transition model, very limited run)
  87,   -- Twentieth Anniversary Macintosh (~12k units, $7,499 original price)
  108,  -- Apple Lisa 2
  109,  -- Apple Lisa 2/10 (Macintosh XL)
  9001, -- NeXTstation (Slab)
  9002, -- NeXTstation Color (Color Slab)
  9003, -- NeXTstation Turbo (Turbo Slab)
  9004  -- NeXTstation Turbo Color (Turbo Color Slab)
);

-- RARE
UPDATE "Template" SET rarity = 'RARE' WHERE id IN (
  2,    -- Macintosh 512k
  3,    -- Macintosh 512Ke
  14,   -- Macintosh IIfx (very expensive, limited sales)
  32,   -- Macintosh Quadra 840AV
  33,   -- Macintosh Quadra 900
  34,   -- Macintosh Quadra 950
  56,   -- Power Macintosh G3 All-In-One "Molar Mac" (education channel only)
  60,   -- Power Macintosh G4 Cube (discontinued after ~1 year)
  54,   -- Power Macintosh 9500 (high-end workstation, limited sales)
  85,   -- Xserve G4
  86,   -- Xserve G5
  36,   -- PowerBook 100 (co-developed with Sony, high price)
  38,   -- PowerBook 170 (top-of-line 68k, limited production)
  247,  -- PowerBook Duo 2300c (last 68k PowerBook Duo)
  256,  -- PowerBook 2400c/180 (Japan-focused subnotebook)
  257,  -- PowerBook 2400c/240
  264,  -- PowerBook 5300ce/117 (top-spec, limited)
  101,  -- Apple II (original 1977)
  105,  -- Apple IIc Plus (short production run)
  6000, -- Apple Newton MessagePad (original)
  6005, -- Apple Newton MessagePad 2000
  6006, -- Apple Newton MessagePad 2100
  7024, -- Apple Macintosh 12" RGB Display
  7025, -- Apple Macintosh 12" Monochrome Display
  7027, -- Apple Macintosh 21" Color Display
  7033, -- Apple High-Resolution Monochrome Display
  7034, -- Apple Two-Page Monochrome Display
  7035  -- Apple Macintosh Portrait Display
);

-- UNCOMMON
UPDATE "Template" SET rarity = 'UNCOMMON' WHERE id IN (
  4,    -- Macintosh Plus
  6,    -- Macintosh SE/30
  9,    -- Macintosh Color Classic
  10,   -- Macintosh II
  11,   -- Macintosh IIx
  12,   -- Macintosh IIcx
  13,   -- Macintosh IIci
  15,   -- Macintosh IIsi
  16,   -- Macintosh IIvi
  17,   -- Macintosh IIvx
  18,   -- Macintosh LC
  19,   -- Macintosh LC II
  20,   -- Macintosh LC III / LC III+
  21,   -- Macintosh LC 475
  22,   -- Macintosh LC 520
  23,   -- Macintosh LC 550
  24,   -- Macintosh LC 575
  25,   -- Macintosh LC 580 / LC 630
  26,   -- Macintosh Quadra 605
  27,   -- Macintosh Quadra 610
  28,   -- Macintosh Quadra 630
  29,   -- Macintosh Quadra 650
  229,  -- Macintosh Quadra 660AV
  30,   -- Macintosh Quadra 700
  31,   -- Macintosh Quadra 800
  37,   -- PowerBook 140
  237,  -- PowerBook 145
  238,  -- PowerBook 150
  239,  -- PowerBook 160
  240,  -- PowerBook 165
  241,  -- PowerBook 165c
  39,   -- PowerBook 180
  242,  -- PowerBook 180c
  243,  -- PowerBook 190
  244,  -- PowerBook 190cs
  40,   -- PowerBook Duo 210
  41,   -- PowerBook Duo 230
  42,   -- PowerBook Duo 250
  43,   -- PowerBook Duo 270c
  245,  -- PowerBook Duo 280
  246,  -- PowerBook Duo 280c
  44,   -- PowerBook 520
  248,  -- PowerBook 520c
  45,   -- PowerBook 540c / 549 / 550c
  249,  -- PowerBook 540
  250,  -- PowerBook 1400cs/117
  251,  -- PowerBook 1400c/117
  252,  -- PowerBook 1400cs/133
  253,  -- PowerBook 1400c/133
  254,  -- PowerBook 1400cs/166
  255,  -- PowerBook 1400c/166
  258,  -- PowerBook 3400c/180
  259,  -- PowerBook 3400c/200
  260,  -- PowerBook 3400c/240
  261,  -- PowerBook 5300/100
  262,  -- PowerBook 5300cs/100
  263,  -- PowerBook 5300c/100
  46,   -- Power Macintosh 6100
  265,  -- Power Macintosh G3 Minitower
  47,   -- Power Macintosh 7100
  48,   -- Power Macintosh 8100
  49,   -- Power Macintosh 5200 LC
  50,   -- Power Macintosh 6200
  51,   -- Power Macintosh 7200
  52,   -- Power Macintosh 7500
  53,   -- Power Macintosh 8500
  58,   -- Power Macintosh G4 Yikes!
  64,   -- Power Macintosh G4 FW800
  67,   -- Power Macintosh G5 Late 2005 Dual Core
  69,   -- PowerBook G3 Wallstreet
  70,   -- PowerBook G3 Lombard
  71,   -- PowerBook G3 Pismo
  72,   -- PowerBook G4 Titanium
  73,   -- PowerBook G4 DVI
  76,   -- PowerBook G4 17"
  78,   -- iMac G4
  80,   -- eMac
  81,   -- iBook G3 Clamshell
  102,  -- Apple II Plus
  103,  -- Apple IIe
  104,  -- Apple IIc
  106,  -- Apple IIGS
  6001, -- Newton MessagePad 100
  6002, -- Newton MessagePad 110
  6003, -- Newton MessagePad 120
  6004, -- Newton MessagePad 130
  6007, -- Apple eMate 300
  7000, -- Apple Monitor II
  7001, -- Apple Monitor III
  7002, -- Apple Monitor //c
  7003, -- AppleColor Composite Monitor //e
  7004, -- Macintosh Color Display 14"
  7005, -- AppleColor High-Resolution RGB Monitor
  7006, -- Apple Multiple Scan 14
  7007, -- Apple Multiple Scan 15
  7008, -- Apple Multiple Scan 17
  7009, -- Apple Multiple Scan 20
  7010, -- Apple Studio Display 17" CRT
  7011, -- Apple Studio Display 15" LCD DB-15
  7012, -- Apple Cinema Display 22" LCD DVI Clear
  7013, -- Apple Cinema HD Display 23" LCD ADC
  7014, -- Apple Cinema Display 30" LCD
  7020, -- Apple Studio Display 21" CRT
  7021, -- Apple Studio Display 17" ADC CRT
  7022, -- Apple Multiple Scan 720
  7023, -- Apple AppleVision 850 AV
  7026, -- Apple Macintosh 16" Color Display
  7028, -- Apple Performa Display
  7029, -- Apple Performa Plus Display
  7030, -- Apple Basic Color Monitor
  7031, -- Apple AudioVision 14 Display
  7032, -- Apple Color Plus 14 Display
  7036, -- Apple Multiple Scan 15AV
  7037, -- Apple Multiple Scan 1705
  7038, -- AppleVision 1710
  7039, -- AppleVision 1710AV
  7040, -- AppleVision/ColorSync 750
  7041, -- AppleVision/ColorSync 750AV
  7042, -- AppleVision/ColorSync 850AV
  7043, -- Apple ColorSync 17" Display
  7044, -- Apple ColorSync 20" Display
  7045, -- Apple Studio Display 15" LCD Blueberry
  7046, -- Apple Studio Display 15" LCD ADC Clear
  7047, -- Apple Studio Display 17" LCD ADC Clear
  7048  -- Apple Cinema Display 22" LCD ADC Clear
);

-- COMMON
UPDATE "Template" SET rarity = 'COMMON' WHERE id IN (
  5,    -- Macintosh SE
  7,    -- Macintosh Classic
  8,    -- Macintosh Classic II
  55,   -- Power Macintosh G3 Desktop (Beige G3)
  57,   -- Power Macintosh G3 Blue & White
  59,   -- Power Macintosh G4 AGP (Sawtooth)
  61,   -- Power Macintosh G4 Digital Audio
  62,   -- Power Macintosh G4 Quicksilver
  63,   -- Power Macintosh G4 MDD
  65,   -- Power Macintosh G5
  66,   -- Power Macintosh G5 June 2004
  74,   -- PowerBook G4 12"
  75,   -- PowerBook G4 15"
  77,   -- iMac G3
  79,   -- iMac G5
  82,   -- iBook G3 Dual USB
  83,   -- iBook G4
  84,   -- Mac mini G4
  7015, -- LED Cinema Display 24"
  7016, -- LED Cinema Display 27"
  7017, -- Thunderbolt Display 27"
  7018, -- Apple Pro Display XDR
  7019  -- Apple Studio Display 5K
);
