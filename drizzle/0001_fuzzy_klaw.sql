CREATE TABLE "food_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "food_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "food_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image_url" text NOT NULL,
	"tag" varchar(80),
	"variants" jsonb NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "food_products" ADD CONSTRAINT "food_products_category_id_food_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."food_categories"("id") ON DELETE restrict ON UPDATE no action;
-- Preserve the existing cafe menu while moving it into editable tables.
INSERT INTO "food_categories" ("name", "sort_order") VALUES ('Snacks', 0), ('Drinks', 1), ('Desserts', 2);
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Popcorn', 'The cinema classic. Made for every scene.', '/food/popcorn.jpg', 'Crowd favourite', '[{"id":"legacy-1","name":"Regular","pricePaise":null}]'::jsonb, 0 FROM "food_categories" WHERE "name" = 'Snacks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Caramel popcorn', 'A sweet, crunchy twist on movie night.', '/food/caramel-popcorn.jpg', NULL, '[{"id":"legacy-2","name":"Regular","pricePaise":null}]'::jsonb, 1 FROM "food_categories" WHERE "name" = 'Snacks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Veg puff', 'Flaky pastry with a savoury veg filling.', '/food/puff.jpg', NULL, '[{"id":"legacy-3","name":"Regular","pricePaise":null}]'::jsonb, 2 FROM "food_categories" WHERE "name" = 'Snacks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Egg puff', 'A warm and flaky interval snack.', '/food/puff.jpg', NULL, '[{"id":"legacy-4","name":"Regular","pricePaise":null}]'::jsonb, 3 FROM "food_categories" WHERE "name" = 'Snacks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Chicken puff', 'Flaky pastry with a chicken filling.', '/food/puff.jpg', NULL, '[{"id":"legacy-5","name":"Regular","pricePaise":null}]'::jsonb, 4 FROM "food_categories" WHERE "name" = 'Snacks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Veg sandwich', 'A light bite for the big screen.', '/food/sandwich.jpg', NULL, '[{"id":"legacy-6","name":"Regular","pricePaise":null}]'::jsonb, 5 FROM "food_categories" WHERE "name" = 'Snacks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Grilled Mexican veg sandwich', 'A grilled bite with a little kick.', '/food/sandwich.jpg', NULL, '[{"id":"legacy-7","name":"Regular","pricePaise":null}]'::jsonb, 6 FROM "food_categories" WHERE "name" = 'Snacks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Chicken sandwich', 'A hearty movie-time sandwich.', '/food/sandwich.jpg', NULL, '[{"id":"legacy-8","name":"Regular","pricePaise":null}]'::jsonb, 7 FROM "food_categories" WHERE "name" = 'Snacks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Grilled chicken tikka sandwich', 'A warm, spiced grilled sandwich.', '/food/sandwich.jpg', NULL, '[{"id":"legacy-9","name":"Regular","pricePaise":null}]'::jsonb, 8 FROM "food_categories" WHERE "name" = 'Snacks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Nachos with salsa', 'Crunchy nachos with a tangy dip.', '/food/nachos.jpg', 'Great to share', '[{"id":"legacy-10","name":"Regular","pricePaise":null}]'::jsonb, 9 FROM "food_categories" WHERE "name" = 'Snacks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'French fries', 'Golden, crispy and easy to share.', '/food/fries.jpg', NULL, '[{"id":"legacy-11","name":"Regular","pricePaise":null}]'::jsonb, 10 FROM "food_categories" WHERE "name" = 'Snacks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Chicken Nuggets', 'Crispy bites for the whole show.', '/food/nuggets.jpg', NULL, '[{"id":"legacy-12","name":"Regular","pricePaise":null}]'::jsonb, 11 FROM "food_categories" WHERE "name" = 'Snacks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Veg burger', 'A satisfying bite between scenes.', '/food/veg-burger.jpg', NULL, '[{"id":"legacy-13","name":"Regular","pricePaise":null}]'::jsonb, 12 FROM "food_categories" WHERE "name" = 'Snacks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Chicken Burger', 'A hearty favourite for movie night.', '/food/chicken-burger.jpg', NULL, '[{"id":"legacy-14","name":"Regular","pricePaise":null}]'::jsonb, 13 FROM "food_categories" WHERE "name" = 'Snacks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Hot coffee', 'A warming sip for your screening.', '/food/hot-coffee.jpg', NULL, '[{"id":"legacy-15","name":"Regular","pricePaise":null}]'::jsonb, 14 FROM "food_categories" WHERE "name" = 'Drinks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Cold coffee', 'Cool, creamy and movie-ready.', '/food/cold-coffee.jpg', NULL, '[{"id":"legacy-16","name":"Regular","pricePaise":null}]'::jsonb, 15 FROM "food_categories" WHERE "name" = 'Drinks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Coke', 'A chilled cola for the big screen.', '/food/coke.jpg', 'Pairs with popcorn', '[{"id":"legacy-17","name":"Regular","pricePaise":null}]'::jsonb, 16 FROM "food_categories" WHERE "name" = 'Drinks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Fanta', 'A bright, fizzy orange favourite.', '/food/fanta.jpg', NULL, '[{"id":"legacy-18","name":"Regular","pricePaise":null}]'::jsonb, 17 FROM "food_categories" WHERE "name" = 'Drinks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Sprite', 'A crisp lemon-lime refreshment.', '/food/sprite.jpg', NULL, '[{"id":"legacy-19","name":"Regular","pricePaise":null}]'::jsonb, 18 FROM "food_categories" WHERE "name" = 'Drinks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Maaza can', 'A fruity refreshment.', '/food/mango-juice.jpg', NULL, '[{"id":"legacy-20","name":"Regular","pricePaise":null}]'::jsonb, 19 FROM "food_categories" WHERE "name" = 'Drinks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Bottled water', 'Stay refreshed through the show.', '/food/water.jpg', NULL, '[{"id":"legacy-21","name":"Regular","pricePaise":null}]'::jsonb, 20 FROM "food_categories" WHERE "name" = 'Drinks';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Blackforest cake', 'A chocolatey finish to the movie.', '/food/blackforest-cake.jpg', NULL, '[{"id":"legacy-22","name":"Regular","pricePaise":null}]'::jsonb, 21 FROM "food_categories" WHERE "name" = 'Desserts';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Choco Donut', 'Soft, sweet and chocolatey.', '/food/choco-donut.jpg', NULL, '[{"id":"legacy-23","name":"Regular","pricePaise":null}]'::jsonb, 22 FROM "food_categories" WHERE "name" = 'Desserts';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Brownie with ice cream', 'A warm-and-cold favourite.', '/food/brownie-ice-cream.jpg', 'Treat yourself', '[{"id":"legacy-24","name":"Regular","pricePaise":null}]'::jsonb, 23 FROM "food_categories" WHERE "name" = 'Desserts';
--> statement-breakpoint
INSERT INTO "food_products" ("category_id", "name", "description", "image_url", "tag", "variants", "sort_order") SELECT "id", 'Ice cream scoop', 'Ask for vanilla, chocolate, strawberry, butterscotch, pista or mango.', '/food/ice-cream.jpg', NULL, '[{"id":"legacy-25","name":"Regular","pricePaise":null}]'::jsonb, 24 FROM "food_categories" WHERE "name" = 'Desserts';
