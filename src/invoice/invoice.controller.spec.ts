import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';

const mockInvoiceService = {
  create: jest.fn(),
  findAll: jest.fn(),
};

describe('InvoiceController', () => {
  let controller: InvoiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceController],
      providers: [
        {
          provide: InvoiceService,
          useValue: mockInvoiceService,
        },
      ],
    }).compile();

    controller = module.get<InvoiceController>(InvoiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create and return the result', async () => {
      const newItem = { name: 'NewItem', createdAt: new Date(), price: 300 };
      mockInvoiceService.create.mockResolvedValue(newItem);

      const result = await controller.create(newItem);
      expect(result).toEqual(newItem);
      expect(mockInvoiceService.create).toHaveBeenCalledWith(newItem);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll and return the result', async () => {
      const mockFilters = { name: 'test' };
      const mockResult = [{ name: 'test' }];
      mockInvoiceService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll('test', undefined, undefined, undefined, undefined);
      expect(result).toEqual(mockResult);
      expect(mockInvoiceService.findAll).toHaveBeenCalledWith({
        name: 'test',
        startDate: undefined,
        endDate: undefined,
        minAmount: undefined,
        maxAmount: undefined,
      });
    });
  });
});
