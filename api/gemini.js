module.exports = async function(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { objetivo } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY; 
    
    if (!API_KEY) {
        return res.status(500).json({ error: 'Falta la API Key en el servidor de Vercel' });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;

    const systemPrompt = `Eres FocusCoach, un asistente de inteligencia artificial de élite especializado en alto rendimiento comercial.
    Desglosa esta meta en 2 o máximo 3 micro-tareas.
    Responde ÚNICAMENTE en formato JSON estricto. 
    Ejemplo: [{"titulo": "Investigar métricas", "tiempo": "20 min"}]
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
        
        // EL BLINDAJE: Si Google devuelve un error por la llave o facturación
        if (!response.ok || data.error) {
            return res.status(500).json({ error: `Rechazo de Google: ${data.error?.message || 'Error de autenticación (Revisa que tu llave comience con AIza)'}` });
        }

        // Si la IA bloquea el contenido o devuelve una estructura vacía
        if (!data.candidates || data.candidates.length === 0) {
             return res.status(500).json({ error: 'Google bloqueó la respuesta o no devolvió tareas.' });
        }

        let respuestaIA = data.candidates[0].content.parts[0].text;
        respuestaIA = respuestaIA.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const tareasGeneradas = JSON.parse(respuestaIA);
        res.status(200).json(tareasGeneradas);

    } catch (error) {
        res.status(500).json({ error: 'Error técnico interno: ' + error.message });
    }
}
