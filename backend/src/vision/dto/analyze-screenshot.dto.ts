import { IsString, IsEnum, IsUrl } from 'class-validator';

export class AnalyzeScreenshotDto {
  @IsString()
  screenshot: string;

  @IsEnum(['tiktok', 'instagram', 'facebook', 'linkedin'])
  platform: 'tiktok' | 'instagram' | 'facebook' | 'linkedin';

  @IsUrl()
  url: string;
}

