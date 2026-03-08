#!/bin/bash
API_KEY="AIzaSyCDeMteqMATih242Ze2mEv6pZ_ezEje1T0"
IMAGE_B64=$(base64 -i public/sample-bill.jpg | tr -d '\n')

cat <<EOF > /tmp/gemini_payload.json
{
  "contents": [
    {
      "parts": [
        {
          "text": "You are a high-precision OCR and data extraction engine. Analyze the provided image of a receipt. Extract every line item, including its quantity and unit price.\n**Output Requirements:**\n* Return ONLY a valid JSON object. \n* Do not include markdown formatting like \`\`\`json.\n* If a quantity is not explicitly listed, assume 1.\n* Standardize item names to Title Case.\n\n**JSON Schema:**\n{\n\"items\": [\n{ \"name\": \"string\", \"qty\": number, \"price\": number }\n],\n\"currency\": \"string\", \"tax\": number,\n\"total\": number\n}"
        },
        {
          "inlineData": {
            "mimeType": "image/jpeg",
            "data": "${IMAGE_B64}"
          }
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.1,
    "responseMimeType": "application/json"
  }
}
EOF

echo "Sending first request..."
curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}" \
    -H 'Content-Type: application/json' \
    -d @/tmp/gemini_payload.json | tee /tmp/gemini_res1.json
echo -e "\n\nSending second request..."
curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}" \
    -H 'Content-Type: application/json' \
    -d @/tmp/gemini_payload.json | tee /tmp/gemini_res2.json
echo -e "\nDone."
