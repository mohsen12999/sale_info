import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';

import { Invoice } from './schemas/invoice.schema';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitMQClient: ClientProxy,
  ) { }

  async create(createDto: any): Promise<Invoice> {
    const createdItem = new this.invoiceModel(createDto);
    return createdItem.save();
  }

  async findOne(id: string): Promise<Invoice | null> {
    return this.invoiceModel.findById(id).exec();
  }

  async findAll(filters: {
    name?: string;
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<Invoice[]> {
    const query: any = {};
    // Filter by name (case-insensitive)
    if (filters.name) {
      query.name = { $regex: filters.name, $options: 'i' };
    }

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = new Date(filters.startDate);
      if (filters.endDate) query.date.$lte = new Date(filters.endDate);
    }

    // Filter by amount range
    if (filters.minAmount || filters.maxAmount) {
      query.amount = {};
      if (filters.minAmount) query.amount.$gte = filters.minAmount;
      if (filters.maxAmount) query.amount.$lte = filters.maxAmount;
    }

    return this.invoiceModel.find(query).exec();
  }

  // async update(id: string, updateDto: any): Promise<Invoice | null> {
  //   return this.invoiceModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
  // }

  // async delete(id: string): Promise<any> {
  //   return this.invoiceModel.findByIdAndDelete(id).exec();
  // }

  // Runs every day at 12:00 PM
  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async calculateDailySales(): Promise<void> {
    this.logger.log('Running Daily Sales Calculation Job...');

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    try {
      // calculate sum of all amount
      const totalSales = await this.invoiceModel.aggregate([
        {
          $match: {
            date: { $gte: startOfDay, $lte: endOfDay },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$amount' },
          },
        },
      ]).then((result) => result[0].totalSales);


      // Aggregation Pipeline: Calculate Total Quantity per SKU
      const totalQuantity = await this.invoiceModel.aggregate([
        {
          $match: {
            date: { $gte: startOfDay, $lte: endOfDay },
          },
        },
        {
          $unwind: '$items', // Flatten items array
        },
        {
          $group: {
            _id: '$items.sku', // Group by SKU
            totalQuantity: { $sum: '$items.qt' }, // Sum quantity per SKU
          },
        },
      ]);

      this.logger.log(`Total Sales: ${totalSales}`);
      this.logger.log(`Total Quantity: ${totalQuantity.map((item) => `${item._id}: ${item.totalQuantity}`).join(', ')}`);

      const report = {
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        totalSales: totalSales,
        totalQuantity: totalQuantity.map((item) => `${item._id}: ${item.totalQuantity}`).join(', '),
      }


      this.logger.log(`Sending Sales Report to RabbitMQ: ${JSON.stringify(report)}`);

      // Send report to RabbitMQ Queue
      this.rabbitMQClient.emit('daily_sales_report', report);

    } catch (error) {
      this.logger.error('Error calculating daily sales:', error);
    }
  }
}
