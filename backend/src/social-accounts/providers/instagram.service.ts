import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class InstagramService {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;
  private readonly apiBaseUrl = 'https://graph.facebook.com/v18.0';

  constructor(private config: ConfigService) {
    this.appId = config.get('META_APP_ID');
    this.appSecret = config.get('META_APP_SECRET');
    this.redirectUri = config.get('META_REDIRECT_URI');
    
    if (!this.appId) {
      console.error('❌ META_APP_ID is not set in environment variables');
    }
    if (!this.appSecret) {
      console.error('❌ META_APP_SECRET is not set in environment variables');
    }
    if (!this.redirectUri) {
      console.error('❌ META_REDIRECT_URI is not set in environment variables');
    }
    
    console.log('✅ InstagramService initialized:', {
      appId: this.appId ? `${this.appId.substring(0, 10)}...` : 'NOT SET',
      redirectUri: this.redirectUri,
    });
  }

  getAuthUrl(workspaceId: string): string {
    if (!this.appId) {
      throw new Error('META_APP_ID is not configured');
    }
    if (!this.redirectUri) {
      throw new Error('META_REDIRECT_URI is not configured');
    }

    // Permissions valides pour Instagram Business via Facebook Pages
    // Instagram Business est géré via Facebook Pages, donc on utilise les permissions Pages
    // Documentation: https://developers.facebook.com/docs/instagram-api/getting-started
    const scopes = [
      'pages_show_list',              // Lister les pages Facebook connectées
      'pages_read_engagement',        // Lire les interactions (likes, commentaires)
      'pages_manage_posts',           // Gérer les posts (pour Instagram Business)
      'pages_messaging',              // Envoyer des messages (si disponible)
      'public_profile',               // Profil public de base
    ].join(',');

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: scopes,
      response_type: 'code',
      state: workspaceId, // Pour récupérer le workspace après callback
    });

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
    console.log('🔗 Generated Instagram auth URL:', {
      appId: this.appId,
      redirectUri: this.redirectUri,
      scopes,
      url: authUrl.substring(0, 100) + '...',
    });
    
    return authUrl;
  }

  async exchangeCode(code: string) {
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: this.redirectUri,
      code,
    });

    const response = await axios.get(
      `${this.apiBaseUrl}/oauth/access_token?${params.toString()}`,
    );

    return response.data;
  }

  async getUserInfo(accessToken: string) {
    const response = await axios.get(`${this.apiBaseUrl}/me`, {
      params: {
        fields: 'id,username,name',
        access_token: accessToken,
      },
    });

    return response.data;
  }

  async getMedia(accessToken: string, userId: string) {
    const response = await axios.get(
      `${this.apiBaseUrl}/${userId}/media`,
      {
        params: {
          fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
          access_token: accessToken,
        },
      },
    );

    return response.data;
  }

  async getMediaLikes(accessToken: string, mediaId: string) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/${mediaId}/likes`,
        {
          params: {
            fields: 'id,username',
            access_token: accessToken,
          },
        },
      );
      // Retourner la réponse complète avec pagination si disponible
      return response.data || { data: [], paging: null };
    } catch (error) {
      console.error('Error fetching media likes:', error);
      return { data: [], paging: null };
    }
  }

  async getMediaComments(accessToken: string, mediaId: string) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/${mediaId}/comments`,
        {
          params: {
            fields: 'id,text,username,timestamp,like_count',
            access_token: accessToken,
          },
        },
      );
      // Retourner la réponse complète avec pagination si disponible
      return response.data || { data: [], paging: null };
    } catch (error) {
      console.error('Error fetching media comments:', error);
      return { data: [], paging: null };
    }
  }

  async sendDirectMessage(
    accessToken: string,
    recipientId: string,
    message: string,
  ) {
    // Note: Instagram DM nécessite un Instagram Business Account
    // et l'utilisation de l'API Instagram Messaging
    const response = await axios.post(
      `${this.apiBaseUrl}/me/messages`,
      {
        recipient: { id: recipientId },
        message: { text: message },
      },
      {
        params: {
          access_token: accessToken,
        },
      },
    );

    return response.data;
  }
}

