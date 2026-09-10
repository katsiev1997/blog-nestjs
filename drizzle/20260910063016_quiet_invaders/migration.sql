ALTER TABLE "users" ADD COLUMN "imageUrl" varchar(255);--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "imageUrl" DROP NOT NULL;