import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { InvoiceService } from './invoice.service';
import { Invoice } from './schemas/invoice.schema';

// Mock data
const mockInvoiceData = [
  {
    _id: '1',
    customer: 'Item1',
    amount: 100,
    reference: '12',
    date: new Date('2025-01-01'),
    items: [{ sku: 'test01', qt: 50 }],
  },
  {
    _id: '2',
    customer: 'Item2',
    amount: 10,
    reference: '123',
    date: new Date('2025-01-02'),
    items: [
      { sku: 'test02', qt: 1 },
      { sku: 'test03', qt: 3 },
    ],
  },
];

// Mock Mongoose Model
const mockInvoiceModel = {
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
};

describe('InvoiceService', () => {
  let service: InvoiceService;
  let model: Model<Invoice>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: getModelToken(Invoice.name),
          useValue: mockInvoiceModel,
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    model = module.get<Model<Invoice>>(getModelToken(Invoice.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new item', async () => {
      const newItem = {
        customer: 'Item1',
        amount: 10,
        reference: '12',
        date: new Date('2025-01-01'),
        items: [{ sku: 'test01', qt: 50 }],
      };
      mockInvoiceModel.create.mockResolvedValue(newItem);

      const result = await service.create(newItem);
      expect(result).toEqual(newItem);
      expect(mockInvoiceModel.create).toHaveBeenCalledWith(newItem);
    });
  });

  describe('findAll', () => {
    it('should retrieve all items', async () => {
      mockInvoiceModel.find.mockResolvedValue(mockInvoiceData);

      const result = await service.findAll({});
      expect(result).toEqual(mockInvoiceData);
      expect(mockInvoiceModel.find).toHaveBeenCalledWith({});
    });

    it('should filter items by name', async () => {
      const filters = { name: 'Item1' };
      mockInvoiceModel.find.mockResolvedValue([mockInvoiceData[0]]);

      const result = await service.findAll(filters);
      expect(result).toEqual([mockInvoiceData[0]]);
      expect(mockInvoiceModel.find).toHaveBeenCalledWith({
        name: { $regex: filters.name, $options: 'i' },
      });
    });

    it('should filter items by date range', async () => {
      const filters = { startDate: new Date('2025-01-01'), endDate: new Date('2025-01-02') };
      mockInvoiceModel.find.mockResolvedValue(mockInvoiceData);

      const result = await service.findAll(filters);
      expect(result).toEqual(mockInvoiceData);
      expect(mockInvoiceModel.find).toHaveBeenCalledWith({
        createdAt: { $gte: filters.startDate, $lte: filters.endDate },
      });
    });

    it('should filter items by price range', async () => {
      const filters = { minAmount: 50, maxAmount: 200 };
      mockInvoiceModel.find.mockResolvedValue(mockInvoiceData);

      const result = await service.findAll(filters);
      expect(result).toEqual(mockInvoiceData);
      expect(mockInvoiceModel.find).toHaveBeenCalledWith({
        amount: { $gte: filters.minAmount, $lte: filters.maxAmount },
      });
    });
  });
});
