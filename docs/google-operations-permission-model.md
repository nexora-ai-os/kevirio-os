# Google Operations Permission Model
inspect/proposeはOwner Workspace内のDry Runのみ。readはconnection、account、scope、policy、quota、cost確認後。draftはPolicy依存。create/update/send/publish/delete/shareはLOCKED。revoke/configureはOwner-only。Approvalはexact target、recipient/file/channel、sensitivity、calls、cost、expiry、one-time、idempotency、request hashへbindingする。
