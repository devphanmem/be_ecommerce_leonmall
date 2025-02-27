import { Controller, Get, Query } from '@nestjs/common';
import { MomoService } from './payment.service';

@Controller('payment')
export class MomoController {
  constructor(private readonly momoService: MomoService) {}

  @Get('create')
  async createPayment(
    @Query('amount') amount: number,
    @Query('orderId') orderId: string,
    @Query('returnUrl') returnUrl: string,
  ) {
    const notifyUrl = 'http://localhost:3001/payment/notify'; // URL nhận thông báo
    return await this.momoService.createPayment(
      orderId,
      amount,
      returnUrl,
      notifyUrl,
    );
  }

  @Get('notify')
  async handleNotification(@Query() query: any) {
    console.log('Payment Notification:', query);

    if (query.resultCode === '0') {
      // Thanh toán thành công
      return { status: 'success', message: 'Payment completed successfully' };
    } else {
      // Thanh toán thất bại
      return { status: 'failed', message: 'Payment failed' };
    }
  }
}
