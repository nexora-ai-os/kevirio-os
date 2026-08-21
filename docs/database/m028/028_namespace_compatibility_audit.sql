-- Production-compatible namespace audit. Read-only and fixture-free.
-- This intentionally excludes `extensions` from search_path so every pgcrypto
-- dependency must remain explicitly schema-qualified.
begin read only;
set local search_path = pg_catalog, public;

do $$
begin
  if to_regnamespace('extensions') is null then
    raise exception 'm028_extensions_schema_missing';
  end if;
  if to_regprocedure('extensions.digest(text,text)') is null then
    raise exception 'm028_extensions_digest_missing';
  end if;
  if to_regprocedure('extensions.gen_random_uuid()') is null then
    raise exception 'm028_extensions_gen_random_uuid_missing';
  end if;
  if encode(extensions.digest('m028-namespace-probe'::text,'sha256'::text),'hex')
     <> '3025e44f58458bc196e1eb7da09dfa572d095ff7e949eb526c28d6a61ae4a2f2' then
    raise exception 'm028_extensions_digest_invalid';
  end if;
  perform extensions.gen_random_uuid();
end $$;

select jsonb_build_object(
  'result','M028_NAMESPACE_COMPATIBILITY_PASS',
  'search_path',current_setting('search_path'),
  'digest_schema','extensions',
  'uuid_schema','extensions',
  'production_mutation',false
) verification;
rollback;
