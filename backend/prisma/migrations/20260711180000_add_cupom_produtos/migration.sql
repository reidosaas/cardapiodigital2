-- CreateTable for many-to-many Cupom <-> Produto
CREATE TABLE "_CupomProdutos" (
    "A" uuid NOT NULL,
    "B" uuid NOT NULL,

    CONSTRAINT "_CupomProdutos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CupomProdutos_B_index" ON "_CupomProdutos"("B");

-- AddForeignKey
ALTER TABLE "_CupomProdutos" ADD CONSTRAINT "_CupomProdutos_A_fkey" FOREIGN KEY ("A") REFERENCES "cupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CupomProdutos" ADD CONSTRAINT "_CupomProdutos_B_fkey" FOREIGN KEY ("B") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
