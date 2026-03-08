import { NextResponse } from 'next/server';

export const maxDuration = 60; // Allow more time for API routes if hosted on Vercel

export async function POST(req: Request) {
  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const promptText = `You are a high-precision OCR and data extraction engine. Analyze the provided image of a receipt. Extract every line item, including its quantity and unit price.
**Output Requirements:**
* Return ONLY a valid JSON object. 
* Do not include markdown formatting like \`\`\`json.
* If a quantity is not explicitly listed, assume 1.
* Standardize item names to Title Case.

**JSON Schema:**
{
"items": [
{ "name": "string", "qty": number, "price": number }
],
"currency": "string", "tax": number,
"total": number
}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: image
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return NextResponse.json({ error: "Failed to scan receipt with Gemini" }, { status: 500 });
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error("Empty response from Gemini");
    }

    const parsedData = JSON.parse(resultText);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Scan route error:", error);
    return NextResponse.json({ error: error.message || "Failed to scan" }, { status: 500 });
  }
}
