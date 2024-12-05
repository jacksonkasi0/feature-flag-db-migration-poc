CREATE TABLE IF NOT EXISTS "tweets" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"user_id" varchar(36),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
 ALTER TABLE "tweets" ADD CONSTRAINT "tweets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
