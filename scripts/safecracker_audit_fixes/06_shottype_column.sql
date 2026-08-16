-- PATCH /shots/:id не принимает shotType (нет в DTO) — он обновил только
-- promptFields, и колонка молча разошлась с вводным словом промпта. По колонке
-- считается чередование масштабов (§5.1), поэтому разошедшаяся колонка врёт
-- следующему аудиту. Скоуп по проекту (§11).
UPDATE shots s SET "shotType" = v.st
FROM projects p, (VALUES ('A1_SH07','MCU'), ('A8_SH10','EWS')) AS v(code, st)
WHERE p.slug = 'safecracker' AND s."projectId" = p.id AND s."shotCode" = v.code;

-- контроль: колонка обязана совпадать с promptFields.camera.shotType везде
SELECT count(*) AS rassoglasovano
FROM shots s JOIN projects p ON p.id = s."projectId"
WHERE p.slug = 'safecracker'
  AND s."shotType" IS DISTINCT FROM s."promptFields"->'camera'->>'shotType';
