CREATE TABLE IF NOT EXISTS "makers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "makers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"human_name" varchar(100),
	"biz_name" varchar(150) NOT NULL,
	"instagram" varchar(255),
	"facebook" varchar(255),
	"website" varchar(255),
	"description" varchar(280) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "posts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"content" text DEFAULT '' NOT NULL
);
