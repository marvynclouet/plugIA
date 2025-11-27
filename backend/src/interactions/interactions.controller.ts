import { Controller, Get, Post, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('interactions')
@UseGuards(JwtAuthGuard)
export class InteractionsController {
  private readonly logger = new Logger(InteractionsController.name);

  constructor(private interactionsService: InteractionsService) {}

  @Post('collect/:accountId')
  async collect(@Param('accountId') accountId: string) {
    this.logger.log(`🔄 [API] Manual collection triggered for account: ${accountId}`);
    try {
      // Utiliser la méthode générique qui détecte automatiquement la plateforme
      const result = await this.interactionsService.collectInteractionsForAccount(accountId);
      this.logger.log(`✅ [API] Collection completed:`, result);
      return result;
    } catch (error) {
      this.logger.error(`❌ [API] Collection failed:`, error);
      throw error;
    }
  }

  @Get('workspace/:workspaceId')
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Query() filters: any,
  ) {
    return this.interactionsService.findAll(workspaceId, filters);
  }
}

