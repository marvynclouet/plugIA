import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get('workspace/:workspaceId')
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Query() filters: any,
  ) {
    return this.leadsService.findAll(workspaceId, filters);
  }

  @Get('suggested-messages')
  async getSuggestedMessages(
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.leadsService.getSuggestedMessages(workspaceId);
  }

  @Post('suggested-messages/:id/:action')
  async validateMessage(
    @Param('id') id: string,
    @Param('action') action: 'validate' | 'reject',
    @Query('workspaceId') workspaceId: string,
    @Body() body?: { content?: string },
  ) {
    return this.leadsService.validateMessage(id, workspaceId, action, body?.content);
  }

  @Post('autopilot/validate-batch')
  async validateBatch(
    @Query('workspaceId') workspaceId: string,
    @Body() body: { messageIds: string[] },
  ) {
    return this.leadsService.validateBatch(workspaceId, body.messageIds);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.leadsService.findOne(id, workspaceId);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.leadsService.updateStatus(id, workspaceId, dto.status);
  }

  @Get('export/csv/:workspaceId')
  async exportCsv(
    @Param('workspaceId') workspaceId: string,
    @Res() res: Response,
  ) {
    const csv = await this.leadsService.exportToCsv(workspaceId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="leads-${workspaceId}-${Date.now()}.csv"`,
    );
    res.send(csv);
  }
}

