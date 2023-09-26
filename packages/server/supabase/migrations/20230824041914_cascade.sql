-- Add ON DELETE CASCADE to all foreign keys so that we can delete users without having to delete all the documents first.

alter table "public"."document_permissions" drop constraint "document_permissions_document_id_fkey";

alter table "public"."document_permissions" drop constraint "document_permissions_user_id_fkey";

alter table "public"."document_relations" drop constraint "document_relations_child_id_fkey";

alter table "public"."document_relations" drop constraint "document_relations_parent_id_fkey";

alter table "public"."documents" drop constraint "documents_user_id_fkey";

alter table "public"."workspaces" drop constraint "workspaces_document_nano_id_fkey";

alter table "public"."workspaces" drop constraint "workspaces_owner_user_id_fkey";

alter table "public"."document_permissions" add constraint "document_permissions_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE not valid;

alter table "public"."document_permissions" validate constraint "document_permissions_document_id_fkey";

alter table "public"."document_permissions" add constraint "document_permissions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."document_permissions" validate constraint "document_permissions_user_id_fkey";

alter table "public"."document_relations" add constraint "document_relations_child_id_fkey" FOREIGN KEY (child_id) REFERENCES documents(id) ON DELETE CASCADE not valid;

alter table "public"."document_relations" validate constraint "document_relations_child_id_fkey";

alter table "public"."document_relations" add constraint "document_relations_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES documents(id) ON DELETE CASCADE not valid;

alter table "public"."document_relations" validate constraint "document_relations_parent_id_fkey";

alter table "public"."documents" add constraint "documents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."documents" validate constraint "documents_user_id_fkey";

alter table "public"."workspaces" add constraint "workspaces_document_nano_id_fkey" FOREIGN KEY (document_nano_id) REFERENCES documents(nano_id) ON DELETE CASCADE not valid;

alter table "public"."workspaces" validate constraint "workspaces_document_nano_id_fkey";

alter table "public"."workspaces" add constraint "workspaces_owner_user_id_fkey" FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."workspaces" validate constraint "workspaces_owner_user_id_fkey";
