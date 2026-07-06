import { Module, forwardRef } from '@nestjs/common';
import { ProdutosController } from './produtos.controller';
import { ProdutosService } from './produtos.service';
import { AssinaturasModule } from '../assinaturas/assinaturas.module';

@Module({
  imports: [forwardRef(() => AssinaturasModule)],
  controllers: [ProdutosController],
  providers: [ProdutosService],
  exports: [ProdutosService],
})
export class ProdutosModule {}
