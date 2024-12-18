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
    /*
        1. 사용자의 id가 있는지 없는 지 조회를 한다.(없을 경우 point 0으로 생성)
        2. 사용자의 id로 userDb에 있는 값을 조회한다.
    */
    async getPoint(userId: number): Promise<UserPoint> {

        try {
            const result = this.userDb.selectById(userId);
            return result;
        } catch (error) {
            console.log(error);
        }
    }

    //특정 유저의 포인트 충전/이용 내역을 조회하는 기능
    /*
        1. 사용자의 id가 있는지 없는 지 조회를 한다.(없을 경우 point 0으로 생성)
        2. 사용자의 id로 historyDb에 있는 값을 조회한다.(내역이 없을 경우 빈 배열 반환.)
    */
    async history(userId: number): Promise<PointHistory[]> {
        try {
            const historyResult = this.historyDb.selectAllByUserId(userId);
            return historyResult;
        } catch (error) {
            throw new Error;
        }
    }

    //특정 유저의 포인트를 충전하는 기능
    /*
        1. 입력된 point가 0이하의 금액이면 잘못된 금액으로 처리를하고 Bad Request를 반환한다.
        2. 사용자의 id가 있는지 없는 지 조회를 한다.(없을 경우 point 0으로 생성)
        3. 사용자의 id로 userDb에 존재하는 유저의 point를 조회한다.
        4. 현재 유저의 point와 입력된 point를 더한다.
        5. 더한 금액을 userDb에 반영한다.
        6. 이 과정을 historyDb에 저장한다.
    */
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
    /*
        1. 입력된 point가 0이하의 금액이면 잘못된 금액으로 처리를하고 Bad Request를 반환한다.
        2. 사용자의 id가 있는지 없는 지 조회를 한다.(없을 경우 point 0으로 생성)
        3. 사용자의 id로 userDb에 존재하는 유저의 point를 조회한다.
        4. 현재 유저의 point와 입력된 point를 더했을 경우 0보다 작다면 UNPROCESSABLE_ENTITY(422)를 반환한다.
        5. 이를 userDb에 반환한다.
        6. historyDb에 계산 결과를 저장한다.
    */
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
