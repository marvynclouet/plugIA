import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    SocialAccountsModule,
    InteractionsModule,
    TargetsModule,
    DmModule,
    LeadsModule,
    IntegrationsModule,
    JobsModule,
  ],
})
export class AppModule {}

