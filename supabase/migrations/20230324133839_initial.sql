CREATE TYPE access_level AS ENUM ('no-access', 'read', 'write');

create table "public"."documents" (
    "id" uuid not null default uuid_generate_v4(),
    "nano_id" character varying(20) not null,
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null,
    "updated_at" timestamp with time zone not null default now(),
    "data" bytea not null,
    "public_access_level" access_level not null
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

revoke update on "public"."documents" from authenticated;
grant update(data, public_access_level, updated_at) on "public"."documents" to authenticated;

CREATE OR REPLACE FUNCTION check_column_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_access_level IS DISTINCT FROM OLD.public_access_level THEN
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

CREATE TABLE document_relations (
    parent_id uuid REFERENCES documents(id) NOT NULL,
    child_id uuid REFERENCES documents(id) NOT NULL,
    UNIQUE (parent_id, child_id)
);

CREATE TABLE document_permissions (
    document_id uuid REFERENCES documents(id) NOT NULL,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    access_level access_level NOT NULL,
    UNIQUE (document_id, user_id)
);

CREATE FUNCTION check_document_access(uid uuid, doc_id uuid)
RETURNS access_level
AS $$
DECLARE
    access access_level;
BEGIN
    -- Get the access for the current document
    SELECT p.access_level FROM document_permissions p WHERE p.user_id = uid AND document_id = doc_id INTO access;

    if access IS NOT NULL then
      RETURN access;
    end if;

    -- get access for parent, use MIN to take the most restrictive access. 
    -- Note that this is a recursive function and could cause an infinite loop
    RETURN(
      SELECT MIN(check_document_access(uid, parent_id)) FROM document_relations r WHERE child_id = doc_id
    );
END;
$$ LANGUAGE plpgsql;

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
using ((public_access_level >= 'read') OR (auth.uid() = user_id) OR (check_document_access(auth.uid(), id) >= 'read'));

create policy "Enable update for authenticated users only"
on "public"."documents"
as permissive
for update
to authenticated
using ((public_access_level >= 'write') OR (auth.uid() = user_id) OR (check_document_access(auth.uid(), id) >= 'write'))
with check (true);


create table "public"."workspaces" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone not null default now(),
    "name" character varying not null,
    "owner_user_id" uuid not null,
    "is_username" boolean not null
);

alter table "public"."workspaces" enable row level security;

CREATE UNIQUE INDEX workspaces_pkey ON public.workspaces USING btree (id);

CREATE UNIQUE INDEX workspaces_name_key ON public.workspaces USING btree (name);

CREATE UNIQUE INDEX workspaces_owner_user_id_key ON public.workspaces USING btree (owner_user_id)  WHERE is_username IS TRUE;

alter table "public"."workspaces" add constraint "workspaces_pkey" PRIMARY KEY using index "workspaces_pkey";

alter table "public"."workspaces" add constraint "workspaces_owner_user_id_fkey" FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) not valid;

alter table "public"."workspaces" validate constraint "workspaces_owner_user_id_fkey";

create policy "Enable insert for authenticated users only"
on "public"."workspaces"
as permissive
for insert
to authenticated
with check ((auth.uid() = owner_user_id));


create policy "Enable read access for all users"
on "public"."workspaces"
as permissive
for select
to public
using (true);

-- TODO: prevent select * using https://stackoverflow.com/questions/74283527/postgresql-remove-ability-to-query-every-row-in-a-table
-- TODO: validate formats of nanoids and usernames