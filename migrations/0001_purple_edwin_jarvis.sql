ALTER TABLE "makers" ALTER COLUMN "human_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "makers" ALTER COLUMN "biz_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "makers" ALTER COLUMN "description" DROP NOT NULL;