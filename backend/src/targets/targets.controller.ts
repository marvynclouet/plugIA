import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { TargetsService } from './targets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('targets')
@UseGuards(JwtAuthGuard)
export class TargetsController {
  constructor(private targetsService: TargetsService) {}

  @Post('update/:workspaceId')
  async updateTargets(@Param('workspaceId') workspaceId: string) {
    return this.targetsService.updateTargetsFromInteractions(workspaceId);
  }

  @Get('workspace/:workspaceId')
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Query() filters: any,
  ) {
    return this.targetsService.findAll(workspaceId, filters);
  }
}

