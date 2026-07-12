module.exports = async function(req, res) {
    // 1. Verificación de método
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { objetivo } = req.body;
    
    // 2. Lectura segura de la llave en Vercel
    const API_KEY = process.env.GEMINI_API_KEY; 
    
    if (!API_KEY) {
        return res.status(500).json({ error: 'Falta la API Key en el servidor de Vercel' });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;

    const systemPrompt = `Eres FocusCoach, un asistente de inteligencia artificial de élite especializado en alto rendimiento comercial.
    Desglosa esta meta en 2 o máximo 3 micro-tareas.
    Responde ÚNICAMENTE en formato JSON estricto. 
    Ejemplo: [{"titulo": "Investigar", "tiempo": "20 min"}]
    Meta: ${objetivo}`;

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
                    temperature: 0.2
                }
            })
        });

        const data = await response.json();
        
        // Si Google rechaza la llave, esto nos dirá por qué
        if (!response.ok) {
            console.error("Error de Google:", data);
            return res.status(500).json({ error: 'La IA de Google rechazó la conexión.' });
        }

        let respuestaIA = data.candidates[0].content.parts[0].text;
        respuestaIA = respuestaIA.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const tareasGeneradas = JSON.parse(respuestaIA);
        
        // Todo correcto, enviamos a tu interfaz azul
        res.status(200).json(tareasGeneradas);

    } catch (error) {
        console.error("Error procesando:", error);
        res.status(500).json({ error: 'Fallo al procesar el formato de la IA' });
    }
}
