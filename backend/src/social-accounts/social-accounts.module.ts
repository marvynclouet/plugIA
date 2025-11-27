import { Module, forwardRef } from '@nestjs/common';
import { SocialAccountsService } from './social-accounts.service';
import { SocialAccountsController } from './social-accounts.controller';
import { InstagramService } from './providers/instagram.service';
import { FacebookService } from './providers/facebook.service';
import { TikTokService } from './providers/tiktok.service';
import { TikTokBrowserService } from './providers/tiktok-browser.service';
import { TikTokCookiesService } from './providers/tiktok-cookies.service';
import { TikTokMonitorService } from './providers/tiktok-monitor.service';
import { TikTokAIAgentService } from './providers/tiktok-ai-agent.service';
import { TikTokQRConnectionService } from './providers/tiktok-qr-connection.service';
import { TikTokSessionManagerService } from './providers/tiktok-session-manager.service';
import { TikTokInboxService } from './providers/tiktok-inbox.service';
import { TikTokInboxSyncService } from './providers/tiktok-inbox-sync.service';
import { TikTokReconnectionService } from './providers/tiktok-reconnection.service';
import { TikTokRateLimiterService } from './providers/tiktok-rate-limiter.service';
import { SocialConnectionService } from './providers/social-connection.service';
import { InteractionsModule } from '../interactions/interactions.module';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [
    forwardRef(() => InteractionsModule),
    LeadsModule, // Pour accéder à LeadAnalysisService
  ],
  providers: [
    SocialAccountsService,
    InstagramService,
    FacebookService,
    TikTokService,
    TikTokBrowserService,
    TikTokCookiesService,
    TikTokMonitorService,
    TikTokAIAgentService,
    TikTokQRConnectionService,
    TikTokSessionManagerService,
    TikTokInboxService,
    TikTokInboxSyncService,
    TikTokReconnectionService,
    TikTokRateLimiterService,
    SocialConnectionService,
  ],
  controllers: [SocialAccountsController],
  exports: [
    SocialAccountsService,
    InstagramService,
    FacebookService,
    TikTokService,
    TikTokBrowserService,
    TikTokCookiesService,
    TikTokMonitorService,
    TikTokAIAgentService,
    TikTokQRConnectionService,
    TikTokSessionManagerService,
    TikTokInboxService,
    TikTokInboxSyncService,
    TikTokReconnectionService,
    TikTokRateLimiterService,
    SocialConnectionService,
  ],
})
export class SocialAccountsModule {}

