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
    { nome: 'Promocoes', icone: 'Flame', ordem: 0 },
    { nome: 'Combos', icone: 'Package', ordem: 1 },
    { nome: 'Hamburguer', icone: 'Beef', ordem: 2 },
    { nome: 'Pizza', icone: 'Pizza', ordem: 3 },
    { nome: 'Japonesa', icone: 'Fish', ordem: 4 },
    { nome: 'Arabe', icone: 'Wheat', ordem: 5 },
    { nome: 'Acai e Sucos', icone: 'Apple', ordem: 6 },
    { nome: 'Marmitex', icone: 'UtensilsCrossed', ordem: 7 },
    { nome: 'Lanches', icone: 'Sandwich', ordem: 8 },
    { nome: 'Porcoes', icone: 'Soup', ordem: 9 },
    { nome: 'Massas', icone: 'Utensils', ordem: 10 },
    { nome: 'Saladas', icone: 'Salad', ordem: 11 },
    { nome: 'Sobremesas', icone: 'Cake', ordem: 12 },
    { nome: 'Bebidas', icone: 'Wine', ordem: 13 },
    { nome: 'Cervejas', icone: 'Beer', ordem: 14 },
    { nome: 'Drinks', icone: 'Cocktail', ordem: 15 },
    { nome: 'Cafes', icone: 'Coffee', ordem: 16 },
    { nome: 'Crepes', icone: 'Croissant', ordem: 17 },
    { nome: 'Bakery', icone: 'CakeSlice', ordem: 18 },
    { nome: 'Frutos do Mar', icone: 'Shell', ordem: 19 },
    { nome: 'Churrasco', icone: 'FlameKindling', ordem: 20 },
    { nome: 'Comida Caseira', icone: 'Home', ordem: 21 },
    { nome: 'Fitness', icone: 'Dumbbell', ordem: 22 },
    { nome: 'Vegano', icone: 'Leaf', ordem: 23 },
    { nome: 'Vegetariano', icone: 'Salad', ordem: 24 },
    { nome: 'Sem Gluten', icone: 'Ban', ordem: 25 },
    { nome: 'Infantil', icone: 'Baby', ordem: 26 },
    { nome: 'Outros', icone: 'MoreHorizontal', ordem: 27 },
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
