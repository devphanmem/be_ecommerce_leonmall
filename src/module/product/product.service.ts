import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Lấy API Key từ biến môi trường
  private readonly GEMINI_API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

  // Lấy tất cả sản phẩm
  async getAllProducts() {
    try {
      const products = await this.prisma.product.findMany({
        include: { category: true }, // Include thông tin danh mục
      });

      return {
        status: 'success',
        message: 'Lấy danh sách sản phẩm thành công',
        data: products,
      };
    } catch (error) {
      console.error('[ProductService][getAllProducts] Lỗi:', error.message);
      throw new InternalServerErrorException(
        'Không thể lấy danh sách sản phẩm. Vui lòng thử lại sau.',
      );
    }
  }

  // Lấy sản phẩm theo ID
  async getProductById(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: { category: true }, // Include thông tin danh mục
      });

      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID "${id}".`);
      }

      return {
        status: 'success',
        message: 'Lấy chi tiết sản phẩm thành công',
        data: product,
      };
    } catch (error) {
      console.error('[ProductService][getProductById] Lỗi:', error.message);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể lấy thông tin sản phẩm. Vui lòng thử lại sau.',
      );
    }
  }

  // Tạo sản phẩm
  async createProduct(data: any) {
    try {
      const product = await this.prisma.product.create({ data });

      return {
        status: 'success',
        message: 'Tạo sản phẩm thành công',
        data: product,
      };
    } catch (error) {
      console.error('[ProductService][createProduct] Lỗi:', error.message);
      throw new InternalServerErrorException(
        'Không thể tạo sản phẩm. Vui lòng thử lại sau.',
      );
    }
  }

  // Cập nhật sản phẩm
  async updateProduct(id: string, data: any) {
    try {
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new NotFoundException(
          `Không tìm thấy sản phẩm với ID "${id}" để cập nhật.`,
        );
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data,
      });

      return {
        status: 'success',
        message: 'Cập nhật sản phẩm thành công',
        data: updatedProduct,
      };
    } catch (error) {
      console.error('[ProductService][updateProduct] Lỗi:', error.message);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể cập nhật sản phẩm. Vui lòng thử lại sau.',
      );
    }
  }

  // Xóa sản phẩm
  async deleteProduct(id: string) {
    try {
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new NotFoundException(
          `Không tìm thấy sản phẩm với ID "${id}" để xóa.`,
        );
      }

      await this.prisma.product.delete({ where: { id } });

      return {
        status: 'success',
        message: 'Xóa sản phẩm thành công',
      };
    } catch (error) {
      console.error('[ProductService][deleteProduct] Lỗi:', error.message);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể xóa sản phẩm. Vui lòng thử lại sau.',
      );
    }
  }

  async getGeminiResponseForProduct(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: { category: true },
      });

      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID "${id}".`);
      }

      // Tạo câu hỏi cho Gemini AI từ dữ liệu sản phẩm
      const prompt = `You are an AI assistant for LeonMall, an e-commerce platform. The customer is asking about the product: ${product.name}. Here's a brief description: ${product.description}. Can you provide more details or answer any questions about this product?`;

      // Gửi câu hỏi đến Gemini API
      const geminiResponse = await this.sendPromptToGemini(prompt);

      return {
        status: 'success',
        message: 'Gemini response fetched successfully',
        data: geminiResponse,
      };
    } catch (error) {
      console.error(
        '[ProductService][getGeminiResponseForProduct] Lỗi:',
        error.message,
      );
      throw new InternalServerErrorException(
        'Không thể lấy phản hồi từ Gemini. Vui lòng thử lại sau.',
      );
    }
  }

  // Hàm gửi yêu cầu đến Gemini API và nhận phản hồi
  private async sendPromptToGemini(prompt: string) {
    if (!prompt.trim()) {
      throw new Error('Prompt cannot be empty.');
    }

    try {
      const response = await axios.post(
        this.GEMINI_API_URL,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt, // Text prompt truyền vào Gemini API
                },
              ],
            },
          ],
        },
        {
          params: { key: this.GEMINI_API_KEY },
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const resultText =
        response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        throw new Error('No valid response returned from Gemini.');
      }
      return resultText;
    } catch (error) {
      throw new Error('Error communicating with Gemini API: ' + error.message);
    }
  }
  async searchProducts(query: string) {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          name: {
            contains: query, // Tìm kiếm sản phẩm theo tên
            mode: 'insensitive', // Không phân biệt chữ hoa/thường
          },
        },
      });

      if (!products.length) {
        throw new NotFoundException('No products found for the search.');
      }

      return products;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to search for products. Please try again later.',
      );
    }
  }
}
