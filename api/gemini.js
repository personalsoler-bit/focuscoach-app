export default async function handler(req, res) {
    // Solo permitimos peticiones POST desde nuestra app
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { objetivo } = req.body;

    // process.env lee la llave de forma segura desde la configuración de Vercel
    const API_KEY = process.env.GEMINI_API_KEY; 
    
    if (!API_KEY) {
        return res.status(500).json({ error: 'API Key no configurada en el servidor' });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;

    const systemPrompt = `Eres FocusCoach, un asistente de inteligencia artificial de élite especializado en alto rendimiento comercial y corporativo.
    Tu objetivo es desglosar la siguiente meta del usuario en 2 o máximo 3 micro-tareas accionables y medibles.
    Debes responder ÚNICAMENTE en un formato JSON estrictamente válido, que sea un arreglo de objetos. 
    Cada objeto debe tener dos propiedades: "titulo" (máximo 5 palabras) y "tiempo" (ej. "15 min", "25 min").
    Ejemplo de tu respuesta: [{"titulo": "Estructurar guion de ventas", "tiempo": "20 min"}, {"titulo": "Revisar métricas de conversión", "tiempo": "15 min"}]
    
    Meta del usuario: ${objetivo}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: systemPrompt }]
                }],
                generationConfig: {
                    temperature: 0.2 // Analítico y directo
                }
            })
        });

        const data = await response.json();
        
        let respuestaIA = data.candidates[0].content.parts[0].text;
        respuestaIA = respuestaIA.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const tareasGeneradas = JSON.parse(respuestaIA);

        // Devolvemos las tareas estructuradas a tu frontend
        res.status(200).json(tareasGeneradas);

    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ error: 'Fallo al procesar la meta con la IA' });
    }
}