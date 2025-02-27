import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class sendPromptToGemini {
  private readonly GEMINI_API_KEY = process.env.GEMINI_API_KEY; // API key từ biến môi trường
  private readonly GEMINI_API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

  async sendPromptToGemini(prompt: string) {
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
}
