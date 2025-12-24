
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";

// Khởi tạo AI với Key từ hệ thống
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeGameScreen = async (base64Image: string): Promise<string> => {
  const prompt = `
    Bạn là một Đại sư Chiến thuật chuyên nghiệp của trò chơi Arcane Rush. 
    Nhiệm vụ của bạn là phân tích ảnh chụp màn hình và đưa ra chỉ dẫn "thắng cuộc".
    THÔNG TIN QUAN TRỌNG: 
    - Vàng không cộng dồn qua các vòng, phải tiêu sạch!
    - Mỗi quân lính trong shop có giá ít nhất 3 vàng.
    Hãy phân tích shop và đội hình hiện tại để đưa ra quyết định tối ưu.
  `;

  const imagePart = {
    inlineData: {
      mimeType: 'image/png',
      data: base64Image.split(',')[1] || base64Image,
    },
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [imagePart, { text: prompt }] },
    });
    return response.text || "Không thể phân tích hình ảnh.";
  } catch (error) {
    console.error(error);
    return "⚠️ Lỗi kết nối AI. Hãy kiểm tra lại kết nối mạng.";
  }
};

export const chatWithStrategist = async (message: string, useThinking: boolean = false): Promise<string> => {
  try {
    const config = useThinking ? { thinkingConfig: { thinkingBudget: 32768 } } : {};
    const response = await ai.models.generateContent({
      model: useThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
      contents: message,
      config: {
        ...config,
        systemInstruction: "Bạn là Arcane Strategist. Luôn nhắc nhở người chơi tiêu hết vàng vì vàng không dồn, và lính giá >= 3 vàng.",
      }
    });
    return response.text || "";
  } catch (error) {
    console.error(error);
    return "⚠️ Lỗi xử lý tin nhắn.";
  }
};

export const editImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: 'image/png' } },
          { text: prompt },
        ],
      },
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch { return null; }
};

export const generateGameVisual = async (prompt: string, aspectRatio: string = "1:1"): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: aspectRatio as any, imageSize: "1K" }
      }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch { return null; }
};
