import {test,expect} from "@playwright/test";
import {createClient} from "@supabase/supabase-js";
import {readFile} from "node:fs/promises";
import {AUTH_FILE,assertOwnerPage} from "./support.mjs";
import {getLocalSupabaseEnvironment} from "./local-supabase-fixture.mjs";

const clientOptions={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const sessionFromState=async()=>{const state=JSON.parse(await readFile(AUTH_FILE,"utf8"));return JSON.parse(state.origins[0].localStorage[0].value)};
const confirmClick=async(page,button)=>{page.once("dialog",dialog=>dialog.accept());await button.click()};

test("fresh Member completes invite registration consent lifecycle while private records remain isolated",async({page,browser})=>{
  test.setTimeout(120_000);
  const env=getLocalSupabaseEnvironment(),admin=createClient(env.url,env.serviceKey,clientOptions);
  const email=`phase5-member-${Date.now()}@local.test`,password="Member-Local-Aa1!";
  await assertOwnerPage(page,"/team");
  const inspection=await page.evaluate(async()=>{const key=Object.keys(localStorage).find(value=>value.startsWith("sb-")&&value.endsWith("-auth-token")),session=JSON.parse(localStorage.getItem(key));const response=await fetch("/api/members",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${session.access_token}`},body:JSON.stringify({action:"inspect"})});return{status:response.status,body:await response.json()}});
  expect(inspection,JSON.stringify(inspection)).toMatchObject({status:200,body:{ok:true}});
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByRole("button",{name:"招待メールを送る"}).click();
  const ownerRow=page.getByRole("row").filter({hasText:email});
  await expect(ownerRow).toContainText("招待済み");

  const generated=await admin.auth.admin.generateLink({type:"invite",email,options:{redirectTo:"http://127.0.0.1:5173/home"}});
  expect(generated.error).toBeNull();
  const invitationLink=generated.data.properties.action_link;
  expect(invitationLink).toMatch(/^http:\/\/127\.0\.0\.1:54321\/auth\/v1\/verify/);
  const memberContext=await browser.newContext({locale:"ja-JP",timezoneId:"Asia/Tokyo"}),memberPage=await memberContext.newPage();
  await memberPage.goto(invitationLink,{waitUntil:"domcontentloaded"});
  await expect(memberPage.getByRole("heading",{name:"メンバー登録"})).toBeVisible({timeout:30_000});
  await memberPage.getByLabel("パスワード",{exact:true}).fill(password);
  await memberPage.getByLabel("パスワード（確認）").fill(password);
  await memberPage.getByRole("button",{name:"登録して文書確認へ"}).click();
  await expect(memberPage.getByRole("heading",{name:"必須文書の確認"})).toBeVisible();
  const checks=memberPage.locator('input[type="checkbox"]');await expect(checks.first()).toBeVisible();for(let i=0;i<await checks.count();i++)await checks.nth(i).check();
  const acceptButton=memberPage.getByRole("button",{name:"同意を記録して利用開始"});await expect(acceptButton).toBeEnabled();await acceptButton.click();
  await expect(memberPage.getByText("現在の必須文書への同意を記録しました。")).toBeVisible();
  await memberPage.getByRole("button",{name:"同意状態を再確認"}).click();
  await expect(memberPage.locator("nav[aria-label]").first()).toBeVisible({timeout:30_000});

  await memberPage.goto("/opportunities");
  const title=`初回案件 ${Date.now()}`;await memberPage.getByLabel("案件名").fill(title);await memberPage.getByLabel("仕事内容").fill("初回価値到達の検証");await memberPage.getByRole("button",{name:"非公開で保存"}).click();await expect(memberPage.getByText(title,{exact:true})).toBeVisible();
  const member=await admin.auth.admin.listUsers({page:1,perPage:1000}),user=member.data.users.find(value=>value.email===email);expect(user).toBeTruthy();
  const mapping=await admin.from("account_personal_workspaces").select("workspace_id").eq("user_id",user.id).single();expect(mapping.error).toBeNull();
  const ownerClient=createClient(env.url,env.anonKey,clientOptions),ownerSession=await sessionFromState();await ownerClient.auth.setSession({access_token:ownerSession.access_token,refresh_token:ownerSession.refresh_token});
  const denied=await ownerClient.from("personal_operational_records").select("id").eq("workspace_id",mapping.data.workspace_id);expect(denied.error).toBeNull();expect(denied.data).toEqual([]);

  await page.reload();const activeRow=page.getByRole("row").filter({hasText:email});await expect(activeRow).toContainText("利用中");await confirmClick(page,activeRow.getByRole("button",{name:"一時停止"}));await expect(activeRow).toContainText("利用停止中");
  await memberPage.bringToFront();await expect(memberPage.getByRole("heading",{name:"利用停止中"})).toBeVisible({timeout:15_000});
  await confirmClick(page,activeRow.getByRole("button",{name:"利用を再開"}));await expect(activeRow).toContainText("同意が必要");
  await memberPage.reload();await expect(memberPage.getByRole("heading",{name:"必須文書の確認"})).toBeVisible();const rechecks=memberPage.locator('input[type="checkbox"]');await expect(rechecks.first()).toBeVisible();for(let i=0;i<await rechecks.count();i++)await rechecks.nth(i).check();const reaccept=memberPage.getByRole("button",{name:"同意を記録して利用開始"});await expect(reaccept).toBeEnabled();await reaccept.click();await memberPage.getByRole("button",{name:"同意状態を再確認"}).click();await expect(memberPage.locator("nav[aria-label]").first()).toBeVisible();
  await page.reload();const reactivatedRow=page.getByRole("row").filter({hasText:email});await confirmClick(page,reactivatedRow.getByRole("button",{name:"無効化"}));await expect(reactivatedRow).toContainText("無効");
  await memberPage.reload();await expect(memberPage.getByRole("heading",{name:"無効なアカウント"})).toBeVisible();
  const retained=await admin.from("personal_operational_records").select("id").eq("workspace_id",mapping.data.workspace_id);expect(retained.error).toBeNull();expect(retained.data.length).toBeGreaterThan(0);
  await memberContext.close();
});
