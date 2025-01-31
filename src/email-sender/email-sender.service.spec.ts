import { Test, TestingModule } from '@nestjs/testing';
import { EmailSenderService } from './email-sender.service';
import * as amqp from 'amqplib';
import * as sgMail from '@sendgrid/mail';

jest.mock('amqplib'); // Mock RabbitMQ
jest.mock('@sendgrid/mail'); // Mock SendGrid

describe('EmailSenderService', () => {
  let service: EmailSenderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailSenderService],
    }).compile();

    service = module.get<EmailSenderService>(EmailSenderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('consumeSalesReport', () => {
    it('should consume messages from RabbitMQ queue', async () => {
      const mockChannel = {
        assertQueue: jest.fn(),
        consume: jest.fn((queue, callback) => {
          // Simulate a received message
          const msg = { content: Buffer.from(JSON.stringify({ date: '2025-01-31', salesReport: [] })) };
          callback(msg); // Trigger message processing
        }),
        ack: jest.fn(),
      };

      const mockConnection = {
        createChannel: jest.fn().mockResolvedValue(mockChannel),
      };

      (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);

      await service.consumeSalesReport();

      expect(mockChannel.assertQueue).toHaveBeenCalledWith('daily_sales_report', { durable: true });
      expect(mockChannel.consume).toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalled();
    });
  });

  describe('sendSalesReportEmail', () => {
    it('should send an email with the sales report', async () => {
      const mockSend = jest.spyOn(sgMail, 'send').mockResolvedValue([
        {
          statusCode: 202,
          body: {},
          headers: {}
        },
        {}
      ]);

      const report = {
        date: '2025-01-31',
        salesReport: [
          { _id: 'SKU123', totalQuantity: 10, totalSales: 500 },
          { _id: 'SKU456', totalQuantity: 5, totalSales: 250 },
        ],
      };

      await service.sendSalesReportEmail(report);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.any(String),
          subject: expect.stringContaining('Daily Sales Report'),
          text: expect.stringContaining('SKU123'),
        })
      );
    });

    it('should log an error if SendGrid fails', async () => {
      const mockSend = jest.spyOn(sgMail, 'send').mockRejectedValue(new Error('SendGrid Error'));

      const report = { date: '2025-01-31', salesReport: [] };

      await expect(service.sendSalesReportEmail(report)).rejects.toThrow('SendGrid Error');

      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('formatSalesReport', () => {
    it('should format the sales report correctly', () => {
      const report = {
        date: '2025-01-31',
        salesReport: [
          { _id: 'SKU123', totalQuantity: 10, totalSales: 500 },
        ],
      };

      const formattedText = service.formatSalesReport(report);
      expect(formattedText).toContain('Daily Sales Report - 2025-01-31');
      expect(formattedText).toContain('SKU: SKU123');
      expect(formattedText).toContain('Total Quantity Sold: 10');
      expect(formattedText).toContain('Total Sales: $500');
    });
  });
});
