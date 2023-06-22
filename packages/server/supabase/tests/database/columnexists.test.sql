begin;
select plan(1); -- only one statement to run

SELECT has_column(
    'public',
    'documents',
    'nano_id',
    'nano_id should exist'
);

select * from finish();
rollback;