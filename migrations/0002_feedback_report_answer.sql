-- 反馈提交新增：小程序日志报告与是否接受回复
ALTER TABLE feedbacks ADD COLUMN report TEXT;
ALTER TABLE feedbacks ADD COLUMN answer INTEGER;
