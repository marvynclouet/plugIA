import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateIntegrationDto } from './dto/create-integration.dto';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(private integrationsService: IntegrationsService) {}

  @Post('workspace/:workspaceId')
  async create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateIntegrationDto,
  ) {
    return this.integrationsService.create(workspaceId, dto.type, dto.config);
  }

  @Get('workspace/:workspaceId')
  async findAll(@Param('workspaceId') workspaceId: string) {
    return this.integrationsService.findAll(workspaceId);
  }
}

