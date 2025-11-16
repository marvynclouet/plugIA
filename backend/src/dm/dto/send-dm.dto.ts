import { IsString, IsOptional, IsObject } from 'class-validator';

export class SendDmDto {
  @IsString()
  accountId: string;

  @IsString()
  targetId: string;

  @IsString()
  template: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}

