import { pgTable, serial, varchar, text, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const moviesRelations = relations(movies, ({ many }) => ({
  showtimes: many(showtimes),
}));

export const showtimesRelations = relations(showtimes, ({ one }) => ({
  movie: one(movies, { fields: [showtimes.movieId], references: [movies.id] }),
}));
