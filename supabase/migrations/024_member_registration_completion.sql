begin;

create function public.complete_member_registration()
returns text language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_state text;
begin
  if v_user is null or auth.role()<>'authenticated' then raise exception 'authentication_required'; end if;
  select lifecycle_state into v_state from public.user_account_states where user_id=v_user for update;
  if v_state is null then raise exception 'account_state_required'; end if;
  if v_state in ('SUSPENDED','DEACTIVATED') then raise exception 'account_registration_forbidden'; end if;
  if v_state not in ('INVITED','REGISTERING','CONSENT_REQUIRED') then return v_state; end if;
  update public.user_account_states set lifecycle_state='CONSENT_REQUIRED',updated_at=now() where user_id=v_user;
  return 'CONSENT_REQUIRED';
end $$;

revoke all on function public.complete_member_registration() from public,anon;
grant execute on function public.complete_member_registration() to authenticated;

commit;
