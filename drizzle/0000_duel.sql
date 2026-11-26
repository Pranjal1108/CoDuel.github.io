CREATE TABLE rooms (code text PRIMARY KEY NOT NULL, host text NOT NULL, guest text, config text NOT NULL, starts integer, host_result text, guest_result text);
--> statement-breakpoint
CREATE TABLE profiles (id text PRIMARY KEY NOT NULL, data text NOT NULL);
