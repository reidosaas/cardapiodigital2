const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.entregadorCheckin.findMany({
  orderBy: { checkinEm: 'desc' },
  take: 5,
  include: { entregador: { select: { nome: true } } }
}).then(r => {
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
