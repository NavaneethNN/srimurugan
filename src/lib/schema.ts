import { pgTable, serial, varchar, text, boolean, timestamp, integer, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const movies = pgTable("movies", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  language: varchar("language", { length: 100 }),
  certification: varchar("certification", { length: 50 }),
  dimension: varchar("dimension", { length: 50 }),
  posterUrl: text("poster_url"),
  mobileBgUrl: text("mobile_bg_url"),
  desktopBgUrl: text("desktop_bg_url"),
  isNowShowing: boolean("is_now_showing").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const showtimes = pgTable("showtimes", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  time: varchar("time", { length: 50 }).notNull(),
  format: varchar("format", { length: 100 }).default("DOLBY ATMOS").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const upcomingMovies = pgTable("upcoming_movies", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  language: varchar("language", { length: 100 }),
  releaseDate: timestamp("release_date"),
  posterUrl: text("poster_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const foodOrders = pgTable("food_orders", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 120 }),
  seat: varchar("seat", { length: 120 }).notNull(),
  items: jsonb("items").notNull(),
  status: varchar("status", { length: 30 }).default("pending").notNull(),
  paymentStatus: varchar("payment_status", { length: 20 }).default("awaiting_payment").notNull(),
  amountPaise: integer("amount_paise"),
  razorpayOrderId: varchar("razorpay_order_id", { length: 80 }),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 80 }),
  checkoutKey: varchar("checkout_key", { length: 36 }),
  requestHash: varchar("request_hash", { length: 64 }),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("food_orders_razorpay_order_id_unique").on(table.razorpayOrderId),
  uniqueIndex("food_orders_razorpay_payment_id_unique").on(table.razorpayPaymentId),
  uniqueIndex("food_orders_checkout_key_unique").on(table.checkoutKey),
  index("food_orders_queue_idx").on(table.paymentStatus, table.status, table.id),
]);

export type FoodVariant = {
  id: string;
  name: string;
  pricePaise: number | null;
};

export const foodCategories = pgTable("food_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 80 }).notNull().unique(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const foodProducts = pgTable("food_products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => foodCategories.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description").default("").notNull(),
  imageUrl: text("image_url").notNull(),
  tag: varchar("tag", { length: 80 }),
  variants: jsonb("variants").$type<FoodVariant[]>().notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cafeUsers = pgTable("cafe_users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  pin: varchar("pin", { length: 6 }).notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const moviesRelations = relations(movies, ({ many }) => ({
  showtimes: many(showtimes),
}));

export const showtimesRelations = relations(showtimes, ({ one }) => ({
  movie: one(movies, { fields: [showtimes.movieId], references: [movies.id] }),
}));
