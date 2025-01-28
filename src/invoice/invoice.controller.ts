import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InvoiceService } from './invoice.service';

@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  // Create a new invoice.
  @Post()
  create(@Body() createDto: any) {
    return this.invoiceService.create(createDto);
  }

  // Retrieve a specific invoice by ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(id);
  }

  // Retrieve a list of all invoices (with optional filters like date range).
  @Get()
  findAll() {
    return this.invoiceService.findAll();
  }
}
