import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cardapio.digital' },
    update: {},
    create: {
      nome: 'Admin Master',
      email: 'admin@cardapio.digital',
      senha: senhaHash,
      role: UserRole.ADMIN,
      telefone: '11999999999',
    },
  });

  console.log('Admin criado:', admin.email);

  const planos = [
    { nome: 'Gratuito', slug: 'gratuito', preco: 0, limiteProdutos: 10, limitePedidos: 50, limiteUsuarios: 1, features: ['ate 10 produtos', '1 usuario', 'catalogo basico', 'WhatsApp'] },
    { nome: 'Basico', slug: 'basico', preco: 29.90, limiteProdutos: 50, limitePedidos: 500, limiteUsuarios: 3, features: ['ate 50 produtos', '3 usuarios', 'catalogo premium', 'WhatsApp + chatbot', 'PIX'] },
    { nome: 'Profissional', slug: 'profissional', preco: 79.90, limiteProdutos: -1, limitePedidos: -1, limiteUsuarios: -1, features: ['produtos ilimitados', 'usuarios ilimitados', 'dominio personalizado', 'IA atendimento', 'todos metodos pagamento', 'relatorios avancados'] },
  ];

  for (const plano of planos) {
    await prisma.plano.upsert({
      where: { slug: plano.slug },
      update: plano,
      create: plano,
    });
  }

  console.log('Planos criados:', planos.map(p => p.slug).join(', '));
  console.log('Senha padrao: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
