
import { GoogleGenAI, Type } from "@google/genai";
// Fix: Import BOARD_WIDTH and BOARD_HEIGHT from constants instead of types
import { Piece, Side, GameState } from "../types";
import { BOARD_WIDTH, BOARD_HEIGHT } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getGameAnalysis(state: GameState) {
  const boardDescription = state.board
    .map((row, y) => {
      return row
        .map((p, x) => (p ? `${p.side[0]}:${p.type[0]}` : "."))
        .join(" ");
    })
    .join("\n");

  const prompt = `
    This is a ${state.mode} board state.
    Turn: ${state.turn}
    Board Status:
    ${boardDescription}
    
    Provide a professional analysis of the current situation. 
    Who has the advantage? 
    Suggest a strategic move for the current player (${state.turn}).
    Keep it concise but insightful. Format in Markdown.
  `;

  try {
    const config: any = {};
    if (state.aiThinkingTime !== undefined && state.aiThinkingTime > 0) {
      config.thinkingConfig = { thinkingBudget: state.aiThinkingTime };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Use Pro for better strategic analysis when budget is set
      contents: prompt,
      config: config
    });
    return response.text || "Unable to analyze at this time.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Analysis service currently unavailable.";
  }
}

export async function getMoveSuggestion(state: GameState) {
  const prompt = `
    Acting as a Grandmaster, analyze this board state:
    Turn: ${state.turn}
    
    Give me one piece of specific advice for the next move.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
          thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (err) {
    return "Keep control of the center!";
  }
}
