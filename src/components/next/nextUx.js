const ERROR_MESSAGES = Object.freeze({
  authenticated_user_required: "ログイン情報を確認できませんでした。もう一度ログインしてください。",
  personal_workspace_required: "個人ワークスペースを準備できませんでした。画面を再読み込みしてください。",
  MEMBER_EMAIL_INVALID: "メールアドレスの形式を確認してください。",
  MEMBER_INVITATION_FAILED: "招待を完了できませんでした。既に登録済みでないか確認して、もう一度お試しください。",
  MEMBER_BOOTSTRAP_FAILED: "招待先の利用環境を準備できませんでした。しばらく待ってから再試行してください。",
  MEMBER_STATE_UPDATE_FAILED: "アカウント状態を変更できませんでした。再読み込みしてからお試しください。",
  MEMBER_ADMIN_FAILED: "チーム情報を更新できませんでした。再読み込みしてからお試しください。",
});

export function friendlyError(error, fallback = "処理を完了できませんでした。通信状態を確認して、もう一度お試しください。") {
  const code = String(error?.message || error || "");
  return ERROR_MESSAGES[code] || fallback;
}
