# Google Operations Data Governance
Mail/file/calendar本文、binary、token、OAuth code、prompt本文はLedger/Auditへ保存しない。保存可能なのは識別子、hash、MIME、size、freshness、classification、件数、正規化状態。restricted/confidential handoffはApproval必須。Retention期限後はserver-side cleanup対象。Workspace property/account/channel bindingを必須とする。
