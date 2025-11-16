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

