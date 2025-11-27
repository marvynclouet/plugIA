import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class TikTokService {
  private readonly logger = new Logger(TikTokService.name);
  private readonly clientKey: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly apiBaseUrl = 'https://open.tiktokapis.com/v2';

  constructor(private config: ConfigService) {
    this.clientKey = config.get('TIKTOK_CLIENT_KEY');
    this.clientSecret = config.get('TIKTOK_CLIENT_SECRET');
    this.redirectUri = config.get('TIKTOK_REDIRECT_URI');

    // En développement, utiliser localhost si pas configuré
    if (!this.redirectUri || this.redirectUri.includes('flowia.com')) {
      if (process.env.NODE_ENV !== 'production') {
        this.redirectUri = 'http://localhost:3000/auth/tiktok/callback';
      }
    }

    if (!this.clientKey || this.clientKey === 'xxxx') {
      this.logger.error('❌ TIKTOK_CLIENT_KEY is not set or has placeholder value');
      this.logger.error('   Please add your TikTok Client Key from https://developers.tiktok.com/');
    }
    if (!this.clientSecret || this.clientSecret === 'xxxx') {
      this.logger.error('❌ TIKTOK_CLIENT_SECRET is not set or has placeholder value');
      this.logger.error('   Please add your TikTok Client Secret from https://developers.tiktok.com/');
    }
    if (!this.redirectUri) {
      this.logger.error('❌ TIKTOK_REDIRECT_URI is not set in environment variables');
    }

    this.logger.log('✅ TikTokService initialized:', {
      clientKey: this.clientKey && this.clientKey !== 'xxxx' ? `${this.clientKey.substring(0, 10)}...` : 'NOT SET (placeholder)',
      redirectUri: this.redirectUri,
      hasCredentials: !!(this.clientKey && this.clientKey !== 'xxxx' && this.clientSecret && this.clientSecret !== 'xxxx'),
    });
  }

  /**
   * Génère l'URL d'authentification OAuth TikTok
   */
  getAuthUrl(workspaceId: string): string {
    if (!this.clientKey || this.clientKey === 'xxxx') {
      throw new Error('TikTok n\'est pas encore configuré. Les credentials TikTok doivent être ajoutés dans backend/.env');
    }
    if (!this.clientSecret || this.clientSecret === 'xxxx') {
      throw new Error('TikTok n\'est pas encore configuré. Les credentials TikTok doivent être ajoutés dans backend/.env');
    }
    
    // Utiliser localhost en développement si flowia.com est configuré
    let redirectUri = this.redirectUri;
    if (redirectUri && redirectUri.includes('flowia.com') && process.env.NODE_ENV !== 'production') {
      redirectUri = 'http://localhost:3000/auth/tiktok/callback';
      this.logger.warn('⚠️ Using localhost redirect URI for development');
    }
    
    if (!redirectUri) {
      throw new Error('TIKTOK_REDIRECT_URI is not configured');
    }

    // Scopes TikTok Login Kit
    const scopes = [
      'user.info.basic',      // Informations de base
      'user.info.profile',    // Profil public
      'user.info.stats',      // Statistiques
      'video.list',           // Liste des vidéos
      'comment.list',         // Liste des commentaires
    ].join(',');

    // Utiliser localhost en développement
    const finalRedirectUri = redirectUri || this.redirectUri;
    
    const params = new URLSearchParams({
      client_key: this.clientKey,
      redirect_uri: finalRedirectUri,
      scope: scopes,
      response_type: 'code',
      state: workspaceId, // Pour récupérer le workspace après callback
    });

    const authUrl = `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
    this.logger.log('🔗 Generated TikTok auth URL:', {
      clientKey: this.clientKey,
      redirectUri: this.redirectUri,
      scopes,
      url: authUrl.substring(0, 100) + '...',
    });

    return authUrl;
  }

  /**
   * Échange le code d'autorisation contre un access token
   */
  async exchangeCode(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
  }> {
    if (!this.clientKey || !this.clientSecret) {
      throw new Error('TikTok credentials not configured');
    }

    const params = new URLSearchParams({
      client_key: this.clientKey,
      client_secret: this.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
    });

    try {
      const response = await axios.post(
        'https://open.tiktokapis.com/v2/oauth/token/',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.logger.log('✅ TikTok token exchange successful');
      return response.data.data;
    } catch (error) {
      this.logger.error('❌ TikTok token exchange failed:', error.response?.data);
      throw error;
    }
  }

  /**
   * Rafraîchit un access token expiré
   */
  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const params = new URLSearchParams({
      client_key: this.clientKey,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    try {
      const response = await axios.post(
        'https://open.tiktokapis.com/v2/oauth/token/',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.logger.log('✅ TikTok token refresh successful');
      return response.data.data;
    } catch (error) {
      this.logger.error('❌ TikTok token refresh failed:', error.response?.data);
      throw error;
    }
  }

  /**
   * Récupère les informations de base de l'utilisateur
   */
  async getUserInfo(accessToken: string): Promise<{
    open_id: string;
    union_id: string;
    avatar_url: string;
    display_name: string;
    username: string;
  }> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/user/info/`,
        {
          params: {
            fields: 'open_id,union_id,avatar_url,display_name,username',
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data.data.user;
    } catch (error) {
      this.logger.error('❌ Error fetching TikTok user info:', error.response?.data);
      throw error;
    }
  }

  /**
   * Liste les vidéos de l'utilisateur
   */
  async getVideos(accessToken: string, maxCount: number = 10): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/video/list/`,
        {
          params: {
            max_count: maxCount,
            fields: 'id,title,create_time,cover_image_url,share_url,view_count,like_count,comment_count',
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data.data.videos || [];
    } catch (error) {
      this.logger.error('❌ Error fetching TikTok videos:', error.response?.data);
      throw error;
    }
  }

  /**
   * Récupère les commentaires d'une vidéo
   */
  async getVideoComments(
    accessToken: string,
    videoId: string,
    maxCount: number = 20,
  ): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/comment/list/`,
        {
          params: {
            video_id: videoId,
            max_count: maxCount,
            fields: 'id,text,create_time,like_count,user',
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data.data.comments || [];
    } catch (error) {
      this.logger.error('❌ Error fetching TikTok comments:', error.response?.data);
      throw error;
    }
  }

  /**
   * Répond à un commentaire (API officielle)
   */
  async replyToComment(
    accessToken: string,
    commentId: string,
    text: string,
  ): Promise<{ comment_id: string }> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/comment/reply/`,
        {
          comment_id: commentId,
          text,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log('✅ TikTok comment reply sent:', { commentId });
      return response.data.data;
    } catch (error) {
      this.logger.error('❌ Error replying to TikTok comment:', error.response?.data);
      throw error;
    }
  }
}

