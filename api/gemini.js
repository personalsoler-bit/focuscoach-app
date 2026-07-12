module.exports = async function(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { objetivo } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY; 

    if (!API_KEY) {
        return res.status(200).json([{ titulo: "Falta GEMINI_API_KEY en Vercel", tiempo: "Error" }]);
    }

    // Ya no pegamos la llave aquí en la URL
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-goog-api-key': API_KEY // La enviamos de forma nativa y segura aquí
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Desglosa esto en 2 o 3 micro-tareas. Responde ÚNICAMENTE en JSON válido. Ejemplo: [{"titulo": "Estructurar presentación", "tiempo": "10 min"}]. Meta: ${objetivo}` }] }],
                generationConfig: { temperature: 0.2 }
            })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            return res.status(200).json([{
                titulo: `Rechazo de Google: ${data.error?.message || response.statusText}`,
                tiempo: "Alerta API"
            }]);
        }

        if (!data.candidates || !data.candidates[0].content) {
            return res.status(200).json([{ titulo: "Google bloqueó la respuesta por seguridad", tiempo: "Error IA" }]);
        }

        let respuestaIA = data.candidates[0].content.parts[0].text;
        respuestaIA = respuestaIA.replace(/```json/gi, '').replace(/```/g, '').trim();
        const tareasGeneradas = JSON.parse(respuestaIA);
        
        res.status(200).json(tareasGeneradas);

    } catch (error) {
        res.status(200).json([{ titulo: `Error interno: ${error.message}`, tiempo: "Fallo Servidor" }]);
    }
}
