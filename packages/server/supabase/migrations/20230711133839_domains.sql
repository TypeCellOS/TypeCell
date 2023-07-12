
CREATE DOMAIN document_nano_id_domain AS TEXT
CHECK(
   VALUE ~ '^d[0-9A-Za-z]{5,}(/\.inbox)?$'
);

CREATE DOMAIN name_domain AS TEXT
CHECK (
  VALUE NOT ILIKE '%typecell%' AND 
  VALUE NOT ILIKE '%admin%' AND 
  LENGTH(VALUE) BETWEEN 3 AND 20 AND 
  VALUE ~ '^[A-Za-z0-9_]*$' AND -- ensures the username only contains alphanumeric characters and underscores. 
  VALUE ~ '^([^_]*(_[^_]*)*)$' -- ensures the username does not start with, end with, or contain consecutive underscores.
);

ALTER TABLE  "public"."documents"
ALTER COLUMN "nano_id" TYPE document_nano_id_domain;

ALTER TABLE  "public"."workspaces"
ALTER COLUMN "name" TYPE name_domain,
ALTER COLUMN "document_nano_id" TYPE document_nano_id_domain;

-- make case insensitive
DROP INDEX IF EXISTS workspaces_name_key;
CREATE UNIQUE INDEX workspaces_name_key ON public.workspaces USING btree (lower(name));

-- more RLS policies
alter table "public"."document_permissions" enable row level security;
alter table "public"."document_relations" enable row level security;

create policy "Enable INSERT document_relations for users with write access only"
on "public"."document_relations"
for INSERT
to authenticated
with check (((SELECT public_access_level FROM documents WHERE id = parent_id) >= 'write') OR ((SELECT user_id FROM documents WHERE id = parent_id) = auth.uid()) OR (check_document_access(auth.uid(), parent_id) >= 'write'));

create policy "Enable SELECT document_relations for users with write access only"
on "public"."document_relations"
for SELECT
to authenticated
using (((SELECT public_access_level FROM documents WHERE id = parent_id) >= 'write') OR ((SELECT user_id FROM documents WHERE id = parent_id) = auth.uid()) OR (check_document_access(auth.uid(), parent_id) >= 'write'));

create policy "Enable UPDATE document_relations for users with write access only"
on "public"."document_relations"
for UPDATE
to authenticated
using (((SELECT public_access_level FROM documents WHERE id = parent_id) >= 'write') OR ((SELECT user_id FROM documents WHERE id = parent_id) = auth.uid()) OR (check_document_access(auth.uid(), parent_id) >= 'write'));

create policy "Enable DELETE document_relations for users with write access only"
on "public"."document_relations"
for DELETE
to authenticated
using (((SELECT public_access_level FROM documents WHERE id = parent_id) >= 'write') OR ((SELECT user_id FROM documents WHERE id = parent_id) = auth.uid()) OR (check_document_access(auth.uid(), parent_id) >= 'write'));

CREATE POLICY document_permissions_insert_policy
ON document_permissions
FOR INSERT
TO authenticated
WITH CHECK ((SELECT user_id FROM documents WHERE id = document_id) = auth.uid());

CREATE POLICY document_permissions_select_policy
ON document_permissions
FOR SELECT
TO authenticated
USING ((SELECT user_id FROM documents WHERE id = document_id) = auth.uid());

CREATE POLICY document_permissions_update_policy
ON document_permissions
FOR UPDATE
TO authenticated
USING ((SELECT user_id FROM documents WHERE id = document_id) = auth.uid());

CREATE POLICY document_permissions_delete_policy
ON document_permissions
FOR DELETE
TO authenticated
USING ((SELECT user_id FROM documents WHERE id = document_id) = auth.uid());


ALTER FUNCTION check_document_access SECURITY DEFINER;