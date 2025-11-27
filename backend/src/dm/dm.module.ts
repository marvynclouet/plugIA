import { Module, DynamicModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DmService } from './dm.service';
import { DmController } from './dm.controller';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';

// Redis optionnel - seulement si activé
const redisEnabled = process.env.REDIS_ENABLED !== 'false';

@Module({})
export class DmModule {
  static forRoot(): DynamicModule {
    const providers: any[] = [DmService];
    const imports: any[] = [SocialAccountsModule];

    // Inclure le Processor et la queue seulement si Redis est activé
    if (redisEnabled) {
      // Import dynamique pour éviter que le decorator @Processor soit exécuté
      const { DmProcessor } = require('./dm.processor');
      providers.push(DmProcessor);
      imports.push(
        BullModule.registerQueue({
          name: 'dm',
        }) as any,
      );
    }

    return {
      module: DmModule,
      imports,
      providers,
      controllers: [DmController],
      exports: [DmService],
    };
  }
}

