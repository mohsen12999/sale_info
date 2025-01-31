import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InvoiceModule } from './invoice/invoice.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmailSenderModule } from './email-sender/email-sender.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/sale-info-db'),
    InvoiceModule,
    ScheduleModule.forRoot(),  // Enables Cron Jobs
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost'], // RabbitMQ connection URL
          queue: 'daily_sales_report', // Queue Name
          queueOptions: {
            durable: true,
          },
        },
      },
    ]), EmailSenderModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
