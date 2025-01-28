import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice } from './schemas/invoice.schema';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
  ) {}

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
}
