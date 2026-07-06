'use client';

interface Categoria {
  id: string;
  nome: string;
}

interface CategoryFilterProps {
  categorias: Categoria[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  corPrimaria?: string;
}

export function CategoryFilter({ categorias, selected, onSelect, corPrimaria }: CategoryFilterProps) {
  if (!categorias.length) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${!selected ? 'text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        style={!selected ? { backgroundColor: corPrimaria || '#2563eb' } : {}}
      >
        Todos
      </button>
      {categorias.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(selected === cat.id ? null : cat.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selected === cat.id ? 'text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          style={selected === cat.id ? { backgroundColor: corPrimaria || '#2563eb' } : {}}
        >
          {cat.nome}
        </button>
      ))}
    </div>
  );
}
