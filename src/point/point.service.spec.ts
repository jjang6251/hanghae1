import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from './point.service';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';
import { TransactionType } from './point.model';
import { HttpException, HttpStatus } from '@nestjs/common';

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

    it('유저 포인트를 반환해야 함.', async () => {
      // userId에 따라 다른 값을 반환하도록 설정
      jest.spyOn(userPointTable, 'selectById').mockImplementation(async (userId: number) => {
        if (userId === 1) {
          return { id: 1, point: 100, updateMillis: mockUpdateMills };
        } else if (userId === 2) {
          return { id: 2, point: 200, updateMillis: mockUpdateMills };
        }
        return { id: userId, point: 0, updateMillis: mockUpdateMills };
      });

      const result = await pointService.getPoint(2);
      expect(result).toEqual({ id: 2, point: 200, updateMillis: mockUpdateMills });
    });

    it('유저 포인트가 없을 경우 기본값을 반환해야 함.', async () => {
      jest.spyOn(userPointTable, 'selectById').mockImplementation(async (userId: number) => {
        return { id: userId, point: 0, updateMillis: mockUpdateMills };
      });

      const result = await pointService.getPoint(3);
      expect(result).toEqual({ id: 3, point: 0, updateMillis: mockUpdateMills });
    });
  });

  describe('history 조회', () => {
    const mockUpdateMills = Date.now();

    const pointHistory = [
      { id: 3, userId: 2, amount: 100, type: TransactionType.CHARGE, timeMillis: mockUpdateMills },
      { id: 4, userId: 2, amount: 50, type: TransactionType.USE, timeMillis: mockUpdateMills }
    ]
    it('유저 history를 반환해야함.', async () => {
      jest.spyOn(pointHistoryTable, 'selectAllByUserId').mockImplementation(async (userId: number) => {
        if (userId == 1) {
          return [
            { id: 1, userId: 1, amount: 150, type: TransactionType.CHARGE, timeMillis: mockUpdateMills },
            { id: 2, userId: 1, amount: 50, type: TransactionType.USE, timeMillis: mockUpdateMills }
          ]
        } else if (userId == 2) {
          return [
            { id: 3, userId: 2, amount: 100, type: TransactionType.CHARGE, timeMillis: mockUpdateMills },
            { id: 4, userId: 2, amount: 50, type: TransactionType.USE, timeMillis: mockUpdateMills }
          ]
        }
        return [];
      });
      const result = await pointService.history(2);
      expect(result).toEqual(pointHistory);
    });

    it('유저 history가 없을 경우 빈 배열을 반환해야함.', async () => {
      jest.spyOn(pointHistoryTable, 'selectAllByUserId').mockImplementation(async (userId: number) => {
        return [];
      });

      const result = await pointService.history(2);
      expect(result).toEqual([]);
    })
  });

  describe('charge', () => {

    const mockUpdateMills = Date.now();
    
    it('잘못된 금액 입력', async () => {

      jest.spyOn(userPointTable, 'selectById').mockResolvedValue({ id: 1, point: 100, updateMillis: mockUpdateMills });
      jest.spyOn(userPointTable, 'insertOrUpdate').mockResolvedValue({ id: 1, point: 150, updateMillis: mockUpdateMills });
      jest.spyOn(pointHistoryTable, 'insert').mockResolvedValue({ id: 1, userId: 1, amount: 50, type: TransactionType.CHARGE, timeMillis: mockUpdateMills });

      const result = await pointService.charge(1, 50);
      expect(result).toEqual({ id: 1, point: 150, updateMillis: expect.any(Number) });
    });

    it('정상적으로 포인트 충전', async () => {
      jest.spyOn(userPointTable, 'selectById').mockResolvedValue({ id: 1, point: 100, updateMillis: mockUpdateMills });
      jest.spyOn(userPointTable, 'insertOrUpdate').mockResolvedValue({ id: 1, point: 150, updateMillis: mockUpdateMills });
      jest.spyOn(pointHistoryTable, 'insert').mockResolvedValue({ id: 1, userId: 1, amount: 50, type: TransactionType.CHARGE, timeMillis: mockUpdateMills });

      const result = await pointService.charge(1, 50);

      expect(result).toEqual({ id: 1, point: 150, updateMillis: expect.any(Number) });
      expect(userPointTable.selectById).toHaveBeenCalledWith(1);
      expect(userPointTable.insertOrUpdate).toHaveBeenCalledWith(1, 150);
      expect(pointHistoryTable.insert).toHaveBeenCalledWith(1, 50, TransactionType.CHARGE, expect.any(Number));
    });

    it('포인트 히스토리 저장 실패', async () => {
      jest.spyOn(userPointTable, 'selectById').mockResolvedValue({ id: 1, point: 100, updateMillis: mockUpdateMills });
      jest.spyOn(userPointTable, 'insertOrUpdate').mockResolvedValue({ id: 1, point: 150, updateMillis: mockUpdateMills });
      jest.spyOn(pointHistoryTable, 'insert').mockRejectedValue(new Error('History insert error'));

      await expect(pointService.charge(1, 50)).rejects.toThrow('History insert error');
      expect(userPointTable.selectById).toHaveBeenCalledWith(1);
      expect(userPointTable.insertOrUpdate).toHaveBeenCalledWith(1, 150);
      expect(pointHistoryTable.insert).toHaveBeenCalledWith(1, 50, TransactionType.CHARGE, expect.any(Number));
    });
  });

  describe('use', () => {
    const mockUpdateMills = Date.now();

    it('정상적으로 포인트 사용', async () => {
      jest.spyOn(userPointTable, 'selectById').mockResolvedValue({ id: 1, point: 200, updateMillis: mockUpdateMills });
      jest.spyOn(userPointTable, 'insertOrUpdate').mockResolvedValue({ id: 1, point: 150, updateMillis: mockUpdateMills });
      jest.spyOn(pointHistoryTable, 'insert').mockResolvedValue({ id: 1, userId: 1, amount: 50, type: TransactionType.USE, timeMillis: mockUpdateMills });

      const result = await pointService.use(1, 50);

      expect(result).toEqual({ id: 1, point: 150, updateMillis: expect.any(Number) });
      expect(userPointTable.selectById).toHaveBeenCalledWith(1);
      expect(userPointTable.insertOrUpdate).toHaveBeenCalledWith(1, 150);
      expect(pointHistoryTable.insert).toHaveBeenCalledWith(1, 50, TransactionType.USE, expect.any(Number));
    });

    it('잔액 부족으로 에러 발생', async () => {
      jest.spyOn(userPointTable, 'selectById').mockResolvedValue({ id: 1, point: 30, updateMillis: mockUpdateMills });

      await expect(pointService.use(1, 50)).rejects.toThrow('잔액 부족');
      expect(userPointTable.selectById).toHaveBeenCalledWith(1);
      expect(userPointTable.insertOrUpdate).not.toHaveBeenCalled();
      expect(pointHistoryTable.insert).not.toHaveBeenCalled();
    });

    it('잘못된 포인트 값으로 에러 발생', async () => {
      await expect(pointService.use(1, -50)).rejects.toThrow(HttpException);
      await expect(pointService.use(1, -50)).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        message: 'message',
      });

      expect(userPointTable.selectById).not.toHaveBeenCalled();
      expect(userPointTable.insertOrUpdate).not.toHaveBeenCalled();
      expect(pointHistoryTable.insert).not.toHaveBeenCalled();
    });

    it('예상치 못한 에러 처리', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(userPointTable, 'selectById').mockRejectedValue(new Error('Unexpected error'));

      await expect(pointService.use(1, 50)).rejects.toThrow('Unexpected error');

      expect(consoleSpy).toHaveBeenCalledWith(new Error('Unexpected error'));
      consoleSpy.mockRestore();
    });
  });
});
