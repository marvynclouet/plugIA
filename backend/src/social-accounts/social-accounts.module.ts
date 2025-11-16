import { Module } from '@nestjs/common';
import { SocialAccountsService } from './social-accounts.service';
import { SocialAccountsController } from './social-accounts.controller';
import { InstagramService } from './providers/instagram.service';

@Module({
  providers: [SocialAccountsService, InstagramService],
  controllers: [SocialAccountsController],
  exports: [SocialAccountsService, InstagramService],
})
export class SocialAccountsModule {}

