
import { GoogleGenAI, Type } from "@google/genai";
import { VerificationResult, HazardCategory, LocationForecast, SafeZone } from "../types";

// Note: In a real backend, the API key is secure. Here we rely on the injected env var.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Simple in-memory cache for weather to avoid hitting quota
const weatherCache: Record<string, { data: LocationForecast, timestamp: number }> = {};
const safeZoneCache: Record<string, { data: SafeZone[], timestamp: number }> = {};
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const getFallbackWeather = (location: string): LocationForecast => ({
  locationName: location,
  latitude: 13.0827,
  longitude: 80.2707,
  isFallback: true,
  current: {
    temp: 32,
    condition: 'Sunny',
    humidity: 65,
    windSpeed: 12,
    feelsLike: 35,
    uvIndex: 8
  },
  days: Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      tempMax: 32 + Math.floor(Math.random() * 5),
      tempMin: 24 + Math.floor(Math.random() * 3),
      condition: 'Sunny',
      windSpeed: 10 + Math.floor(Math.random() * 10),
      precipitationChance: Math.floor(Math.random() * 20)
    };
  }),
  sourceUri: "https://www.google.com/search?q=weather+" + encodeURIComponent(location)
});

export const verifyHazardReport = async (
  description: string,
  imageBase64?: string
): Promise<VerificationResult> => {
  try {
    const parts: any[] = [{ text: `
      Act as a Crisis Verification Expert with specialization in ELECTRICAL SAFETY and IMAGE FORENSICS. 
      Analyze this hazard report and cross-reference with existing disaster databases and online news.
      
      Task:
      1. Determine if it describes a genuine hazard.
      2. If it mentions wires, poles, sparks, transformers, or current, categorize as 'Electrical Hazard'.
      3. IMAGE FORENSICS & REVERSE SEARCH:
         - Search for this description and image content online.
         - Identify if this is "Old News" or a "Potential Duplicate" from a previous disaster (e.g., 2015 floods, 2004 tsunami).
         - DETECT AI GENERATION: Check for artifacts, unnatural lighting, or patterns typical of AI image generators (DALL-E, Midjourney, etc.).
         - DETECT STOCK PHOTOS: Identify if the image is a professional stock photo or taken from Google Images/News rather than being a real-time citizen capture.
         - Flag as 'isFake' if it is AI-generated, a stock photo, or matches historical disaster footage being passed off as new.
      4. DETECT FAKE CONTENT: Check for vague descriptions, clickbait language, or illogical statements.
      5. ASSESS SEVERITY:
         - Critical: Live wires in water, massive sparks, fire on transformer, pole about to fall on house.
         - High: Exposed wires, smoke, leaning pole.
         - Medium: Flickering lights, noise.
         - Low: Routine maintenance issue.
      6. CALCULATE PRIORITY SCORE (0-100):
         - Higher score means faster response is needed.
         - Critical severity + High confidence = 90-100.
         - High severity = 70-89.
         - Medium severity = 40-69.
         - Low severity = 0-39.
         - Penalize heavily (set to 0) if 'isFake', 'isAiGenerated', 'isStockPhoto', or 'isOldNews' is likely.
      
      Description: "${description}"
      
      Output JSON only.
    ` }];

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: { parts },
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isHazard: { type: Type.BOOLEAN, description: "Is this related to a natural or electrical hazard?" },
            isFake: { type: Type.BOOLEAN, description: "True if the report seems fabricated, AI-generated, a stock photo, or matches old news." },
            isAiGenerated: { type: Type.BOOLEAN, description: "True if the image shows signs of being AI-generated." },
            isStockPhoto: { type: Type.BOOLEAN, description: "True if the image appears to be a stock photo or from Google Images." },
            isOldNews: { type: Type.BOOLEAN, description: "True if the image/event matches a historical disaster." },
            sourceUrl: { type: Type.STRING, description: "URL of the matching news/database entry if found." },
            confidence: { type: Type.NUMBER, description: "Confidence score 0-100" },
            reasoning: { type: Type.STRING, description: "Short explanation of the verdict including cross-reference results" },
            category: { type: Type.STRING, enum: Object.values(HazardCategory) },
            severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
            priorityScore: { type: Type.NUMBER, description: "Priority score 0-100" }
          },
          required: ["isHazard", "isFake", "isAiGenerated", "isStockPhoto", "isOldNews", "confidence", "reasoning", "category", "priorityScore"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      isHazard: result.isHazard ?? false,
      isFake: result.isFake ?? false,
      isAiGenerated: result.isAiGenerated ?? false,
      isStockPhoto: result.isStockPhoto ?? false,
      isOldNews: result.isOldNews ?? false,
      sourceUrl: result.sourceUrl,
      confidence: result.confidence ?? 0,
      reasoning: result.reasoning ?? "Analysis failed",
      category: result.category ?? HazardCategory.OTHER,
      severity: result.severity || 'Medium',
      priorityScore: result.priorityScore ?? 50
    };

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    let reasoning = "AI Verification unavailable: " + (error instanceof Error ? error.message : "Unknown error");
    
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED") {
      reasoning = "AI Verification quota exceeded. Defaulting to manual review required.";
    }

    return {
      isHazard: true,
      isFake: false,
      confidence: 0,
      reasoning,
      category: HazardCategory.OTHER,
      severity: 'Medium',
      priorityScore: 50
    };
  }
};

