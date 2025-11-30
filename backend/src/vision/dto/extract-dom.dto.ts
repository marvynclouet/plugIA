import { IsString, IsEnum, IsUrl, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class InteractionDto {
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsEnum(['like', 'comment', 'follow', 'share', 'mention'])
  type: 'like' | 'comment' | 'follow' | 'share' | 'mention';

  @IsString()
  timestamp: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;
}

export class ExtractDomDto {
  @IsEnum(['tiktok', 'instagram', 'facebook', 'linkedin'])
  platform: 'tiktok' | 'instagram' | 'facebook' | 'linkedin';

  @IsUrl()
  url: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InteractionDto)
  interactions: InteractionDto[];

  @IsString()
  extractedAt: string;
}

