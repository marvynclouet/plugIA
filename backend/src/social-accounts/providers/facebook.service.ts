import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class FacebookService {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;
  private readonly apiBaseUrl = 'https://graph.facebook.com/v18.0';

  constructor(private config: ConfigService) {
    this.appId = config.get('META_APP_ID');
    this.appSecret = config.get('META_APP_SECRET');
    // Utilise META_FACEBOOK_REDIRECT_URI si défini, sinon construit à partir de META_REDIRECT_URI
    const instagramRedirect = config.get('META_REDIRECT_URI') || '';
    this.redirectUri = config.get('META_FACEBOOK_REDIRECT_URI') || instagramRedirect.replace('/instagram/', '/facebook/');
  }

  getAuthUrl(workspaceId: string): string {
    const scopes = [
      'pages_manage_posts',
      'pages_messaging',
      'pages_read_engagement',
      'pages_show_list',
      'public_profile',
      'pages_manage_metadata',
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
        fields: 'id,name,email',
        access_token: accessToken,
      },
    });

    return response.data;
  }

  async getPages(accessToken: string) {
    const response = await axios.get(`${this.apiBaseUrl}/me/accounts`, {
      params: {
        fields: 'id,name,access_token,category',
        access_token: accessToken,
      },
    });

    return response.data.data || [];
  }

  async getPagePosts(accessToken: string, pageId: string) {
    const response = await axios.get(
      `${this.apiBaseUrl}/${pageId}/posts`,
      {
        params: {
          fields: 'id,message,created_time,likes.summary(true),comments.summary(true),shares',
          access_token: accessToken,
        },
      },
    );

    return response.data.data || [];
  }

  async getPostLikes(accessToken: string, postId: string) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/${postId}/likes`,
        {
          params: {
            fields: 'id,name',
            access_token: accessToken,
          },
        },
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching post likes:', error);
      return [];
    }
  }

  async getPostComments(accessToken: string, postId: string) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/${postId}/comments`,
        {
          params: {
            fields: 'id,message,from,created_time,like_count',
            access_token: accessToken,
          },
        },
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching post comments:', error);
      return [];
    }
  }

  async sendDirectMessage(
    accessToken: string,
    recipientId: string,
    message: string,
    pageId: string,
  ) {
    // Facebook Messenger API nécessite un Page Access Token
    const response = await axios.post(
      `${this.apiBaseUrl}/${pageId}/messages`,
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

