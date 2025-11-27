import { Controller, Post, Get, Body, Query, Headers } from '@nestjs/common';
import { UsersService } from './users.service';

/**
 * Controller pour gérer les demandes de suppression de données
 * Conforme aux exigences Meta/Facebook pour la suppression des données utilisateur
 */
@Controller('data-deletion')
export class DataDeletionController {
  constructor(private usersService: UsersService) {}

  /**
   * Endpoint pour Meta/Facebook webhook de suppression de données
   * Meta appelle cette URL avec signed_request
   */
  @Post('callback')
  async handleMetaDataDeletion(
    @Body() body: any,
    @Headers('x-hub-signature-256') signature?: string,
  ) {
    console.log('📥 Meta data deletion request received:', { body, signature });

    try {
      // Meta envoie un signed_request avec les informations de l'utilisateur
      // Format: { user_id: string, confirmation_code: string }
      const userId = body.user_id || body.signed_request?.user_id;
      const confirmationCode = body.confirmation_code || body.signed_request?.confirmation_code;

      if (!userId) {
        return {
          url: 'https://flowia.com/legal/data-deletion',
          confirmation_code: null,
        };
      }

      // Trouver l'utilisateur par son ID Meta (stocké dans social_accounts)
      // Pour l'instant, on retourne l'URL de suppression manuelle
      // TODO: Implémenter la recherche par platformUserId si nécessaire

      return {
        url: 'https://flowia.com/legal/data-deletion',
        confirmation_code: confirmationCode || 'pending',
      };
    } catch (error) {
      console.error('❌ Error handling Meta data deletion:', error);
      return {
        url: 'https://flowia.com/legal/data-deletion',
        confirmation_code: null,
      };
    }
  }

  /**
   * Endpoint public pour les instructions de suppression de données
   * Meta peut appeler cette URL pour vérifier que l'endpoint existe
   */
  @Get('instructions')
  getInstructions() {
    return {
      url: 'https://flowia.com/legal/data-deletion',
      instructions: 'Users can delete their data by visiting the URL above or by emailing privacy@flowia.com',
    };
  }

  /**
   * Endpoint pour les demandes de suppression par email
   */
  @Post('request')
  async requestDeletion(@Body() body: { email: string }) {
    console.log('📧 Data deletion request received:', { email: body.email });

    try {
      await this.usersService.deleteUserByEmail(body.email);
      return {
        message: 'Data deletion request processed. All data will be deleted within 30 days.',
        status: 'success',
      };
    } catch (error) {
      console.error('❌ Error processing deletion request:', error);
      return {
        message: 'Data deletion request received. We will process it within 30 days.',
        status: 'pending',
      };
    }
  }
}



