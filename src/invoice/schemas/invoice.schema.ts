import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Invoice extends Document {
  // The name or identifier of the customer
  @Prop({type: String})
  customer: string;

  // The total amount of the invoice
  @Prop({type: Number})
  amount: number;

  // A reference code for the invoice
  @Prop({type: String})
  reference: string;

  // The date the invoice was created.
  @Prop({ type: Date })
  date: Date;

  // sku (string): Stock Keeping Unit, unique identifier for the item.
  // qt (number): Quantity of the item.
  @Prop({ type: [{ sku: String, qt: Number }] })
  items: { sku: String; qt: Number }[];
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
