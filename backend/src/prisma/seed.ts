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

  const categorias = [
    { nome: 'Promocoes', icone: '🔥', ordem: 0 },
    { nome: 'Combos', icone: '📦', ordem: 1 },
    { nome: 'Hamburguer', icone: '🍔', ordem: 2 },
    { nome: 'Pizza', icone: '🍕', ordem: 3 },
    { nome: 'Japonesa', icone: '🍣', ordem: 4 },
    { nome: 'Arabe', icone: '🧆', ordem: 5 },
    { nome: 'Acai e Sucos', icone: '🧃', ordem: 6 },
    { nome: 'Marmitex', icone: '🍱', ordem: 7 },
    { nome: 'Lanches', icone: '🥪', ordem: 8 },
    { nome: 'Porcoes', icone: '🍟', ordem: 9 },
    { nome: 'Massas', icone: '🍝', ordem: 10 },
    { nome: 'Saladas', icone: '🥗', ordem: 11 },
    { nome: 'Sobremesas', icone: '🍰', ordem: 12 },
    { nome: 'Bebidas', icone: '🥤', ordem: 13 },
    { nome: 'Cervejas', icone: '🍺', ordem: 14 },
    { nome: 'Drinks', icone: '🍹', ordem: 15 },
    { nome: 'Cafes', icone: '☕', ordem: 16 },
    { nome: 'Crepes', icone: '🧇', ordem: 17 },
    { nome: 'Bakery', icone: '🥐', ordem: 18 },
    { nome: 'Frutos do Mar', icone: '🦐', ordem: 19 },
    { nome: 'Churrasco', icone: '🥩', ordem: 20 },
    { nome: 'Comida Caseira', icone: '🍲', ordem: 21 },
    { nome: 'Fitness', icone: '💪', ordem: 22 },
    { nome: 'Vegano', icone: '🌱', ordem: 23 },
    { nome: 'Vegetariano', icone: '🥚', ordem: 24 },
    { nome: 'Sem Gluten', icone: '🚫', ordem: 25 },
    { nome: 'Infantil', icone: '🧒', ordem: 26 },
    { nome: 'Outros', icone: '📋', ordem: 27 },
  ];

  for (const cat of categorias) {
    const existing = await prisma.categoriaGlobal.findFirst({ where: { nome: cat.nome } });
    if (!existing) {
      await prisma.categoriaGlobal.create({ data: cat });
    }
  }

  console.log('Categorias globais criadas:', categorias.length);
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
