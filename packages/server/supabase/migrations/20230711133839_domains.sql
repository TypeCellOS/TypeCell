
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