export const filterRelevantPosts = async (posts: { id: string, text: string }[]): Promise<string[]> => {
  try {
    const prompt = `
      You are an AI filter for a disaster response system.
      Review the following social media posts.
      Return a JSON object containing an array "relevantIds" with the IDs of posts that are strictly related to:
      - Natural disasters (Floods, Cyclones, Tsunami, Fire, Earthquakes)
      - Electrical Hazards (Sparks, downed poles, blackouts)
      - Emergency requests
      
      IGNORE:
      - Personal life updates
      - Unrelated politics or sports
      - General spam

      Posts:
      ${JSON.stringify(posts)}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                relevantIds: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        }
      }
    });

    const result = JSON.parse(response.text || '{ "relevantIds": [] }');
    return result.relevantIds || [];
  } catch (error: any) {
    const isQuotaError = 
      error?.status === "RESOURCE_EXHAUSTED" || 
      error?.code === 429 || 
      error?.message?.includes("429");

    if (isQuotaError) {
      console.warn("Social Filtering Quota Exceeded. Defaulting to all relevant.");
      return posts.map(p => p.id);
    }

    console.error("Social Filtering Error:", error);
    return posts.map(p => p.id); // Fallback: return all
  }
};

export const analyzeSocialSentiment = async (posts: string[]) => {
  try {
    const prompt = `Analyze these social media posts about coastal and electrical hazards. Summarize the general sentiment and identify trending locations.
    Posts: ${JSON.stringify(posts)}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a crisis analyst. Be concise."
      }
    });
    return response.text;
  } catch (error: any) {
    if (error?.status === "RESOURCE_EXHAUSTED" || error?.code === 429 || error?.message?.includes("429")) {
      return "Social trend analysis is currently in offline mode due to high demand.";
    }
    return "Could not analyze social trends.";
  }
};

