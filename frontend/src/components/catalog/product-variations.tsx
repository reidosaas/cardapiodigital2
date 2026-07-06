'use client';

interface Variacao {
  nome: string;
  opcoes: { nome: string; acrescimo?: number }[];
}

interface ProductVariationsProps {
  variacoes: Variacao[];
  selected: Record<string, string>;
  onSelect: (nome: string, opcao: string) => void;
  corPrimaria?: string;
}

export function ProductVariations({ variacoes, selected, onSelect, corPrimaria }: ProductVariationsProps) {
  if (!variacoes?.length) return null;

  return (
    <div className="space-y-4">
      {variacoes.map((variacao) => (
        <div key={variacao.nome}>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{variacao.nome}</h4>
          <div className="flex flex-wrap gap-2">
            {variacao.opcoes.map((opcao) => {
              const isSelected = selected[variacao.nome] === opcao.nome;
              return (
                <button
                  key={opcao.nome}
                  onClick={() => onSelect(variacao.nome, opcao.nome)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    isSelected
                      ? 'text-white border-transparent shadow-md'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                  }`}
                  style={isSelected ? { backgroundColor: corPrimaria || '#2563eb', borderColor: corPrimaria || '#2563eb' } : {}}
                >
                  {opcao.nome}
                  {opcao.acrescimo ? ` (+R$ ${opcao.acrescimo.toFixed(2)})` : ''}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
