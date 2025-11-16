import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create({
      ...dto,
      ownerId: user.id,
    });
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.workspacesService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.workspacesService.findOne(id, user.id);
  }
}

