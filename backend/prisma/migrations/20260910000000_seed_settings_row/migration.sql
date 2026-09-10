-- The settings table is a singleton (id is always 1). Seed it here so the row always
-- exists, rather than relying on the app to create it on first read -- concurrent first
-- requests would otherwise race to insert it and one would fail on the primary key.
INSERT INTO "settings" ("id", "safetyBufferDays", "workDays")
VALUES (1, 2, '1,2,3,4,5')
ON CONFLICT ("id") DO NOTHING;
