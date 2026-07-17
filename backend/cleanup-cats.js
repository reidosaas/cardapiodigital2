const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  await p.categoriaGlobal.deleteMany();

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
    await p.categoriaGlobal.create({ data: cat });
  }
  console.log('Criadas:', categorias.length, 'categorias com emojis');
  await p.$disconnect();
})();
