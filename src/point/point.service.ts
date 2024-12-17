import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PointHistoryTable } from 'src/database/pointhistory.table';
import { UserPointTable } from 'src/database/userpoint.table';
import { TransactionType, UserPoint } from './point.model';

@Injectable()
export class PointService {
    constructor(
        private readonly userDb: UserPointTable,
        private readonly historyDb: PointHistoryTable,
    ) { }

    async getPoint(userId: number): Promise<UserPoint> {

        try {
            const result = this.userDb.selectById(userId);
            return result;
        } catch (error) {
            console.log(error);
        }
    }

    async charge(userId: number, point: number): Promise<UserPoint> {
        if (point <= 0) {
            throw new HttpException('message', HttpStatus.BAD_REQUEST)
        } else {
            try {
                const dbResult = await this.userDb.insertOrUpdate(userId, point);
                const historyResult = await this.historyDb.insert(userId, point, TransactionType.CHARGE, dbResult.updateMillis);
                return dbResult;
            } catch (error) {
                console.error(error);
            }
        }
    }


}
