import {GoogleGenerativeAI} from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const scanReceipt = async (imageFile) => {
  try {
    const model = genAI.getGenerativeModel({model: 'gemini-2.5-flash'});

    const fileToGenerativePart = async (file) => {
      const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
      });
      return {
        inlineData: {data: await base64EncodedDataPromise, mimeType: file.type},
      };
    };

    const imagePart = await fileToGenerativePart(imageFile);

    const prompt =
        'Extract the store name, total amount, and date from this receipt. Return ONLY a JSON object with keys: storeName, amount, date.';

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('AI Scan Error Detail:', error);
    throw error;
  }
};