import { IsString, IsIn } from 'class-validator';

export class UpdateLeadStatusDto {
  @IsString()
  @IsIn(['new', 'contacted', 'in_progress', 'converted', 'refused'])
  status: string;
}

