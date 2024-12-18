import { Body, Controller, Get, Param, Patch, ValidationPipe } from "@nestjs/common";
import { PointHistory, TransactionType, UserPoint } from "./point.model";
import { UserPointTable } from "src/database/userpoint.table";
import { PointHistoryTable } from "src/database/pointhistory.table";
import { PointBody as PointDto } from "./point.dto";
import { PointService } from "./point.service";
import { Mutex } from "async-mutex";


@Controller('/point')
export class PointController {

    constructor(
        private readonly pointService: PointService
    ) {}

    private locks = new Map<number, Mutex>();

    private getOrCreateMutex(userId: number): Mutex {
        if(!this.locks.has(userId)) {
            this.locks.set(userId, new Mutex());
        }
        return this.locks.get(userId)!;
    }

    /**
     * TODO - 특정 유저의 포인트를 조회하는 기능을 작성해주세요.
     */
    @Get(':id')
    async point(@Param('id') id): Promise<UserPoint> {
        const userId = Number.parseInt(id)
        const getPointResult = this.pointService.getPoint(userId);
        return getPointResult;
    }

    /**
     * TODO - 특정 유저의 포인트 충전/이용 내역을 조회하는 기능을 작성해주세요.
     */
    @Get(':id/histories')
    async history(@Param('id') id): Promise<PointHistory[]> {
        const userId = Number.parseInt(id)
        const historyResult = this.pointService.history(userId);
        return historyResult;
    }

    /**
     * TODO - 특정 유저의 포인트를 충전하는 기능을 작성해주세요.
     */
    @Patch(':id/charge')
    async charge(
        @Param('id') id,
        @Body(ValidationPipe) pointDto: PointDto,
    ): Promise<UserPoint> {
        const userId = Number.parseInt(id)
        const amount = pointDto.amount;
        const chargeResult = this.pointService.charge(userId, amount);
        return chargeResult;
    }

    /**
     * TODO - 특정 유저의 포인트를 사용하는 기능을 작성해주세요.
     */
    @Patch(':id/use')
    async use(
        @Param('id') id,
        @Body(ValidationPipe) pointDto: PointDto,
    ): Promise<UserPoint> {
        const userId = Number.parseInt(id)
        const amount = pointDto.amount;
        const useResult = this.pointService.use(userId, amount);
        return useResult;
    }
}