-- The policy evaluates Sunday–Saturday weeks, so weekStartsOn defaults to 0 (Sunday).
-- Existing rows (which predate this column) adopt the default, i.e. switch to Sunday weeks.
ALTER TABLE "settings" ADD COLUMN "weekStartsOn" INTEGER NOT NULL DEFAULT 0;
