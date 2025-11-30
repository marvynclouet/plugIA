import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { SocialAccountsModule } from './social-accounts/social-accounts.module';
import { InteractionsModule } from './interactions/interactions.module';
import { TargetsModule } from './targets/targets.module';
import { DmModule } from './dm/dm.module';
import { LeadsModule } from './leads/leads.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { JobsModule } from './jobs/jobs.module';
import { VisionModule } from './vision/vision.module';

const logger = new Logger('AppModule');

// Configuration Redis optionnelle
const redisEnabled = process.env.REDIS_ENABLED !== 'false'; // Par défaut activé

// Fonction pour logger les erreurs Redis seulement une fois
const logRedisErrorOnce = (() => {
  let logged = false;
  return (message: string) => {
    if (!logged) {
      logger.warn(message);
      logged = true;
    }
  };
})();

const redisConfig = redisEnabled
  ? {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        // Options pour réduire les erreurs répétitives
        maxRetriesPerRequest: 0, // Pas de retry pour éviter les erreurs répétitives
        retryStrategy: (times: number) => {
          // Limiter les tentatives de reconnexion (max 1 tentative seulement)
          if (times > 1) {
            logRedisErrorOnce(
              '⚠️ Redis non disponible. Les queues BullMQ ne fonctionneront pas. Pour activer Redis: docker-compose up -d redis ou définir REDIS_ENABLED=false dans .env pour désactiver complètement.',
            );
            return null; // Arrêter immédiatement les tentatives
          }
          return 100; // Délai très court pour la première tentative
        },
        enableOfflineQueue: false,
        lazyConnect: true, // Ne pas se connecter immédiatement
        showFriendlyErrorStack: false,
        // Ne jamais reconnecter automatiquement
        reconnectOnError: () => false,
        // Désactiver la reconnexion automatique
        enableReadyCheck: false,
      },
    }
  : null;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    // BullMQ optionnel - seulement si Redis est activé
    // Note: Les erreurs de connexion Redis seront gérées par BullMQ lui-même
    // Pour éviter le spam, on peut définir REDIS_ENABLED=false si Redis n'est pas disponible
    ...(redisConfig ? [BullModule.forRoot(redisConfig)] : []),
    PrismaModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    SocialAccountsModule,
    InteractionsModule,
    TargetsModule,
    DmModule.forRoot(),
    LeadsModule,
    IntegrationsModule,
    JobsModule,
    VisionModule,
  ],
})
export class AppModule {
  constructor() {
    if (!redisConfig) {
      logger.warn('⚠️ Redis désactivé (REDIS_ENABLED=false). Les queues BullMQ ne seront pas disponibles.');
    }
  }
}

