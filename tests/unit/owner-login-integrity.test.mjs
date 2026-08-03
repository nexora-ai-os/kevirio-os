import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../../src/components/SupabaseOwnerAuthGate.jsx", import.meta.url), "utf8");

test("Owner login forwards the current email and password exactly once", () => {
  assert.equal((source.match(/signInWithPassword\(/g) || []).length, 1);
  assert.match(source, /signInWithPassword\(\{ email, password \}\)/);
  assert.doesNotMatch(source, /password\.(trim|toLowerCase|toUpperCase|normalize)\(/);
  assert.doesNotMatch(source, /(encodeURIComponent|JSON\.stringify|FormData)\(password/);
});

test("Owner login is a controlled keyboard-submittable password form", () => {
  assert.match(source, /<form[^>]+onSubmit=\{signIn\}/);
  assert.match(source, /name="email" type="email" value=\{email\}/);
  assert.match(source, /name="password" type=\{showPassword \? "text" : "password"\} value=\{password\}/);
  assert.match(source, /onChange=\{\(event\) => setPassword\(event\.target\.value\)\}/);
  assert.match(source, /type="submit"/);
  assert.match(source, /event\.preventDefault\(\)/);
});

test("Owner login provides password visibility without changing the value", () => {
  assert.match(source, /setShowPassword\(\(current\) => !current\)/);
  assert.match(source, /aria-pressed=\{showPassword\}/);
  assert.match(source, /onMouseDown=\{\(event\) => event\.preventDefault\(\)\}/);
  assert.doesNotMatch(source, /setPassword\([^)]*showPassword/);
});

test("Owner login warns for Caps Lock without exposing password content", () => {
  assert.match(source, /getModifierState\("CapsLock"\)/);
  assert.match(source, /Caps Lockがオンになっています。/);
  assert.match(source, /role="status"/);
});

test("Owner login maps auth failures without user enumeration", () => {
  for (const code of ["invalid_credentials", "email_not_confirmed", "too_many_requests", "rate_limit", "fetch_error"]) assert.match(source, new RegExp(code));
  assert.match(source, /OWNER_LOGIN_ERROR\.UNKNOWN/);
  assert.match(source, /role="alert" aria-live="assertive"/);
  assert.doesNotMatch(source, /user (exists|does not exist)|account (exists|does not exist)/i);
});

test("Owner login exposes only a safe environment label and quiet recovery note", () => {
  assert.match(source, /KEVIRIO Production/);
  assert.match(source, /ローカル開発環境/);
  assert.match(source, /autoComplete="username"/);
  assert.match(source, /autoComplete="current-password"/);
  assert.match(source, /再設定機能は現在準備中です。/);
  assert.doesNotMatch(source, /auth-recovery[^\n]*<(button|a)/);
  assert.doesNotMatch(source, /VITE_SUPABASE|SUPABASE_URL|PUBLISHABLE_KEY|SECRET_KEY/);
});

test("invalid credentials alone shows concise human-error prevention hints", () => {
  assert.match(source, /loginErrorCode === "invalid_credentials"/);
  assert.match(source, /Caps Lockがオンになっていないか確認してください。/);
  assert.match(source, /パスワード表示ボタンで入力内容を確認できます。/);
});

test("Owner login does not expose or persist credentials", () => {
  assert.doesNotMatch(source, /console\.|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(source, /hardcoded|bypass|fake login/i);
  assert.match(source, /setPassword\(""\)/);
});
