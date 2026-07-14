const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  await p.categoriaGlobal.deleteMany();
  console.log('Todas categorias removidas');

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
    await p.categoriaGlobal.create({ data: cat });
  }
  console.log('Criadas:', categorias.length, 'categorias');
  await p.$disconnect();
})();
