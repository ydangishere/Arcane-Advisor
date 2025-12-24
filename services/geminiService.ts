
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Feature 1: Image Understanding using gemini-3-pro-preview
export const analyzeGameScreen = async (base64Image: string): Promise<string> => {
  const ai = getAI();
  const prompt = `
    Bạn là một Đại sư Chiến thuật chuyên nghiệp của trò chơi Arcane Rush. 
    Nhiệm vụ của bạn là phân tích ảnh chụp màn hình và đưa ra chỉ dẫn "thắng cuộc".

    THÔNG TIN QUAN TRỌNG VỀ KINH TẾ:
    1. Tìm số lượng Vàng hiện có trên màn hình.
    2. QUY TẮC GIÁ CẢ: Mỗi quân bài (linh) trong Shop có giá ít nhất là 3 vàng.
    3. QUY TẮC LƯU TRỮ: Vàng KHÔNG cộng dồn sang vòng sau. Phải tiêu hết!

    NHIỆM VỤ:
    - Phân tích Shop và đề xuất mua quân dựa trên ngân sách hiện tại.
    - Nếu vàng >= 3: Ưu tiên mua quân mạnh nhất hoặc quân hợp hệ tộc.
    - Nếu vàng < 3: Không thể mua quân. Hãy khuyên người chơi dùng số tiền lẻ này để Refresh (nếu đủ) hoặc chấp nhận mất.
    - Mục tiêu là số dư cuối vòng bằng 0.

    CẤU TRÚC CÂU TRẢ LỜI:
    1. **Ngân sách hiện tại:** [Số vàng] vàng.
    2. **Phân tích Shop:** Đánh giá các quân bài (Nhớ rằng mỗi con giá >= 3 vàng).
    
    QUAN TRỌNG NHẤT - KẾT THÚC BẰNG PHẦN SAU:
    ---
    🎯 **KẾ HOẠCH CHI TIÊU (Mỗi quân >= 3 vàng):**
    - [ ] Mua ngay: (Tên các quân + Giá tiền từng con)
    - [ ] Số dư dự kiến: (Vàng còn lại) -> Hãy [Refresh/Nâng cấp/Mua thêm]
    - [ ] Lưu ý: (Cách sắp xếp để thủ)

    Yêu cầu: Tiếng Việt, ngắn gọn, tính toán chuẩn xác theo giá 3 vàng/con.
  `;

  const imagePart = {
    inlineData: {
      mimeType: 'image/png',
      data: base64Image.split(',')[1] || base64Image,
    },
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Feature 1 requirement
      contents: { parts: [imagePart, { text: prompt }] },
    });

    return response.text || "Không thể phân tích hình ảnh này.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "⚠️ Có lỗi kết nối. Vui lòng thử lại sau!";
  }
};

// Feature 2 & 4: Chat with Flash Lite (Fast) or Pro (Thinking)
export const chatWithStrategist = async (message: string, useThinking: boolean = false): Promise<string> => {
  const ai = getAI();
  
  if (useThinking) {
    // Feature 4: High thinking mode
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: message,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // Max for gemini 3 pro
      }
    });
    return response.text || "";
  } else {
    // Feature 2: Fast AI responses
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest',
      contents: message,
      config: {
        systemInstruction: "Bạn là Arcane Strategist. Bạn luôn nhắc nhở người chơi tiêu hết vàng dựa trên số vàng họ đang có và quy tắc mỗi quân bài giá ít nhất 3 vàng. Trả lời thật nhanh và súc tích.",
      }
    });
    return response.text || "";
  }
};

// Feature 3: Image Editing with gemini-2.5-flash-image (Nano Banana)
export const editImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1] || base64Image,
              mimeType: 'image/png',
            },
          },
          { text: prompt },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Edit image error:", error);
    return null;
  }
};

// Feature 5: Image Generation with gemini-3-pro-image-preview
export const generateGameVisual = async (prompt: string, aspectRatio: string = "1:1"): Promise<string | null> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Generate image error:", error);
    return null;
  }
};
