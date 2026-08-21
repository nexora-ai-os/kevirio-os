-- Run only after Owner practical acceptance and separate cleanup approval.
-- This deletes only the isolated M028 hash/identity manifest, never business data.
begin;
do $$
begin
  if to_regnamespace('m028_recovery') is null then
    raise exception 'm028_recovery_missing';
  end if;
end $$;
drop schema m028_recovery cascade;
commit;
