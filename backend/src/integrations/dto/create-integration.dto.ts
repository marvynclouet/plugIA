import { IsString, IsObject, IsOptional, IsBoolean } from 'class-validator';

export class CreateIntegrationDto {
  @IsString()
  type: string;

  @IsObject()
  config: {
    name?: string;
    autoSync?: boolean;
    [key: string]: any;
  };
}

