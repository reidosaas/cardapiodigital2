const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.entregadorCheckin.findMany({
  where: { vendedorId: '69f384f1-0f00-499b-a6b2-45933f5a0789' },
  take: 5,
  orderBy: { checkinEm: 'desc' }
}).then(v => { console.log('Checkins:', v); p.$disconnect(); });