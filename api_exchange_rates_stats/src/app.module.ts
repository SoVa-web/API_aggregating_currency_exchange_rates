import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppGettingStats } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule.register({}), ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppGettingStats],
})
export class AppModule {}
