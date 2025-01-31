import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InvoiceModule } from './invoice/invoice.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/sale-info-db'),
    InvoiceModule,
    ScheduleModule.forRoot(),  // Enables Cron Jobs
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
