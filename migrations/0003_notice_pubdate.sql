-- 公告唯一性：pubdate 为公告每个属性（当前为 dialog）的必须字段，内容一致时保持不变，内容变更时刷新为保存时间戳
UPDATE notices SET dialog_json = json_set(dialog_json, '$.dialog.pubdate', updated_at) WHERE dialog_json IS NOT NULL;
