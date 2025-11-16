import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DmService } from './dm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendDmDto } from './dto/send-dm.dto';

@Controller('dm')
@UseGuards(JwtAuthGuard)
export class DmController {
  constructor(private dmService: DmService) {}

  @Get('templates/:workspaceId')
  async getTemplates(@Param('workspaceId') workspaceId: string) {
    return this.dmService.getTemplates(workspaceId);
  }

  @Post('send')
  async sendDm(@Body() dto: SendDmDto) {
    return this.dmService.sendDm(
      dto.accountId,
      dto.targetId,
      dto.template,
      dto.variables,
    );
  }

  @Get('sequences/:workspaceId')
  async getSequences(
    @Param('workspaceId') workspaceId: string,
    @Query() filters: any,
  ) {
    // Implémenter la récupération des séquences
    return { sequences: [] };
  }
}

