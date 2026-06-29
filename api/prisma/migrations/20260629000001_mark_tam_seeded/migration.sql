-- ID 87 (Twentieth Anniversary Macintosh) was missing from the initial
-- mark_seeded_templates migration. This patches it for databases where
-- that migration already ran without it.
UPDATE "Template" SET "isSeeded" = true WHERE id = 87;
