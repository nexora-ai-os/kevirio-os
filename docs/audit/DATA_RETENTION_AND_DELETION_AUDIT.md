# Data Retention and Deletion Audit

Business dataのTTL/archive/soft-delete/hard-delete/backup deletion/provider deletion/verificationはない。Settings resetは一部localStorage keysのみをremoveし、全key/Browser cache/provider cache/Supabase cacheを消さない。

Supabase sandbox cacheにはoptional `expires_at`があるが、自動purge jobはRepositoryにない。Account/workspace/client-contract termination deletion、export、backup restore policyは未実装。
