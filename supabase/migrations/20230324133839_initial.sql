create table "public"."documents" (
    "id" uuid not null default uuid_generate_v4(),
    "nano_id" character varying(20) not null,
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null,
    "updated_at" timestamp with time zone not null default now(),
    "data" bytea not null,
    "is_public" boolean not null
);


alter table "public"."documents" enable row level security;

CREATE UNIQUE INDEX documents_nano_id_key ON public.documents USING btree (nano_id);

CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id);

alter table "public"."documents" add constraint "documents_pkey" PRIMARY KEY using index "documents_pkey";

alter table "public"."documents" add constraint "documents_nano_id_key" UNIQUE using index "documents_nano_id_key";

alter table "public"."documents" add constraint "documents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."documents" validate constraint "documents_user_id_fkey";

create policy "Enable delete for users based on user_id"
on "public"."documents"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Enable insert for authenticated users only"
on "public"."documents"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Enable read access for all users"
on "public"."documents"
as permissive
for select
to public
using (((is_public IS TRUE) OR (auth.uid() = user_id)));


create policy "Enable update for authenticated users only"
on "public"."documents"
as permissive
for update
to authenticated
using (((is_public IS TRUE) OR (auth.uid() = user_id)))
with check (true);

revoke update on "public"."documents" from authenticated;
grant update(data, is_public, updated_at) on "public"."documents" to authenticated;

CREATE OR REPLACE FUNCTION check_column_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_public IS DISTINCT FROM OLD.is_public THEN
    IF auth.uid() IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Cannot update column unless auth.uid() = user_id.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_column_update_trigger
BEFORE UPDATE ON "public"."documents"
FOR EACH ROW
EXECUTE FUNCTION check_column_update();