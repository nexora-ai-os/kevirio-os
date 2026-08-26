select jsonb_build_object(
  'result',case when count(*) filter(where affiliate_url is not null and (length(affiliate_url) not between 8 and 2000 or affiliate_url !~ '^https?://[^/?#[:space:][:cntrl:]]+([/?#][^[:space:][:cntrl:]]*)?$'))=0 then 'M033_DATA_HEALTH_PASS' else 'M033_DATA_HEALTH_FAIL' end,
  'program_rows',count(*),'url_rows',count(*) filter(where affiliate_url is not null),
  'invalid_url_rows',count(*) filter(where affiliate_url is not null and (length(affiliate_url) not between 8 and 2000 or affiliate_url !~ '^https?://[^/?#[:space:][:cntrl:]]+([/?#][^[:space:][:cntrl:]]*)?$')),
  'truth_mutations',0
) verification from public.affiliate_program_master;
