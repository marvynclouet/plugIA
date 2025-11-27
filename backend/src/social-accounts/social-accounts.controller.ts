import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { SocialAccountsService } from './social-accounts.service';
import { SocialConnectionService } from './providers/social-connection.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('social-accounts')
@UseGuards(JwtAuthGuard)
export class SocialAccountsController {
  constructor(
    private socialAccountsService: SocialAccountsService,
    private socialConnectionService: SocialConnectionService,
  ) {}

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

  // TikTok Routes
  @Get('tiktok/auth-url')
  async getTikTokAuthUrl(@Query('workspaceId') workspaceId: string) {
    // Pour TikTok, on utilise la capture de cookies manuelle au lieu d'OAuth
    // Rediriger vers la page de connexion manuelle
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const connectUrl = `${frontendUrl}/auth/tiktok/connect?workspaceId=${workspaceId}`;
    
    return {
      url: connectUrl,
      method: 'cookie_capture', // Indique que c'est une capture de cookies, pas OAuth
    };
  }

  @Get('tiktok/callback')
  async handleTikTokCallback(
    @Query('code') code: string,
    @Query('state') workspaceId: string,
  ) {
    return this.socialAccountsService.handleTikTokCallback(code, workspaceId);
  }

  @Get('tiktok/comments')
  async getTikTokComments(
    @Query('accountId') accountId: string,
    @Query('videoId') videoId: string,
  ) {
    return this.socialAccountsService.getTikTokComments(accountId, videoId);
  }

  @Post('tiktok/reply-comment')
  async replyToTikTokComment(
    @Body() body: { accountId: string; commentId: string; text: string },
  ) {
    return this.socialAccountsService.replyToTikTokComment(
      body.accountId,
      body.commentId,
      body.text,
    );
  }

  @Post('tiktok/send-dm')
  async sendTikTokDm(
    @Body() body: { accountId: string; username: string; message: string; workspaceId: string },
  ) {
    return this.socialAccountsService.sendTikTokDm(
      body.accountId,
      body.username,
      body.message,
      body.workspaceId,
    );
  }

  @Get('tiktok/interactions')
  async getTikTokInteractions(@Query('accountId') accountId: string) {
    return this.socialAccountsService.getTikTokInteractions(accountId);
  }

  @Get('tiktok/messages')
  async getTikTokMessages(@Query('accountId') accountId: string) {
    return this.socialAccountsService.getTikTokMessages(accountId);
  }

  @Get('tiktok/followers')
  async getTikTokFollowers(@Query('accountId') accountId: string) {
    return this.socialAccountsService.getTikTokFollowers(accountId);
  }

  @Post('tiktok/capture-cookies')
  async captureTikTokCookies(@Body() body: { workspaceId: string; cookies?: string[] }) {
    console.log('🍪 [BACKEND] captureTikTokCookies appelé');
    console.log('🍪 [BACKEND] Body reçu:', {
      workspaceId: body.workspaceId,
      cookiesCount: body.cookies?.length || 0,
      firstCookies: body.cookies?.slice(0, 3)
    });

    // Les cookies doivent être fournis depuis le frontend (depuis le navigateur de l'utilisateur)
    if (!body.cookies || body.cookies.length === 0) {
      console.error('❌ [BACKEND] Aucun cookie fourni');
      throw new Error('Les cookies sont requis. Veuillez vous connecter dans votre navigateur et fournir les cookies.');
    }
    
    console.log('✅ [BACKEND] Cookies valides, création du compte...');
    
    try {
      // Créer le compte TikTok avec les cookies fournis
      const result = await this.socialAccountsService.createTikTokAccountFromCookies(
        body.workspaceId,
        body.cookies,
      );
      
      console.log('✅ [BACKEND] Compte TikTok créé avec succès:', {
        accountId: result.accountId,
        username: result.username
      });
      
      return result;
    } catch (error: any) {
      console.error('❌ [BACKEND] Erreur lors de la création du compte TikTok:', error);
      console.error('❌ [BACKEND] Stack:', error.stack);
      throw error;
    }
  }

  @Get('tiktok/capture-status')
  async getCaptureStatus(@Query('workspaceId') workspaceId: string) {
    return this.socialAccountsService.getTikTokCaptureStatus(workspaceId);
  }

  @Post('tiktok/fetch-interactions')
  async fetchTikTokInteractions(@Body() body: { accountId: string }) {
    return this.socialAccountsService.getTikTokInteractions(body.accountId);
  }

  @Post('tiktok/start-monitoring')
  async startTikTokMonitoring(
    @Body() body: { accountId: string; rules?: any },
  ) {
    return this.socialAccountsService.startTikTokMonitoringForAccount(
      body.accountId,
      body.rules,
    );
  }

  @Post('tiktok/stop-monitoring')
  async stopTikTokMonitoring(@Body() body: { accountId: string }) {
    await this.socialAccountsService.stopTikTokMonitoring(body.accountId);
    return { message: 'TikTok monitoring stopped' };
  }

  @Get('tiktok/monitoring-status')
  async getMonitoringStatus(@Query('accountId') accountId: string) {
    return this.socialAccountsService.getTikTokMonitoringStatus(accountId);
  }

  @Post('tiktok/update-username')
  async updateTikTokUsername(
    @Body() body: { accountId: string; workspaceId: string },
  ) {
    return this.socialAccountsService.updateTikTokUsername(body.accountId, body.workspaceId);
  }

  // TikTok QR Code Connection Routes
  @Post('tiktok/qr/initiate')
  async initiateQRConnection(@Body() body: { workspaceId: string }) {
    return this.socialAccountsService.initiateTikTokQRConnection(body.workspaceId);
  }

  @Get('tiktok/qr/status/:connectionId')
  async getQRConnectionStatus(@Param('connectionId') connectionId: string) {
    return this.socialAccountsService.getTikTokQRConnectionStatus(connectionId);
  }

  @Post('tiktok/qr/complete')
  async completeQRConnection(@Body() body: { connectionId: string; workspaceId: string }) {
    return this.socialAccountsService.completeTikTokQRConnection(body.connectionId, body.workspaceId);
  }

  // 🆕 Endpoints unifiés pour toutes les plateformes
  @Post('connect/initiate')
  async initiateConnection(
    @Body() body: { platform: string; workspaceId: string },
  ) {
    return this.socialConnectionService.initiateConnection(body.platform, body.workspaceId);
  }

  @Get('connect/status/:platform/:connectionId')
  async getConnectionStatus(
    @Param('platform') platform: string,
    @Param('connectionId') connectionId: string,
  ) {
    return this.socialConnectionService.getConnectionStatus(platform, connectionId);
  }

  @Post('connect/complete')
  async completeConnection(
    @Body() body: {
      platform: string;
      workspaceId: string;
      connectionId?: string;
      cookies?: string[];
      oauthCode?: string;
    },
  ) {
    return this.socialConnectionService.completeConnection(
      body.platform,
      body.workspaceId,
      body.connectionId,
      body.cookies,
      body.oauthCode,
    );
  }

  @Get('connect/methods/:platform')
  async getAvailableMethods(@Param('platform') platform: string) {
    return {
      platform,
      methods: this.socialConnectionService.getAvailableMethods(platform),
    };
  }

  @Get('workspace/:workspaceId')
  async findAll(
    @CurrentUser() user: any,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.socialAccountsService.findAll(workspaceId);
  }

  @Delete(':id')
  async disconnect(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.socialAccountsService.disconnectAccount(id, workspaceId);
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

