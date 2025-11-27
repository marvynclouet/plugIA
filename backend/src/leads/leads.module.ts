import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { LeadAnalysisService } from './lead-analysis.service';
import { LeadExtractionService } from './lead-extraction.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [IntegrationsModule],
  providers: [LeadsService, LeadAnalysisService, LeadExtractionService],
  controllers: [LeadsController],
  exports: [LeadsService, LeadAnalysisService, LeadExtractionService],
})
export class LeadsModule {}