export const getWeatherForecast = async (location: string): Promise<LocationForecast | null> => {
  // Check cache first
  const cached = weatherCache[location];
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.data;
  }

  try {
    const prompt = `
      You are a specialized Weather Data Extraction Engine.
      Perform a Google Search to find the CURRENT weather and 10-day forecast for "${location}".
      
      CRITICAL INSTRUCTIONS:
      1. Use the Google Search results to extract REAL-TIME data. Do not make up numbers.
      2. Return the data STRICTLY as a raw JSON object matching the structure below.
      3. For 'condition', pick the closest match: 'Sunny', 'Cloudy', 'Rain', 'Storm', 'Windy', 'Fog'.
      4. Ensure 'latitude' and 'longitude' are accurate for the location "${location}".
      
      JSON Structure:
      {
        "locationName": "City, Country",
        "latitude": 0.0,
        "longitude": 0.0,
        "current": {
          "temp": 0,
          "condition": "Condition",
          "humidity": 0,
          "windSpeed": 0,
          "feelsLike": 0,
          "uvIndex": 0
        },
        "days": [
          {
            "date": "YYYY-MM-DD",
            "dayName": "Mon",
            "tempMax": 0,
            "tempMin": 0,
            "condition": "Condition",
            "windSpeed": 0,
            "precipitationChance": 0
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    // Parse the text response manually since we couldn't enforce JSON mode with tools
    let jsonString = response.text || "{}";
    
    // Clean up potential markdown formatting if the model ignored instructions
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        jsonString = jsonMatch[0];
    }

    const data = JSON.parse(jsonString) as LocationForecast;

    // Extract grounding attribution
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sourceUri = chunks.find((c: any) => c.web?.uri)?.web?.uri;

    if (data && sourceUri) {
        data.sourceUri = sourceUri;
    }

    // Cache the result
    if (data && data.locationName) {
      weatherCache[location] = { data, timestamp: Date.now() };
    }

    return data;
  } catch (error: any) {
    // Check for 429 / Quota Exceeded
    const isQuotaError = 
      error?.status === "RESOURCE_EXHAUSTED" || 
      error?.code === 429 || 
      error?.message?.includes("429") ||
      (typeof error === 'string' && error.includes("429"));

    if (isQuotaError) {
      console.warn("Weather API Quota Exceeded. Using fallback data for:", location);
      return getFallbackWeather(location);
    }
    
    console.error("Weather Generation Error:", error);
    return null;
  }
};

export const getChatResponse = async (history: { role: 'user' | 'model', text: string }[], newMessage: string) => {
  try {
    const chat = ai.chats.create({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction: `
          You are TideX AI, an intelligent multilingual hazard response assistant with ELECTRICAL SAFETY expertise.
          
          Guidelines:
          1. Languages: Detect and reply in User's language (Tamil, Telugu, Hindi, English).
          2. Electrical Safety: If user reports sparks, fallen poles, or shocks:
             - Advise to stay 30 feet away.
             - Do not touch water nearby.
             - Tell them to use the 'Electrical Hazard' category in the report tab.
          3. General Safety: Explain map colors and reporting process.
        `
      },
      history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
  } catch (error: any) {
    if (error?.status === "RESOURCE_EXHAUSTED" || error?.code === 429 || error?.message?.includes("429")) {
      return "I'm currently in high-demand mode. Please stay 30 feet away from any electrical hazards and use the 'Electrical Hazard' category to report issues.";
    }
    console.error("Chatbot Error:", error);
    return "I'm having trouble connecting to the network right now. Please check the dashboard manually.";
  }
};

export const getSafeZones = async (location: string): Promise<SafeZone[]> => {
  // Check cache first
  const cached = safeZoneCache[location];
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.data;
  }

  try {
    const prompt = `
      You are an Emergency Response Data Agent.
      Perform a Google Search to find REAL-TIME emergency shelters, hospitals, and safe zones in "${location}".
      
      CRITICAL INSTRUCTIONS:
      1. Use Google Search results to find REAL locations.
      2. Return the data STRICTLY as a raw JSON array of objects matching the structure below.
      3. For 'type', pick: 'Shelter', 'Hospital', 'High Ground', 'Police Station'.
      4. For 'status', pick: 'Available', 'Full', 'Closed'.
      5. Ensure 'latitude' and 'longitude' are accurate for the specific facility in "${location}".
      
      JSON Structure:
      [
        {
          "id": "sz-unique-id",
          "name": "Facility Name",
          "type": "Shelter",
          "location": { "latitude": 0.0, "longitude": 0.0 },
          "capacity": 1000,
          "occupancy": 200,
          "status": "Available",
          "address": "Full Street Address",
          "phone": "Contact Number"
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    let jsonString = response.text || "[]";
    const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
        jsonString = jsonMatch[0];
    }

    const data = JSON.parse(jsonString) as SafeZone[];
    
    if (data && Array.isArray(data)) {
      safeZoneCache[location] = { data, timestamp: Date.now() };
      return data;
    }
    return [];
  } catch (error) {
    console.error("Safe Zone Generation Error:", error);
    return [];
  }
};
