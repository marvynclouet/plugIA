import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DmService } from './dm.service';
import { DmController } from './dm.controller';
import { DmProcessor } from './dm.processor';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'dm',
    }),
    SocialAccountsModule,
  ],
  providers: [DmService, DmProcessor],
  controllers: [DmController],
  exports: [DmService],
})
export class DmModule {}

