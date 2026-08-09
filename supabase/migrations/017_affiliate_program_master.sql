begin;

-- Additive Program Master only. No Revenue, Cost, Evidence, provider execution,
-- or external execution records are created by this migration.
do $$ begin
  if to_regclass('public.affiliate_programs') is null or to_regclass('public.company_operating_events') is null then
    raise exception 'm017_parent_missing';
  end if;
  if to_regclass('public.affiliate_program_master') is not null then raise exception 'm017_partial_schema_detected'; end if;
end $$;

create table public.affiliate_program_master (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  asp_name text not null check(length(asp_name) between 1 and 120),
  program_id text not null check(length(program_id) between 1 and 120),
  advertiser_name text not null check(length(advertiser_name) between 1 and 200),
  program_name text not null check(length(program_name) between 1 and 500),
  category text,
  reward_type text not null default 'UNKNOWN' check(reward_type in('FIXED','PERCENTAGE','TIERED','OTHER','UNKNOWN')),
  reward_summary text,
  reward_details jsonb,
  epc numeric check(epc is null or epc>=0),
  approval_rate numeric(7,4) check(approval_rate is null or approval_rate between 0 and 100),
  revisit_window_days integer check(revisit_window_days is null or revisit_window_days>=0),
  confirmation_days integer check(confirmation_days is null or confirmation_days>=0),
  conversion_conditions text,
  rejection_conditions text,
  pr_points text,
  listing_policy text not null default 'UNKNOWN' check(listing_policy in('OK','PARTIAL','NG','UNKNOWN')),
  listing_ng_words text[],
  listing_ng_words_raw text,
  listing_ng_words_verification_status text not null check(listing_ng_words_verification_status in('CONFIRMED','NOT_CONFIRMED','NONE_CONFIRMED','UNKNOWN')),
  compliance_notes text,
  program_status text not null default 'UNKNOWN' check(program_status in('ACTIVE','PAUSED','EXPIRED','UNKNOWN')),
  affiliate_url text,
  affiliate_link_status text not null default 'NOT_REGISTERED' check(affiliate_link_status in('NOT_REGISTERED','ACTIVE','PAUSED','EXPIRED','INVALID')),
  affiliate_url_updated_at timestamptz,
  affiliate_url_updated_by uuid references auth.users(id),
  source_type text not null,
  source_verified_at timestamptz,
  source_notes text,
  owner_notes text,
  external_execution_allowed boolean not null default false check(external_execution_allowed=false),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliate_program_master_workspace_program_unique unique(workspace_id,asp_name,program_id),
  constraint affiliate_program_master_ng_contract check(
    (listing_ng_words_verification_status='NOT_CONFIRMED' and listing_ng_words is null)
    or listing_ng_words_verification_status<>'NOT_CONFIRMED'
  ),
  constraint affiliate_program_master_url_check check(affiliate_url is null or affiliate_url~'^https?://[^[:space:]]{1,1990}$'),
  constraint affiliate_program_master_link_check check(
    (affiliate_url is null and affiliate_link_status='NOT_REGISTERED')
    or (affiliate_url is not null and affiliate_link_status in('ACTIVE','PAUSED','EXPIRED'))
  )
);

create index affiliate_program_master_workspace_status_idx on public.affiliate_program_master(workspace_id,program_status,affiliate_link_status,program_id);
create trigger affiliate_program_master_touch_updated_at before update on public.affiliate_program_master for each row execute function public.touch_affiliate_updated_at();

