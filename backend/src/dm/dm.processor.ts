import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DmService } from './dm.service';

@Processor('dm')
export class DmProcessor extends WorkerHost {
  constructor(private dmService: DmService) {
    super();
  }

  async process(job: Job<any, any, string>) {
    const { sequenceId, message } = job.data;
    return this.dmService.executeDm(sequenceId, message);
  }
}

