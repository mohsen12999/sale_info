import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InvoiceModule } from './invoice/invoice.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/sale-info-db'),
    InvoiceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
