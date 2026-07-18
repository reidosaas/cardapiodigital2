-- Normalizar telefones: remover caracteres nao numericos e transformar vazios em NULL
UPDATE "entregadores"
SET "telefone" = NULLIF(regexp_replace("telefone", '\D', '', 'g'), '')
WHERE "telefone" IS NOT NULL;

-- Indice e unicidade por telefone
CREATE UNIQUE INDEX IF NOT EXISTS "entregadores_telefone_key" ON "entregadores"("telefone");
CREATE INDEX IF NOT EXISTS "entregadores_telefone_idx" ON "entregadores"("telefone");
