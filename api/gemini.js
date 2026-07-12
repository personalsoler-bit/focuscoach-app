const { GoogleGenAI } = require('@google/genai');

module.exports = async function(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { objetivo } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY; 
    
    if (!API_KEY) {
        return res.status(500).json({ error: 'Falta la API Key en el servidor de Vercel' });
    }

    // Inicializamos el SDK oficial (compatible con las nuevas llaves AQ.)
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const systemPrompt = `Eres FocusCoach, un asistente de inteligencia artificial de élite especializado en alto rendimiento comercial.
    Desglosa esta meta en 2 o máximo 3 micro-tareas.
    Responde ÚNICAMENTE en formato JSON estricto. 
    Ejemplo: [{"titulo": "Investigar métricas", "tiempo": "20 min"}]
    Meta: ${objetivo}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: systemPrompt,
            config: {
                temperature: 0.2
            }
        });

        let respuestaIA = response.text;
        respuestaIA = respuestaIA.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const tareasGeneradas = JSON.parse(respuestaIA);
        res.status(200).json(tareasGeneradas);

    } catch (error) {
        console.error("Error SDK:", error);
        res.status(500).json({ error: 'Fallo al procesar con la IA: ' + error.message });
    }
}
