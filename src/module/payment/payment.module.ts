import { Module } from '@nestjs/common';
import { MomoController } from './payment.controller';
import { MomoService } from './payment.service';

@Module({
  controllers: [MomoController],
  providers: [MomoService],
})
export class PaymentModule {}
