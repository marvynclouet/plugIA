import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsService } from './jobs.service';
import { InteractionsModule } from '../interactions/interactions.module';
import { TargetsModule } from '../targets/targets.module';
import { LeadsModule } from '../leads/leads.module';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';

@Module({
  imports: [
    ScheduleModule,
    InteractionsModule,
    TargetsModule,
    LeadsModule,
    SocialAccountsModule,
  ],
  providers: [JobsService],
})
export class JobsModule {}

