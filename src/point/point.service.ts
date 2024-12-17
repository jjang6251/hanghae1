import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PointHistoryTable } from 'src/database/pointhistory.table';
import { UserPointTable } from 'src/database/userpoint.table';
import { PointHistory, TransactionType, UserPoint } from './point.model';

@Injectable()
export class PointService {
    constructor(
        private readonly userDb: UserPointTable,
        private readonly historyDb: PointHistoryTable,
    ) { }

    //특정 유저아이디로 Point 조회
    async getPoint(userId: number): Promise<UserPoint> {

        try {
            const result = this.userDb.selectById(userId);
            return result;
        } catch (error) {
            console.log(error);
        }
    }

    //특정 유저의 포인트 충전/이용 내역을 조회하는 기능
    async history(userId: number): Promise<PointHistory[]> {
        try {
            const historyResult = this.historyDb.selectAllByUserId(userId);
            return historyResult;
        } catch (error) {
            throw new Error;
        }
    }

    async charge(userId: number, point: number): Promise<UserPoint> {
        if (point <= 0) {
            throw new HttpException('잘못된 금액 입력', HttpStatus.BAD_REQUEST)
        } else {
            try {
                const userPoint = (await this.userDb.selectById(userId)).point;
                const updatePoint = await (userPoint + point);
                const dbResult = await this.userDb.insertOrUpdate(userId, updatePoint);
                const historyResult = await this.historyDb.insert(userId, point, TransactionType.CHARGE, dbResult.updateMillis);
                return dbResult;
            } catch (error) {
                console.error(error);
                throw error;
            }
        }
    }

    //특정 유저의 포인트를 사용하는 기능
    async use(userId: number, point: number): Promise<UserPoint> {
        if (point <= 0) {
            throw new HttpException('message', HttpStatus.BAD_REQUEST)
        } else {
            try {
                const userPoint = (await this.userDb.selectById(userId)).point;
                const updatePoint = await (userPoint - point);
                if(updatePoint < 0) {
                    throw new HttpException('잔액 부족', HttpStatus.UNPROCESSABLE_ENTITY);
                } else {
                    const dbResult = await this.userDb.insertOrUpdate(userId, updatePoint);
                    const historyResult = await this.historyDb.insert(userId, point, TransactionType.USE, dbResult.updateMillis);
                    return dbResult;
                }
            } catch (error) {
                console.error(error);
                throw error;
            }
        }
    }


}
