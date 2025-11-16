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
  }

  getAuthUrl(workspaceId: string): string {
    const scopes = [
      'instagram_basic',
      'instagram_manage_messages',
      'pages_read_engagement',
      'pages_show_list',
    ].join(',');

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: scopes,
      response_type: 'code',
      state: workspaceId, // Pour récupérer le workspace après callback
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
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
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching media likes:', error);
      return [];
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
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching media comments:', error);
      return [];
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