with owner_workspaces as (
  select distinct on (wm.workspace_id) wm.workspace_id,wm.user_id
  from public.workspace_members wm join public.owner_profiles op on op.owner_id=wm.user_id
  where wm.role='owner' and wm.status='active' and op.role='owner' and op.status='active'
  order by wm.workspace_id,wm.user_id
), programs(asp_name,program_id,advertiser_name,program_name,category,reward_type,reward_summary,reward_details,epc,approval_rate,revisit_window_days,confirmation_days,conversion_conditions,listing_ng_words,listing_ng_words_raw,listing_ng_words_verification_status,compliance_notes) as (values
  ('A8.net','s00000000018047','GMOインターネット株式会社',E'ブラウザだけでできる本格的なAI画像生成\n【ConoHa AI Canvas】',E'その他（エンタメ）\nAI Image Generation','TIERED',E'初回利用 500円 エントリープラン\n初回利用 2,000円 スタンダードプラン\n初回利用 4,000円 アドバンスプラン','[{"condition":"初回利用","amount_minor":50000,"plan":"エントリープラン"},{"condition":"初回利用","amount_minor":200000,"plan":"スタンダードプラン"},{"condition":"初回利用","amount_minor":400000,"plan":"アドバンスプラン"}]'::jsonb,5.22,84.03,90,30,E'広告主新規。\nWebよりConoHaアカウント新規登録後、30日以内にAI Canvasいずれかのプラン申込・支払完了。',array['社名','サイト名','商品名などの商標ワード'],'社名、サイト名、商品名などの商標ワード','CONFIRMED',null),
  ('A8.net','s00000027395002','株式会社AIアバター',E'新感覚！AI × SNS × LIVE配信\n【Twomi】','その他（エンタメ）','FIXED','新規インストール完了 300円','[{"condition":"新規インストール完了","amount_minor":30000}]'::jsonb,45.56,100,90,30,E'広告主新規。\nアプリインストール後の初回起動完了。',null,null,'NOT_CONFIRMED','Owner提供Source上でリスティングNGワード欄を確認できない。なしと推定しない。'),
  ('A8.net','s00000027324001','株式会社DORAVERSE_JAPAN',E'Doraverse｜\n【BtoB向けSaaS】\nオフィス業務を劇的に効率化させるAIツール','その他（Webサービス）','TIERED',E'新規無料トライアル登録 62円\nStarter月額 新規契約 340円\nPro月額 新規契約 1,050円\nBusiness月額 新規契約 1,200円\nStarter年額 新規契約 2,000円\nPro年額 新規契約 6,000円\nBusiness年額 新規契約 27,000円','[{"condition":"新規無料トライアル登録","amount_minor":6200},{"condition":"Starter月額 新規契約","amount_minor":34000},{"condition":"Pro月額 新規契約","amount_minor":105000},{"condition":"Business月額 新規契約","amount_minor":120000},{"condition":"Starter年額 新規契約","amount_minor":200000},{"condition":"Pro年額 新規契約","amount_minor":600000},{"condition":"Business年額 新規契約","amount_minor":2700000}]'::jsonb,null,100,90,30,null,array['社名','サービス名','表記ゆれ'],'社名、サービス名、表記ゆれ','CONFIRMED',null),
  ('A8.net','s00000007238009','GMOデジロック株式会社',E'高品質SEO記事生成AIツール\n【Value AI Writer】',E'Webコンサルティング\nAI SEO Writing','PERCENTAGE','有料プラン購入 40%','[{"condition":"有料プラン購入","rate_percent":40}]'::jsonb,null,null,90,30,E'WEBより有料プラン契約・購入後、\n30日以上の有料契約継続。',array['ブランド名','サービス名','会社名','商標'],'ブランド名、サービス名、会社名、商標','CONFIRMED',null),
  ('A8.net','s00000025808001','PLAUD株式会社',E'世界150万人が愛用！\nあなたの生産性を最大化！\nAI搭載のボイスレコーダー\n【PLAUD】',E'その他（Webサービス）\nAI Hardware','PERCENTAGE','購入 10%','{"base":{"condition":"購入","rate_percent":10},"campaign_reference":["20件未満 10%","21〜50件 11%","51〜80件 12%","81件以上 13%"],"campaign_reference_is_historical":true}'::jsonb,44.08,64.58,90,60,E'WEB注文後、\n30日以内の入金確認。',array['社名','サービス名','商品名','表記ゆれ','aiボイスレコーダー','文字起こし','書き起こし','議事録','音声要約','aiガジェット','aiマイク'],E'社名、サービス名、商品名、表記ゆれ、\naiボイスレコーダー、文字起こし、書き起こし、\n議事録、音声要約、aiガジェット、aiマイク','CONFIRMED','Campaign tierはHistorical / Reference informationであり恒久条件ではない。'),
  ('A8.net','s00000026776002','株式会社acal',E'睡眠投資は、指先から。\nAIスマートリング\n【RingConn（リンコン）】','その他（暮らし）','PERCENTAGE','購入 7%','[{"condition":"購入","rate_percent":7}]'::jsonb,null,null,90,30,E'WEB注文後30日以内の入金確認。\n対象商品：LP掲載商品・RingConn指定商品。',array['社名','サービス名','表記ゆれ'],'社名、サービス名、表記ゆれ','CONFIRMED',null),
  ('A8.net','s00000027170001','株式会社SAZO',E'欲しい韓国商品のURLを入力するだけ！\n簡単購入代行\n【SAZO】','ショッピングモール','PERCENTAGE','購入（税抜）5%','[{"condition":"購入（税抜）","rate_percent":5}]'::jsonb,6.11,100,90,30,'WEB注文後の決済完了確認。',array['SAZO','sazo','サゾ'],'SAZO、sazo、サゾ','CONFIRMED','Sourceのcase差異を維持し、SAZOとsazoを重複排除しない。'),
  ('A8.net','s00000025109003','パナソニック株式会社',E'【パナソニック公式】\n最新オーブンレンジBistroと\nAI料理パートナーの定額購入サービス','家電','FIXED',E'初回申込＋2回目の課金完了\n7,500円','[{"condition":"初回申込＋2回目の課金完了","amount_minor":750000}]'::jsonb,null,50,90,30,E'広告主新規。\n対象商品を初めて購入。\nWEB申込後、2回目の課金完了。',null,null,'NOT_CONFIRMED','Owner提供Source上でリスティングNGワード欄を確認できない。パナソニック、Bistro等を推定登録しない。'),
  ('A8.net','s00000025316001','株式会社FURDI',E'女性専用AIパーソナルトレーニングジム\nFURDI（ファディー）','ダイエット','TIERED',E'新規無料体験 13,670円（千歳船橋店、小台店、西宮門戸厄神駅前店、武蔵小杉医大通り店）\nその他 新規無料体験 7,000円','[{"condition":"新規無料体験","amount_minor":1367000,"targets":["千歳船橋店","小台店","西宮門戸厄神駅前店","武蔵小杉医大通り店"]},{"condition":"その他 新規無料体験","amount_minor":700000}]'::jsonb,8.27,60.37,90,30,E'広告主新規。\nWEB申込後30日以内の無料体験完了。',array['社名','商品名','サービス名'],'社名、商品名、サービス名','CONFIRMED',null),
  ('A8.net','s00000027444001','AIフレンドパートナーズ株式会社',E'環境構築不要！\nAIエージェント開発を\n非エンジニアでも即実践\n【AI Agent Camp】',E'その他（Webサービス）\nAI Education','FIXED',E'新規有料プラン購入\n5,000円','[{"condition":"新規有料プラン購入","amount_minor":500000}]'::jsonb,null,100,90,30,E'広告主新規。\nWEBより有料プラン購入成立。',array['社名','サービス名','表記ゆれ'],'社名、サービス名、表記ゆれ','CONFIRMED',null),
  ('A8.net','s00000000404028','GMOペパボ株式会社',E'プログラミング不要！\nブラウザだけで動かせる\n【ロリポップ！AIエージェントクラウド】',E'Webコンサルティング\nAI Agent SaaS','FIXED','新規契約 2,000円','[{"condition":"新規契約","amount_minor":200000}]'::jsonb,null,null,90,30,E'広告主新規。\nWEB申込後の決済完了確認。',array['ロリポップ','AIエージェントクラウド','GMOペパボ等の商標・サービス名関連ワード'],E'ロリポップ、AIエージェントクラウド、\nGMOペパボ等の商標・サービス名関連ワード','CONFIRMED','Sourceの「等」を維持する。')
)
insert into public.affiliate_program_master(workspace_id,asp_name,program_id,advertiser_name,program_name,category,reward_type,reward_summary,reward_details,epc,approval_rate,revisit_window_days,confirmation_days,conversion_conditions,listing_ng_words,listing_ng_words_raw,listing_ng_words_verification_status,compliance_notes,program_status,affiliate_url,affiliate_link_status,source_type,source_notes,created_by)
select ow.workspace_id,p.asp_name,p.program_id,p.advertiser_name,p.program_name,p.category,p.reward_type,p.reward_summary,p.reward_details,p.epc,p.approval_rate,p.revisit_window_days,p.confirmation_days,p.conversion_conditions,p.listing_ng_words,p.listing_ng_words_raw,p.listing_ng_words_verification_status,p.compliance_notes,'UNKNOWN',null,'NOT_REGISTERED','OWNER_PROVIDED_A8_SCREENSHOT','Owner-provided A8.net screenshots transcribed in the V2.0 implementation directive.',ow.user_id
from owner_workspaces ow cross join programs p
on conflict(workspace_id,asp_name,program_id) do nothing;

