import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from './point.controller';
import { PointService } from './point.service';
import { ValidationPipe } from '@nestjs/common';
import { Mutex } from 'async-mutex';

describe('PointController', () => {
  let controller: PointController;
  let service: PointService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointController],
      providers: [
        {
          provide: PointService,
          useValue: {
            charge: jest.fn().mockImplementation(async (userId: number, amount: number) => {
              return { userId, amount };
            }),
            use: jest.fn().mockImplementation(async (userId: number, amount: number) => {
              if (amount > 100) throw new Error('잔액 부족');
              return { userId, amount };
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<PointController>(PointController);
    service = module.get<PointService>(PointService);

    // Initialize Mutex management in the controller
    controller['getOrCreateMutex'] = (userId: number) => {
      if (!controller['mutexMap']) {
        controller['mutexMap'] = new Map<number, Mutex>();
      }
      if (!controller['mutexMap'].has(userId)) {
        controller['mutexMap'].set(userId, new Mutex());
      }
      return controller['mutexMap'].get(userId);
    };
  });

  it('같은 userId는 동시에 charge와 use가 안된다(동시성 제어)', async () => {
    const userId = 1;

    const chargePromise = controller.charge(
      userId.toString(),
      { amount: 100 } as any,
    );
    const usePromise = controller.use(
      userId.toString(),
      { amount: 50 } as any,
    );

    const results = await Promise.all([chargePromise, usePromise]);

    expect(results[0]).toEqual({ userId: 1, amount: 100 });
    expect(results[1]).toEqual({ userId: 1, amount: 50 });

    const chargeCallOrder = (service.charge as jest.Mock).mock.invocationCallOrder[0];
    const useCallOrder = (service.use as jest.Mock).mock.invocationCallOrder[0];
    expect(chargeCallOrder).toBeLessThan(useCallOrder);
  });

  it('부족한 잔액은 올바르게 처리가 되어야 한다.', async () => {
    const userId = 1;

    const chargePromise = controller.charge(
      userId.toString(),
      { amount: 100 } as any,
    );
    const usePromise = controller.use(
      userId.toString(),
      { amount: 150 } as any,
    );

    await chargePromise;
    await expect(usePromise).rejects.toThrow('잔액 부족');

    expect(service.use).toHaveBeenCalledWith(userId, 150);
  });
});
