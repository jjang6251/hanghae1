import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from './point.service';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';

describe('PointService', () => {
  let pointService: PointService;
  let userPointTable: UserPointTable;
  let pointHistoryTable: PointHistoryTable;

  beforeEach(async () => {
    const userPointTableMock = {
      selectById: jest.fn(),
      insertOrUpdate: jest.fn(),
    };

    const pointHistoryTableMock = {
      selectAllByUserId: jest.fn(),
      insert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        { provide: UserPointTable, useValue: userPointTableMock },
        { provide: PointHistoryTable, useValue: pointHistoryTableMock },
      ],
    }).compile();

    pointService = module.get<PointService>(PointService);
    userPointTable = module.get<UserPointTable>(UserPointTable);
    pointHistoryTable = module.get<PointHistoryTable>(PointHistoryTable);
  });

  describe('포인트 조회', () => {
    const mockUpdateMills = Date.now();
    it('유저 포인트를 반환해야함.', async () => {
      jest.spyOn(userPointTable, 'selectById').mockResolvedValue({ id: 1, point: 0, updateMillis: mockUpdateMills });
      const result = await pointService.getPoint(1);
      expect(result).toEqual({ id: 1, point: 0, updateMillis: mockUpdateMills });
    });
  });

  // describe('history', () => {
  //   it('should return user point history', async () => {
  //     jest.spyOn(pointHistoryTable, 'selectAllByUserId').mockResolvedValue([{ id: 1, point: 100, transactionType: 'CHARGE' }]);
  //     const result = await pointService.history(1);
  //     expect(result).toEqual([{ id: 1, point: 100, transactionType: 'CHARGE' }]);
  //   });
  // });

  // describe('charge', () => {
  //   it('should charge points correctly', async () => {
  //     jest.spyOn(userPointTable, 'selectById').mockResolvedValue({ id: 1, point: 100 });
  //     jest.spyOn(userPointTable, 'insertOrUpdate').mockResolvedValue({ id: 1, point: 150, updateMillis: Date.now() });
  //     jest.spyOn(pointHistoryTable, 'insert').mockResolvedValue({ id: 1, point: 50, transactionType: 'CHARGE', updateMillis: Date.now() });

  //     const result = await pointService.charge(1, 50);
  //     expect(result).toEqual({ id: 1, point: 150, updateMillis: expect.any(Number) });
  //   });

  //   it('should throw an error if points are negative', async () => {
  //     await expect(pointService.charge(1, -50)).rejects.toThrow('잘못된 금액 입력');
  //   });
  // });

  // describe('use', () => {
  //   it('should use points correctly', async () => {
  //     jest.spyOn(userPointTable, 'selectById').mockResolvedValue({ id: 1, point: 100 });
  //     jest.spyOn(userPointTable, 'insertOrUpdate').mockResolvedValue({ id: 1, point: 50, updateMillis: Date.now() });
  //     jest.spyOn(pointHistoryTable, 'insert').mockResolvedValue({ id: 1, point: 50, transactionType: 'USE', updateMillis: Date.now() });

  //     const result = await pointService.use(1, 50);
  //     expect(result).toEqual({ id: 1, point: 50, updateMillis: expect.any(Number) });
  //   });

  //   it('should throw an error if points are insufficient', async () => {
  //     await expect(pointService.use(1, 150)).rejects.toThrow('잔액 부족');
  //   });
  // });
});
