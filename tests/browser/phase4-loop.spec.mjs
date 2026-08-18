import{test,expect}from"@playwright/test";import{assertOwnerPage}from"./support.mjs";

test("Opportunity to Work to Revenue candidate to private Learning reaches Home",async({page})=>{
  const title=`Phase4仕事 ${Date.now()}`;
  await assertOwnerPage(page,"/opportunities");
  await page.getByLabel("案件名").fill(title);
  await page.getByLabel("仕事内容").fill("安全なPhase 4フラッグシップ検証");
  await page.getByRole("button",{name:"非公開で保存"}).click();
  const item=page.getByRole("listitem").filter({hasText:title});
  await expect(item).toBeVisible();
  for(const status of["検討中","応募準備中","応募済み","受注"]){await item.getByRole("button",{name:status}).click();await expect(item).toContainText(status)}
  await assertOwnerPage(page,"/projects");
  await expect(page.getByText(title,{exact:true})).toBeVisible();
  await page.getByRole("link",{name:"この仕事の売上を記録する"}).click();
  await page.getByLabel("元の仕事（必須）").selectOption({label:title});
  await page.getByLabel("現在わかっている状態（必須）").selectOption("FORECAST");
  await page.getByLabel("メモ（任意）").fill("ユーザー確認済みの見込み。Actualではない。");
  await page.getByRole("button",{name:"売上候補として保存"}).click();
  await expect(page.getByText(/Actual Revenueには確定していません/)).toBeVisible();
  await assertOwnerPage(page,"/projects/retrospective");
  await page.getByLabel("振り返る仕事（必須）").selectOption({label:title});
  await page.getByLabel("うまくいったこと（必須）").fill("具体的な改善内容を示した");
  await page.getByLabel("次も繰り返すこと（任意）").fill("改善前後を示す");
  await page.getByRole("button",{name:"非公開で学びを保存"}).click();
  await expect(page.getByText(/自分だけの非公開記録/)).toBeVisible();
  await assertOwnerPage(page,"/home");
  await expect(page.getByText(title,{exact:false}).first()).toBeVisible();
});

test("Revenue candidate UI never promotes Work outcome to Actual",async({page})=>{await assertOwnerPage(page,"/revenue");await expect(page.getByText(/Actual Revenueは証拠確認済み/)).toBeVisible();await expect(page.getByRole("option",{name:/確定売上|Actual/})).toHaveCount(0);await expect(page.getByText(/空欄は未確認です。0円には置き換えません/)).toBeVisible()});