create function public.save_affiliate_program_master_link(p_workspace_id uuid,p_program_master_id uuid,p_affiliate_url text,p_link_status text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_url text:=nullif(btrim(p_affiliate_url),''); v_status text:=coalesce(nullif(btrim(p_link_status),''),'NOT_REGISTERED'); v_id uuid;
begin
  if auth.role()<>'authenticated' or v_actor is null then raise exception 'owner_authentication_required'; end if;
  if not exists(select 1 from public.workspace_members wm join public.owner_profiles op on op.owner_id=wm.user_id where wm.workspace_id=p_workspace_id and wm.user_id=v_actor and wm.role='owner' and wm.status='active' and op.role='owner' and op.status='active') then raise exception 'workspace_owner_access_denied'; end if;
  if v_url is null then v_status:='NOT_REGISTERED';
  elsif v_url!~'^https?://[^[:space:]]{1,1990}$' then raise exception 'affiliate_url_invalid';
  elsif v_status not in('ACTIVE','PAUSED','EXPIRED') then raise exception 'affiliate_link_status_invalid'; end if;
  update public.affiliate_program_master set affiliate_url=v_url,affiliate_link_status=v_status,affiliate_url_updated_at=now(),affiliate_url_updated_by=v_actor
  where id=p_program_master_id and workspace_id=p_workspace_id returning id into v_id;
  if v_id is null then raise exception 'affiliate_program_master_not_found'; end if;
  insert into public.company_operating_events(workspace_id,entity_type,entity_id,event_type,actor_type,actor_id,safe_metadata)
  values(p_workspace_id,'affiliate_program_master',v_id,'affiliate_program_link_updated','owner',v_actor::text,jsonb_build_object('link_status',v_status,'external_execution','LOCKED'));
  return v_id;
end $$;

alter table public.affiliate_program_master enable row level security;
create policy affiliate_program_master_owner_read on public.affiliate_program_master for select to authenticated using (
  exists(select 1 from public.workspace_members wm join public.owner_profiles op on op.owner_id=wm.user_id where wm.workspace_id=affiliate_program_master.workspace_id and wm.user_id=auth.uid() and wm.role='owner' and wm.status='active' and op.role='owner' and op.status='active')
);
revoke all on table public.affiliate_program_master from public,anon,authenticated;
grant select on table public.affiliate_program_master to authenticated,service_role;
revoke all on function public.save_affiliate_program_master_link(uuid,uuid,text,text) from public,anon;
grant execute on function public.save_affiliate_program_master_link(uuid,uuid,text,text) to authenticated,service_role;

commit;
