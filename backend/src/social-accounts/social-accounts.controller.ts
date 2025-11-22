import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { SocialAccountsService } from './social-accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('social-accounts')
@UseGuards(JwtAuthGuard)
export class SocialAccountsController {
  constructor(private socialAccountsService: SocialAccountsService) {}

  @Get('instagram/auth-url')
  async getInstagramAuthUrl(@Query('workspaceId') workspaceId: string) {
    return {
      url: await this.socialAccountsService.getInstagramAuthUrl(workspaceId),
    };
  }

  @Get('instagram/callback')
  async handleInstagramCallback(
    @Query('code') code: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.socialAccountsService.handleInstagramCallback(code, workspaceId);
  }

  @Get('facebook/auth-url')
  async getFacebookAuthUrl(@Query('workspaceId') workspaceId: string) {
    return {
      url: await this.socialAccountsService.getFacebookAuthUrl(workspaceId),
    };
  }

  @Get('facebook/callback')
  async handleFacebookCallback(
    @Query('code') code: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.socialAccountsService.handleFacebookCallback(code, workspaceId);
  }

  @Get('workspace/:workspaceId')
  async findAll(
    @CurrentUser() user: any,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.socialAccountsService.findAll(workspaceId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.socialAccountsService.findOne(id, workspaceId);
  }
}

