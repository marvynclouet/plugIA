import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsService } from './jobs.service';
import { InteractionsModule } from '../interactions/interactions.module';
import { TargetsModule } from '../targets/targets.module';

@Module({
  imports: [ScheduleModule, InteractionsModule, TargetsModule],
  providers: [JobsService],
})
export class JobsModule {}

