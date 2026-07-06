import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  nome: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  senha: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  telefone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  nomeLoja?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  slug?: string;
}
