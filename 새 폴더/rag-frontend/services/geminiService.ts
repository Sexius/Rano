
import { GoogleGenAI, Type } from "@google/genai";
import { MarketItem, Skill } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const searchItemsWithGemini = async (
  query: string, 
  server: string, 
  category: string
): Promise<MarketItem[]> => {
  
  if (!query) return [];

  try {
    const prompt = `
      You are the backend for the Korean Ragnarok Online (kRO) market search engine.
      The user is searching for: "${query}".
      Current Server Filter: ${server}
      Current Category Filter: ${category}

      Task:
      Generate 8 to 12 realistic market listings in JSON format matching the query.
      The data MUST act as if it was fetched from the official kRO database (ro.gnjoy.com).

      Rules:
      1. **Language**: All text (item names, shop titles, locations) MUST be in KOREAN.
      2. **Item Matches**: 
         - If the query is specific (e.g., "천공의 체이싱 대거"), generate listings mostly for that item with various refine levels (+7, +9, +11) and prices.
         - If the query is generic (e.g., "단검"), generate diverse dagger items.
      3. **Servers**: randomly distribute among [바포메트, 다이크, 프리야, 사라] unless filter is specific.
      4. **Prices**: Use realistic Zeny amounts.
      5. **Shop Titles**: Generate realistic player vending shop titles.
      6. **Weapon Stats**: IF the item is a WEAPON, you **MUST** include "공격 : [number]" and "무기레벨 : [1-4]" and "요구레벨 : [number]" in the 'stats' array. This is critical for the damage calculator.
      7. **Cards**: If item has slots, optionally equip realistic cards.

      Schema Fields:
      - id: unique string
      - server: string
      - name: string (Item Name)
      - price: integer
      - amount: integer
      - seller: string
      - shop_title: string (Vending Shop Title)
      - location: string
      - created_at: string
      - category: string
      - refine_level: integer (0-20)
      - card_slots: integer (0-4)
      - cards_equipped: array of strings
      - description: string
      - stats: array of strings (e.g. ["공격 : 350", "무기레벨 : 4", "요구레벨 : 200", "STR + 3"])
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              server: { type: Type.STRING },
              name: { type: Type.STRING },
              price: { type: Type.INTEGER },
              amount: { type: Type.INTEGER },
              seller: { type: Type.STRING },
              shop_title: { type: Type.STRING },
              location: { type: Type.STRING },
              created_at: { type: Type.STRING },
              category: { type: Type.STRING },
              refine_level: { type: Type.INTEGER },
              card_slots: { type: Type.INTEGER },
              cards_equipped: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              description: { type: Type.STRING },
              stats: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
            },
            required: ["id", "server", "name", "price", "seller", "created_at", "shop_title"],
          },
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as MarketItem[];
      // Add placeholders for images
      return data.map(item => ({
        ...item,
        image_placeholder: `https://picsum.photos/seed/${item.id}/64/64`
      }));
    }
    
    return [];

  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const fetchSkillsWithGemini = async (jobClass: string): Promise<Skill[]> => {
  try {
    const prompt = `
      Generate a valid JSON array of skills for the Ragnarok Online job class: "${jobClass}".
      The data must mimic the official skill tree structure.

      Rules:
      1. **Language**: Korean (Names and Descriptions).
      2. **Structure**: 
         - Create 8 to 15 skills.
         - 'row' (0-4) and 'col' (0-3) should layout the skills in a logical tree structure (prerequisites usually above or to the left).
      3. **Requirements**: 
         - Some skills MUST have prerequisites ('requirements' array).
         - The 'skillId' in requirements MUST exist in the generated list.
      4. **Icons**: Use generic identifiers: 'sword', 'shield', 'magic', 'fire', 'ice', 'heal', 'buff', 'passive', 'bow', 'poison', 'cart', 'potion'.

      Schema:
      - id: string (unique, e.g., 'mc_cartpush')
      - name: string
      - maxLevel: integer (usually 1, 5, or 10)
      - description: string (short tooltip)
      - row: integer (0-4)
      - col: integer (0-3)
      - icon: string
      - requirements: array of objects { skillId: string, level: integer }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              maxLevel: { type: Type.INTEGER },
              description: { type: Type.STRING },
              row: { type: Type.INTEGER },
              col: { type: Type.INTEGER },
              icon: { type: Type.STRING },
              requirements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    skillId: { type: Type.STRING },
                    level: { type: Type.INTEGER },
                  }
                }
              }
            },
            required: ["id", "name", "maxLevel", "row", "col"],
          },
        },
      },
    });

    if (response.text) {
      const skills = JSON.parse(response.text) as Skill[];
      // Inject the jobClass into the objects since the schema doesn't have it but our frontend type expects it
      return skills.map(s => ({ ...s, jobClass }));
    }
    return [];
  } catch (error) {
    console.error("Gemini Skill API Error:", error);
    return [];
  }
};
