import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DataDeletionController } from './data-deletion.controller';

@Module({
  controllers: [UsersController, DataDeletionController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

