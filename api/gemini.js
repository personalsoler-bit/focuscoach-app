module.exports = async function(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { objetivo } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY; 

    // 1. Verificamos si Vercel tiene la llave
    if (!API_KEY) {
        return res.status(200).json([{ 
            titulo: "Falta configurar GEMINI_API_KEY en Vercel", 
            tiempo: "Error Sistema" 
        }]);
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Desglosa esto en 2 o 3 micro-tareas. Responde ÚNICAMENTE en JSON válido. Ejemplo: [{"titulo": "Estructurar presentación", "tiempo": "10 min"}]. Meta: ${objetivo}` }] }],
                generationConfig: { temperature: 0.2 }
            })
        });

        const data = await response.json();

        // 2. EL ESCUDO: Si Google rechaza tu llave (por facturación, límites o formato)
        if (!response.ok || data.error) {
            return res.status(200).json([{
                titulo: `Rechazo de Google: ${data.error?.message || response.statusText}`,
                tiempo: "Alerta API"
            }]);
        }

        // 3. Si Google responde pero no envía el texto estructurado
        if (!data.candidates || !data.candidates[0].content) {
            return res.status(200).json([{ 
                titulo: "Google bloqueó la respuesta por seguridad", 
                tiempo: "Error IA" 
            }]);
        }

        // 4. Todo perfecto, enviamos a FocusCoach
        let respuestaIA = data.candidates[0].content.parts[0].text;
        respuestaIA = respuestaIA.replace(/```json/gi, '').replace(/```/g, '').trim();
        const tareasGeneradas = JSON.parse(respuestaIA);
        
        res.status(200).json(tareasGeneradas);

    } catch (error) {
        // 5. Captura de fallos internos para que NUNCA vuelva a dar Error 500
        res.status(200).json([{ 
            titulo: `Error interno: ${error.message}`, 
            tiempo: "Fallo Servidor" 
        }]);
    }
}
