module.exports = async function(req, res) {
    // 1. Verificación básica
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { objetivo } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY; 
    
    // Si Vercel no lee la llave
    if (!API_KEY) {
        return res.status(200).json([{
            titulo: "Vercel no está leyendo la variable GEMINI_API_KEY",
            tiempo: "Error"
        }]);
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;

    const systemPrompt = `Eres FocusCoach, un asistente de inteligencia artificial.
    Desglosa esta meta en 2 o máximo 3 micro-tareas.
    Responde ÚNICAMENTE en formato JSON estricto. 
    Ejemplo: [{"titulo": "Revisar métricas", "tiempo": "20 min"}]
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
        
        // EL TRUCO: Si Google rechaza la llave, enviamos su respuesta como una tarea visual
        if (data.error) {
            return res.status(200).json([{
                titulo: `Rechazo de Google: ${data.error.message}`,
                tiempo: "Error de IA"
            }]);
        }

        // Si Google bloqueó el texto por seguridad
        if (!data.candidates || data.candidates.length === 0) {
             return res.status(200).json([{
                titulo: "Google bloqueó la respuesta o devolvió un formato vacío.",
                tiempo: "Alerta"
            }]);
        }

        let respuestaIA = data.candidates[0].content.parts[0].text;
        respuestaIA = respuestaIA.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const tareasGeneradas = JSON.parse(respuestaIA);
        
        // Todo exitoso
        res.status(200).json(tareasGeneradas);

    } catch (error) {
        // Captura de cualquier otro colapso del código
        res.status(200).json([{
            titulo: `Fallo interno del código: ${error.message}`,
            tiempo: "Error Crítico"
        }]);
    }
}
