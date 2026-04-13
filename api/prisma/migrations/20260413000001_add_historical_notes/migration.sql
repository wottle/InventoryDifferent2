-- Add historicalNotes to Device and Template
ALTER TABLE "Device" ADD COLUMN "historicalNotes" TEXT;
ALTER TABLE "Template" ADD COLUMN "historicalNotes" TEXT;
