import { Module } from '@nestjs/common';
import { SocialAccountsService } from './social-accounts.service';
import { SocialAccountsController } from './social-accounts.controller';
import { InstagramService } from './providers/instagram.service';
import { FacebookService } from './providers/facebook.service';

@Module({
  providers: [SocialAccountsService, InstagramService, FacebookService],
  controllers: [SocialAccountsController],
  exports: [SocialAccountsService, InstagramService, FacebookService],
})
export class SocialAccountsModule {}

