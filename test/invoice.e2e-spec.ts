import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { Connection, Model } from 'mongoose';
import { getModelToken,MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Invoice } from 'src/invoice/schemas/invoice.schema';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let mongoServer: MongoMemoryServer;
  let dbConnection: Connection;
  let invoiceModel: Model<Invoice>;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri), // Connect to in-memory MongoDB
        AppModule, // Import the main application module
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dbConnection = moduleFixture.get<Connection>(Connection);
    invoiceModel = moduleFixture.get<Model<Invoice>>(getModelToken(Invoice.name));
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Clean up the database after each test
    await invoiceModel.deleteMany({});
  });

  describe('POST /invoices', () => {
    it('should create a new item', async () => {
      const newItem = { name: 'Test Item', date: new Date(), amount: 100 };

      const response = await request(app.getHttpServer())
        .post('/invoices')
        .send(newItem)
        .expect(201);

      expect(response.body).toMatchObject({
        _id: expect.any(String),
        name: 'Test Item',
        date: expect.any(String),
        amount: 100,
      });

      // Verify the database entry
      const dbItem = await invoiceModel.findOne({ name: 'Test Item' });
      expect(dbItem).toBeTruthy();
      expect(dbItem?.amount).toBe(100);
    });

    it('should return 400 for invalid data', async () => {
      const invalidItem = { name: '' }; // Missing required fields

      await request(app.getHttpServer())
        .post('/invoices')
        .send(invalidItem)
        .expect(400);
    });
  });

  describe('GET /invoices', () => {
    it('should retrieve all items', async () => {
      // Insert mock data into the database
      await invoiceModel.create([
        { name: 'Item1', date: new Date('2025-01-01'), amount: 100 },
        { name: 'Item2', date: new Date('2025-01-02'), amount: 200 },
      ]);

      const response = await request(app.getHttpServer())
        .get('/invoices')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({ name: 'Item1', amount: 100 });
      expect(response.body[1]).toMatchObject({ name: 'Item2', amount: 200 });
    });

    it('should filter items by name', async () => {
      await invoiceModel.create([
        { name: 'Item1', date: new Date('2025-01-01'), amount: 100 },
        { name: 'Item2', date: new Date('2025-01-02'), amount: 200 },
      ]);

      const response = await request(app.getHttpServer())
        .get('/invoices')
        .query({ name: 'Item1' })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({ name: 'Item1', amount: 100 });
    });

    it('should filter items by date range', async () => {
      await invoiceModel.create([
        { name: 'Item1', date: new Date('2025-01-01'), amount: 100 },
        { name: 'Item2', date: new Date('2025-01-02'), amount: 200 },
      ]);

      const response = await request(app.getHttpServer())
        .get('/invoices')
        .query({ startDate: '2025-01-01', endDate: '2025-01-01' })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({ name: 'Item1', amount: 100 });
    });

    it('should filter items by amount range', async () => {
      await invoiceModel.create([
        { name: 'Item1', date: new Date('2025-01-01'), amount: 100 },
        { name: 'Item2', date: new Date('2025-01-02'), amount: 200 },
      ]);

      const response = await request(app.getHttpServer())
        .get('/invoices')
        .query({ minAmount: 150, maxAmount: 250 })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({ name: 'Item2', amount: 200 });
    });
  });
});