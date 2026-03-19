CREATE TABLE "memories" (
	"id" serial PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'text',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"username" text,
	"first_name" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "profiles_chat_id_unique" UNIQUE("chat_id")
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"description" text NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
