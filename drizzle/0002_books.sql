CREATE TYPE "public"."book_period" AS ENUM('all', 'month');--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"period" "book_period" DEFAULT 'month' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "categories_user_name_uq";--> statement-breakpoint
DROP INDEX "transactions_user_date_idx";--> statement-breakpoint
DROP INDEX "transactions_user_category_idx";--> statement-breakpoint
DROP INDEX "transactions_user_legacy_uq";--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "book_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "book_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "active_book_id" uuid;--> statement-breakpoint
-- Data: every existing user gets a "Lifetime" book (all-time view) that holds their current data.
INSERT INTO "books" ("user_id", "name", "period") SELECT "id", 'Lifetime', 'all' FROM "users";--> statement-breakpoint
UPDATE "categories" c SET "book_id" = b."id" FROM "books" b WHERE b."user_id" = c."user_id";--> statement-breakpoint
UPDATE "transactions" t SET "book_id" = b."id" FROM "books" b WHERE b."user_id" = t."user_id";--> statement-breakpoint
UPDATE "users" u SET "active_book_id" = b."id" FROM "books" b WHERE b."user_id" = u."id";--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "book_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "book_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "books_user_name_uq" ON "books" USING btree ("user_id",lower("name"));--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_book_name_uq" ON "categories" USING btree ("book_id",lower("name"));--> statement-breakpoint
CREATE INDEX "transactions_book_date_idx" ON "transactions" USING btree ("book_id","occurred_on" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "transactions_book_category_idx" ON "transactions" USING btree ("book_id","category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_book_legacy_uq" ON "transactions" USING btree ("book_id","legacy_id");