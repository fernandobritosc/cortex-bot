import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function analyzeImage(imagePath: string): Promise<string> {
  try {
    const imageData = fs.readFileSync(imagePath);
    const result = await model.generateContent([
      "Você é o Cortex, um assistente pessoal. Descreva brevemente o que vê nesta imagem e, se for um documento ou recibo, extraia as informações mais importantes (contas, datas, valores). Responda de forma curta e objetiva em português brasileiro.",
      {
        inlineData: {
          data: imageData.toString("base64"),
          mimeType: "image/jpeg",
        },
      },
    ]);

    return result.response.text();
  } catch (error) {
    console.error("Error analyzing image:", error);
    return "Desculpe, não consegui analisar essa imagem agora.";
  }
}
