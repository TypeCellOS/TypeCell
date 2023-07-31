BEGIN;

select plan(4);

CREATE OR REPLACE FUNCTION create_supabase_user(identifier text, email text default null, phone text default null, metadata jsonb default null)
RETURNS uuid
    SECURITY DEFINER
    SET search_path = auth, pg_temp
AS $$
DECLARE
    user_id uuid;
BEGIN

    -- create the user
    user_id := '00000000-0000-0000-0000-000000000000'::uuid; --extensions.uuid_generate_v4();
    INSERT INTO auth.users (id, email, phone, raw_user_meta_data)
    VALUES (user_id, coalesce(email, concat(user_id, '@test.com')), phone, jsonb_build_object('test_identifier', identifier) || coalesce(metadata, '{}'::jsonb))
    RETURNING id INTO user_id;

    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

select create_supabase_user('fake_user');

-- Insert a valid row into workspaces and documents

INSERT INTO documents(nano_id, user_id, data, public_access_level) 
  VALUES ('dFakeNanoId', '00000000-0000-0000-0000-000000000000'::uuid, E'\\xDEADBEEF', 'read');


SELECT ok(
  (SELECT COUNT(*) FROM documents WHERE nano_id = 'dFakeNanoId') = 1,
  'Inserting a valid document should succeed'
);

INSERT INTO workspaces(name, owner_user_id, is_username, document_nano_id) 
  VALUES ('fake_workspace', '00000000-0000-0000-0000-000000000000'::uuid, true, 'dFakeNanoId');

SELECT ok(
  (SELECT COUNT(*) FROM workspaces WHERE name='fake_workspace') = 1,
  'Inserting a valid workspace should succeed'
);



-- Insert an invalid row into workspaces and documents
SELECT throws_ok(
  $$INSERT INTO workspaces(name, owner_user_id, is_username, document_nano_id) 
  VALUES ('invalid-name', '00000000-0000-0000-0000-000000000000'::uuid, true, 'dFakeNanoId')$$,
  '23514',
  'value for domain name_domain violates check constraint "name_domain_check"'
);

SELECT throws_ok(
  $$INSERT INTO documents(nano_id, user_id, data, public_access_level) 
  VALUES ('invalid_nano_id', '00000000-0000-0000-0000-000000000000'::uuid, E'\\xDEADBEEF', 'read')$$,
  '23514',
  'value for domain document_nano_id_domain violates check constraint "document_nano_id_domain_check"'
);

-- Cleanup after the tests
DELETE FROM workspaces WHERE name = 'fake_workspace';
DELETE FROM documents WHERE nano_id = 'dFakeNanoId';

-- Run the tests and clean up
SELECT * FROM finish();
ROLLBACK;
