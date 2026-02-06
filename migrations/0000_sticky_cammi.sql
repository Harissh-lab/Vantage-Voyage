CREATE TABLE "client_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"client_name" text NOT NULL,
	"address" text NOT NULL,
	"phone" text NOT NULL,
	"has_vip_guests" boolean DEFAULT false,
	"has_friends" boolean DEFAULT false,
	"has_family" boolean DEFAULT false,
	CONSTRAINT "client_details_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"date" timestamp NOT NULL,
	"location" text NOT NULL,
	"description" text,
	"event_code" text NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"agent_id" text,
	"client_id" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "events_event_code_unique" UNIQUE("event_code")
);
--> statement-breakpoint
CREATE TABLE "guest_family" (
	"id" serial PRIMARY KEY NOT NULL,
	"guest_id" integer NOT NULL,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"age" integer
);
--> statement-breakpoint
CREATE TABLE "guest_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"guest_id" integer NOT NULL,
	"perk_id" integer,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"label_id" integer,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"booking_ref" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"arrival_date" timestamp,
	"departure_date" timestamp,
	"travel_mode" text,
	CONSTRAINT "guests_booking_ref_unique" UNIQUE("booking_ref")
);
--> statement-breakpoint
CREATE TABLE "hotel_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"hotel_name" text NOT NULL,
	"check_in_date" timestamp NOT NULL,
	"check_out_date" timestamp NOT NULL,
	"number_of_rooms" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "label_perks" (
	"id" serial PRIMARY KEY NOT NULL,
	"label_id" integer NOT NULL,
	"perk_id" integer NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"expense_handled_by_client" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "labels" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "perks" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travel_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"travel_mode" text NOT NULL,
	"departure_date" timestamp,
	"return_date" timestamp,
	"from_location" text,
	"to_location" text
);
--> statement-breakpoint
CREATE TABLE "travel_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"travel_option_id" integer NOT NULL,
	"schedule_type" text NOT NULL,
	"carrier" text NOT NULL,
	"flight_number" text,
	"departure_time" text NOT NULL,
	"arrival_time" text NOT NULL,
	"is_visible_to_client" boolean DEFAULT true,
	"is_selected" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"password" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'client' NOT NULL,
	"event_code" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "client_details" ADD CONSTRAINT "client_details_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_family" ADD CONSTRAINT "guest_family_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_requests" ADD CONSTRAINT "guest_requests_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_requests" ADD CONSTRAINT "guest_requests_perk_id_perks_id_fk" FOREIGN KEY ("perk_id") REFERENCES "public"."perks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_bookings" ADD CONSTRAINT "hotel_bookings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label_perks" ADD CONSTRAINT "label_perks_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label_perks" ADD CONSTRAINT "label_perks_perk_id_perks_id_fk" FOREIGN KEY ("perk_id") REFERENCES "public"."perks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perks" ADD CONSTRAINT "perks_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_options" ADD CONSTRAINT "travel_options_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_schedules" ADD CONSTRAINT "travel_schedules_travel_option_id_travel_options_id_fk" FOREIGN KEY ("travel_option_id") REFERENCES "public"."travel_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");