# Google Operations Cost and Quota Policy
AI費用とGoogle quotaを別管理する。既定はtask 10 calls、daily 100 calls/service、最大50 calls/task、1000 records、10 pages、30秒、retry 1。超過、価格不明、quota不明は停止する。YouTube upload等の高quota operationはLOCKED。実際のcall数は0。
