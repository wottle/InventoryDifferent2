-- Fix escaped double-quotes stored literally as \" in template fields.
-- The seed parser did not handle the \" escape sequence, so values like
-- '17\" LCD' were stored as '17\" LCD' instead of '17" LCD'.

UPDATE "Template" SET
  name           = REPLACE(name,           '\"', '"'),
  "additionalName" = REPLACE("additionalName", '\"', '"'),
  cpu            = REPLACE(cpu,            '\"', '"'),
  ram            = REPLACE(ram,            '\"', '"'),
  graphics       = REPLACE(graphics,       '\"', '"'),
  storage        = REPLACE(storage,        '\"', '"')
WHERE
  name            LIKE '%\"%' OR
  "additionalName" LIKE '%\"%' OR
  cpu             LIKE '%\"%' OR
  ram             LIKE '%\"%' OR
  graphics        LIKE '%\"%' OR
  storage         LIKE '%\"%';
