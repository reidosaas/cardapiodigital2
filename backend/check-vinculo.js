const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.entregadorLoja.findFirst({
  where: { entregadorId: '8fe0adc9-276f-45aa-8880-83450b6330d2', status: 'ACEITO', ativo: true },
  select: { id: true, diaria: true, vendedorId: true }
}).then(v => { console.log('Vinculo:', v); p.$disconnect(); });