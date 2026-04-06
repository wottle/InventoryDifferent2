-- Backfill externalLinkLabel from externalUrl for templates that have a URL but no label yet
UPDATE "Template"
SET "externalLinkLabel" = CASE
    WHEN "externalUrl" LIKE '%everymac.com%'      THEN 'EveryMac'
    WHEN "externalUrl" LIKE '%apple.com%'          THEN 'Apple'
    WHEN "externalUrl" LIKE '%next.com%'
      OR "externalUrl" LIKE '%nextcomputers.org%'  THEN 'NeXT'
    ELSE 'Reference'
END
WHERE "externalUrl" IS NOT NULL AND "externalLinkLabel" IS NULL;

-- Backfill rarity for templates that don't have one set yet
UPDATE "Template" SET rarity = 'EXTREMELY_RARE' WHERE rarity IS NULL AND name IN (
    'Macintosh 128k', 'Apple Lisa', 'Apple Lisa 2', 'Apple Lisa 2/10',
    'Macintosh TV', 'Twentieth Anniversary Macintosh',
    'Macintosh Color Classic II', 'PowerBook 550c',
    'Apple III', 'Apple III Plus'
);

UPDATE "Template" SET rarity = 'VERY_RARE' WHERE rarity IS NULL AND name IN (
    'Macintosh 512k', 'Macintosh IIfx',
    'Macintosh Quadra 900', 'Macintosh Quadra 950',
    'Macintosh Portable', 'Macintosh Portable Backlit',
    'Power Macintosh G4 Cube', 'Power Macintosh 9500/132', 'Power Macintosh 9600',
    'PowerBook Duo 2300c', 'Apple IIGS',
    'Apple Newton MessagePad', 'Apple Newton MessagePad 100',
    'Apple Newton MessagePad 2000', 'Apple Newton MessagePad 2100',
    'NeXT Cube', 'NeXTcube Turbo', 'NeXTstation Turbo', 'NeXTstation Turbo Color',
    'Xserve G4', 'Xserve G5', 'Mac Pro (2013)',
    'Power Macintosh G3 All-In-One', 'Apple eMate 300',
    'Twentieth Anniversary Macintosh Keyboard'
);

UPDATE "Template" SET rarity = 'RARE' WHERE rarity IS NULL AND name IN (
    'Macintosh 512Ke', 'Macintosh Color Classic',
    'Macintosh IIcx', 'Macintosh IIci',
    'Macintosh Quadra 700', 'Macintosh Quadra 800', 'Macintosh Quadra 840AV',
    'PowerBook 100',
    'PowerBook Duo 210', 'PowerBook Duo 230', 'PowerBook Duo 250',
    'PowerBook Duo 270c', 'PowerBook Duo 280', 'PowerBook Duo 280c',
    'PowerBook 5300ce/117', 'Power Macintosh 8100/80', 'Power Macintosh 9500',
    'iMac G4', 'NeXTstation', 'NeXTstation Color',
    'Apple Newton MessagePad 110', 'Apple Newton MessagePad 120', 'Apple Newton MessagePad 130',
    'PowerBook G3 (Kanga)', 'Performa 6300', 'Apple IIc Plus',
    'Apple Adjustable Keyboard', 'Newton Keyboard',
    'Mac Pro (Early 2006)', 'Mac Pro (Early 2008)', 'Mac Pro (Early 2009)',
    'Mac Pro (Mid 2010)', 'Mac Pro (Mid 2012)'
);

UPDATE "Template" SET rarity = 'UNCOMMON' WHERE rarity IS NULL AND name IN (
    'Macintosh SE/30', 'Macintosh Classic II',
    'Macintosh IIx', 'Macintosh IIsi', 'Macintosh IIvi', 'Macintosh IIvx', 'Macintosh II',
    'Macintosh LC 475', 'Macintosh LC 520', 'Macintosh LC 550',
    'Macintosh LC 575', 'Macintosh LC 580', 'Macintosh LC 630',
    'Macintosh Quadra 610', 'Macintosh Quadra 630',
    'Macintosh Quadra 650', 'Macintosh Quadra 660AV',
    'PowerBook 140', 'PowerBook 145', 'PowerBook 150',
    'PowerBook 160', 'PowerBook 165', 'PowerBook 165c',
    'PowerBook 170', 'PowerBook 180', 'PowerBook 180c',
    'PowerBook 190', 'PowerBook 190cs',
    'PowerBook 520', 'PowerBook 520c', 'PowerBook 540', 'PowerBook 540c',
    'PowerBook 5300/100', 'PowerBook 5300cs/100', 'PowerBook 5300c/100',
    'PowerBook 1400cs/117', 'PowerBook 1400c/117',
    'PowerBook 1400cs/133', 'PowerBook 1400c/133',
    'PowerBook 1400cs/166', 'PowerBook 1400c/166',
    'PowerBook 2400c/180', 'PowerBook 2400c/240',
    'PowerBook 3400c/180', 'PowerBook 3400c/200', 'PowerBook 3400c/240',
    'Power Macintosh 7200/75', 'Power Macintosh 7300', 'Power Macintosh 7500/100',
    'Power Macintosh 7600', 'Power Macintosh 8500/120', 'Power Macintosh 8600',
    'Power Macintosh 4400/200', 'Power Macintosh 5400', 'Power Macintosh 5500',
    'Power Macintosh 6400', 'Power Macintosh 6500',
    'PowerBook G3 Series (Wallstreet)', 'PowerBook G3 (Bronze Keyboard)', 'PowerBook G3 (FireWire)',
    'PowerBook G4 (Titanium)', 'PowerBook G4 (DVI)',
    'PowerBook G4 (12-inch)', 'PowerBook G4 (15-inch)', 'PowerBook G4 (17-inch)',
    'iBook G3', 'Mac mini G4', 'eMac', 'iMac G5',
    'Apple IIc', 'Apple II Plus', 'Apple II',
    'Original Macintosh Keyboard', 'Lisa Keyboard'
);

-- Everything else with a NULL rarity defaults to COMMON
UPDATE "Template" SET rarity = 'COMMON' WHERE rarity IS NULL;
