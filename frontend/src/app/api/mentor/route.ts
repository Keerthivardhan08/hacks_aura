import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "AI Mentor is not configured (missing GEMINI_API_KEY)" },
        { status: 500 }
      );
    }

    // Use the standard text model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Provide a system instruction to act as a mentor
    const systemPrompt = `You are an AI Coding Mentor for the 'HackAura' hackathon platform. 
Keep your answers brief, encouraging, and highly technical. Provide small code snippets if helpful, but encourage the user to think.
The user asked: ${prompt}`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Mentor API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}
