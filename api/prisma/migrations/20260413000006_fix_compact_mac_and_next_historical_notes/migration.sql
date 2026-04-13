-- Fix historical note inaccuracies found in the compact Mac and NeXT entries.
-- These are unconditional UPDATEs so they correct any previously-seeded wrong text.

-- 1. Macintosh Classic II: was incorrectly called "The first 68030-based compact Mac."
--    The SE/30 (January 1989) was first; the Classic II arrived October 1991.
UPDATE "Template" SET "historicalNotes" =
  'A solid 68030-based compact Mac from 1991 — two years after the SE/30 first brought the 68030 to the compact form. The Classic II ran at the same 16 MHz as its predecessor but without an FPU, and Apple''s cost-cutting produced a noticeably slow hard drive. Beloved for its reliability and the fact that it kept the classic compact form alive into the early 1990s.'
  WHERE name = 'Macintosh Classic II';

-- 2. Macintosh SE/30: was called "The last of the original compact form factor."
--    It was not the last — the Classic (1990), Classic II (1991), and Mac TV (1993)
--    all followed in the same 9-inch compact case.
UPDATE "Template" SET "historicalNotes" =
  'Widely considered the greatest compact Mac ever made. The SE/30 packed a 16 MHz 68030 and 68882 FPU into the same case that started with the 128K in 1984 — and ran circles around most of the Mac II line despite fitting in a smaller box. With MODE32 it could address up to 128MB of RAM. The performance pinnacle of the compact Mac lineage, and definitively the best.'
  WHERE name = 'Macintosh SE/30';

-- 3. Macintosh Color Classic: was called "Apple's last compact Mac."
--    It was not the last — the Mac TV (October 1993) and Color Classic II (1993,
--    Japan/Canada) both followed in compact form factors.
UPDATE "Template" SET "historicalNotes" =
  'Apple''s most visually distinctive compact Mac, and its first with color — but not without compromise. The Color Classic''s fixed 512×384 Sony Trinitron display was narrower than every other Mac of its era. Apple''s cost-cutting created a machine beloved precisely for its limitations. The ''Mystic'' upgrade — swapping in a Color Classic II board — gives it a 68030 and double the RAM without changing the cult-status exterior.'
  WHERE name = 'Macintosh Color Classic';

-- 4. NeXTstation: claimed "the same 68040 processor" as the Cube, but the original
--    NeXT Cube shipped with a 25 MHz 68030. The NeXTstation actually stepped up to
--    a 25 MHz 68040 — a different, newer chip.
UPDATE "Template" SET "historicalNotes" =
  'The ''affordable'' NeXT — $4,995 instead of $6,500 for the original Cube, and slab-shaped instead of cubic. Where the original Cube shipped with a 25 MHz 68030, the NeXTstation stepped up to a 25 MHz 68040, making it measurably faster for the floating-point-heavy workloads NeXTSTEP favoured. It was deployed heavily in universities, financial institutions, and research labs throughout the early 1990s. Most of the internet infrastructure concepts that became mainstream in the late 1990s were prototyped and proven on machines exactly like this one.'
  WHERE name IN ('NeXTstation') AND "historicalNotes" IS NOT NULL;

-- 5. Macintosh IIfx: claimed "dedicated I/O processors for each NuBus slot."
--    The IIfx''s two 65C020 co-processors handled serial-port and SCSI I/O;
--    they were not tied to individual NuBus slots.
UPDATE "Template" SET "historicalNotes" =
  'Apple called it ''wicked fast'' in the marketing, and for 1990 the description was honest. At $10,000 retail — more than most cars — the IIfx used dedicated 65C020 co-processors to offload serial and SCSI I/O from the main CPU, custom DRAM timing developed in-house, and a 40 MHz 68030 that was measurably faster than any other Mac available. The most expensive and most powerful 68k Mac Apple ever built.'
  WHERE name = 'Macintosh IIfx';
