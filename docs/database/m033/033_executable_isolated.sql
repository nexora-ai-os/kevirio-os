begin;
do $tests$
declare
  valid_urls text[]:=array[
    'https://px.a8.net/svt/ejp?a8mat=4B7U0U+1IRWFM+5QLS+BZGEP',
    'https://px.a8.net/svt/ejp?a8mat=ABC%2BDEF%2F123&redirect=https%3A%2F%2Fexample.jp%2Fa%3Fb%3D1'
  ];
  invalid_urls text[]:=array['javascript:alert(1)','https://','https://exa mple.jp/a',repeat('x',2001)];
  u text;
begin
  foreach u in array valid_urls loop
    if not(length(u) between 8 and 2000 and u~'^https?://[^/?#[:space:][:cntrl:]]+([/?#][^[:space:][:cntrl:]]*)?$') then raise exception 'm033_valid_url_rejected'; end if;
  end loop;
  foreach u in array invalid_urls loop
    if length(u) between 8 and 2000 and u~'^https?://[^/?#[:space:][:cntrl:]]+([/?#][^[:space:][:cntrl:]]*)?$' then raise exception 'm033_invalid_url_accepted'; end if;
  end loop;
end $tests$;
select jsonb_build_object('result','M033_EXECUTABLE_URL_CONTRACT_PASS','a8_query_encoded','PASS','unsafe_malformed_overlong','DENIED','transaction_rolled_back',true) verification;
rollback;
