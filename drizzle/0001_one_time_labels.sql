ALTER TABLE "categories" ADD COLUMN "saved" boolean DEFAULT true NOT NULL;--> statement-breakpoint
-- Data: entries in the old catch-all "Others" category kept their real label in the note.
-- Give each label its own one-time (unsaved) category, move the entries there, and drop
-- "Others" if it ends up empty. Labels matching an existing category are merged into it.
INSERT INTO "categories" ("user_id", "name", "kind", "color", "saved")
SELECT "user_id", "label", 'expense', ((row_number() OVER (PARTITION BY "user_id" ORDER BY "label") - 1) % 8 + 1)::text, false
FROM (
  SELECT DISTINCT ON (t."user_id", lower(btrim(t."note"))) t."user_id", btrim(t."note") AS "label"
  FROM "transactions" t JOIN "categories" c ON c."id" = t."category_id"
  WHERE lower(c."name") = 'others' AND btrim(coalesce(t."note", '')) <> ''
  ORDER BY t."user_id", lower(btrim(t."note")), btrim(t."note")
) labels
ON CONFLICT ("user_id", lower("name")) DO NOTHING;
--> statement-breakpoint
UPDATE "transactions" t SET "category_id" = target."id", "note" = NULL
FROM "categories" c, "categories" target
WHERE c."id" = t."category_id" AND lower(c."name") = 'others'
  AND btrim(coalesce(t."note", '')) <> ''
  AND target."user_id" = t."user_id" AND lower(target."name") = lower(btrim(t."note"));
--> statement-breakpoint
DELETE FROM "categories" c
WHERE lower(c."name") = 'others'
  AND NOT EXISTS (SELECT 1 FROM "transactions" t WHERE t."category_id" = c."id");
