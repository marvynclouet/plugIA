import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('interactions')
@UseGuards(JwtAuthGuard)
export class InteractionsController {
  constructor(private interactionsService: InteractionsService) {}

  @Post('collect/:accountId')
  async collect(@Param('accountId') accountId: string) {
    return this.interactionsService.collectInstagramInteractions(accountId);
  }

  @Get('workspace/:workspaceId')
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Query() filters: any,
  ) {
    return this.interactionsService.findAll(workspaceId, filters);
  }
}

