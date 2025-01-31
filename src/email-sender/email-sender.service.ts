import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailSenderService implements OnModuleInit {
  private readonly logger = new Logger(EmailSenderService.name);
  private readonly queue = 'daily_sales_report';
  private readonly sendGridApiKey = 'YOUR_SENDGRID_API_KEY';

  constructor() {
    sgMail.setApiKey(this.sendGridApiKey);
  }

  async onModuleInit() {
    this.consumeSalesReport();
  }

  async consumeSalesReport() {
    try {
      const connection = await amqp.connect('amqp://localhost');
      const channel = await connection.createChannel();

      await channel.assertQueue(this.queue, { durable: true });
      this.logger.log(`Listening to RabbitMQ queue: ${this.queue}`);

      channel.consume(this.queue, async (msg) => {
        if (msg !== null) {
          const report = JSON.parse(msg.content.toString());
          await this.sendSalesReportEmail(report);
          channel.ack(msg);
        }
      });
    } catch (error) {
      this.logger.error('Error connecting to RabbitMQ:', error);
    }
  }

  async sendSalesReportEmail(report: any) {
    const emailContent = this.formatSalesReport(report);

    const msg = {
      to: 'admin@example.com', // Change to the recipient's email
      from: 'sales@example.com',
      subject: `Daily Sales Report - ${report.date}`,
      text: emailContent,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Sales report email sent for ${report.date}`);
    } catch (error) {
      this.logger.error('Failed to send email:', error);
    }
  }

  formatSalesReport(report: any): string {
    let reportText = `Daily Sales Report - ${report.date}\n\n`;

    report.salesReport.forEach((item) => {
      reportText += `SKU: ${item._id}\nTotal Quantity Sold: ${item.totalQuantity}\nTotal Sales: $${item.totalSales}\n\n`;
    });

    return reportText;
  }
}
