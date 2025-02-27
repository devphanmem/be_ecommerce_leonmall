import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class MomoService {
  private readonly partnerCode = 'MOMO';
  private readonly accessKey = 'F8BBA842ECF85';
  private readonly secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
  private readonly endpoint =
    'https://test-payment.momo.vn/v2/gateway/api/create';

  private readonly MIN_AMOUNT = 1000; // Số tiền tối thiểu cho phép
  private readonly MAX_AMOUNT = 50000000000000000; // Số tiền tối đa cho phép

  async createPayment(
    orderId: string,
    amount: number,
    returnUrl: string,
    notifyUrl: string,
  ) {
    // Kiểm tra số tiền giao dịch có hợp lệ không
    if (amount < this.MIN_AMOUNT || amount > this.MAX_AMOUNT) {
      throw new BadRequestException(
        `Transaction amount should be between ${this.MIN_AMOUNT} VND and ${this.MAX_AMOUNT} VND.`,
      );
    }

    const requestId = `${Date.now()}`;
    const orderInfo = `Payment for Order ${orderId}`;

    // Chuẩn bị chuỗi thô để tạo chữ ký
    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=&ipnUrl=${notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=captureWallet`;

    // Tạo chữ ký HMAC SHA256
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    // Payload gửi đến Momo API
    const payload = {
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: returnUrl,
      ipnUrl: notifyUrl,
      requestType: 'captureWallet',
      extraData: '',
      signature,
    };

    try {
      // Gửi yêu cầu đến Momo API
      const response = await axios.post(this.endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      // Trả về dữ liệu phản hồi từ Momo (URL thanh toán)
      return response.data;
    } catch (error) {
      // Xử lý lỗi và trả thông báo lỗi
      throw new Error(
        error.response?.data?.message || 'Failed to create payment',
      );
    }
  }
}
