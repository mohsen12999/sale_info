import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice } from './schemas/invoice.schema';

@Injectable()
export class InvoiceService {
    constructor(@InjectModel(Invoice.name) private invoiceModel: Model<Invoice>) {}

  async create(createDto: any): Promise<Invoice> {
    const createdItem = new this.invoiceModel(createDto);
    return createdItem.save();
  }

  async findAll(): Promise<Invoice[]> {
    return this.invoiceModel.find().exec();
  }


  async findOne(id: string): Promise<Invoice | null> {
    return this.invoiceModel.findById(id).exec();
  }

  // async update(id: string, updateDto: any): Promise<Invoice | null> {
  //   return this.invoiceModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
  // }

  // async delete(id: string): Promise<any> {
  //   return this.invoiceModel.findByIdAndDelete(id).exec();
  // }
}
