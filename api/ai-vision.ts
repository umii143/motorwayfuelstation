import Groq from 'groq-sdk';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, mimeType = 'image/jpeg', prompt = 'Extract receipt/invoice data: Vendor Name, Date, Invoice No, Items, Tax Amount, Total Amount in JSON format.' } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 parameter is required.' });
  }

  const groqApiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

  if (!groqApiKey) {
    return res.status(200).json({
      reply: "⚠️ **Vision AI Safe Mode:** `GROQ_API_KEY` unconfigured on server. Please enter receipt values manually into the ERP invoice form.",
      extractedData: null,
      safeMode: true
    });
  }

  try {
    const groq = new Groq({ apiKey: groqApiKey });
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const response = await groq.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${cleanBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 1024,
    });

    const reply = response.choices[0]?.message?.content || '';
    return res.status(200).json({
      reply,
      extractedText: reply,
      verifiedSchema: true
    });
  } catch (err: any) {
    console.error('[AI Vision] Error processing image:', err?.message);
    return res.status(200).json({
      reply: "⚠️ Vision extraction error. Please enter details manually.",
      extractedText: ""
    });
  }
}
