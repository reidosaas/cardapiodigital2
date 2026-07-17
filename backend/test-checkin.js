const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function testCheckin() {
  const entregadorId = '8fe0adc9-276f-45aa-8880-83450b6330d2';
  const vendedorId = '69f384f1-0f00-499b-a6b2-45933f5a0789';
  
  const vinculo = await p.entregadorLoja.findFirst({
    where: { entregadorId, vendedorId, ativo: true, status: 'ACEITO' },
  });
  
  console.log('Vinculo:', vinculo);
  
  if (!vinculo) {
    console.log('Nenhum vinculo encontrado');
    return;
  }
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const checkinExistente = await p.entregadorCheckin.findFirst({
    where: {
      entregadorId,
      vendedorId,
      lojaId: vinculo.id,
      data: hoje,
    },
  });
  
  console.log('Checkin existente:', checkinExistente);
  
  if (checkinExistente) {
    console.log('Ja fez check-in hoje');
    return;
  }
  
  const checkin = await p.entregadorCheckin.create({
    data: {
      entregadorId,
      vendedorId,
      lojaId: vinculo.id,
      data: hoje,
      valorDiaria: vinculo.diaria,
      observacao: 'Teste',
    },
  });
  
  console.log('Checkin criado:', checkin);
  await p.$disconnect();
}

testCheckin().catch(e => { console.error(e); p.$disconnect(); });