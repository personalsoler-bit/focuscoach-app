export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { objetivo } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY; 

    // 1. Verificamos si Vercel tiene la llave guardada
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
                contents: [{ parts: [{ text: `Desglosa esto en 2 o 3 micro-tareas. Responde ÚNICAMENTE en JSON válido. Ejemplo: [{"titulo": "Leer documento", "tiempo": "10 min"}]. Meta: ${objetivo}` }] }],
                generationConfig: { temperature: 0.2 }
            })
        });

        const data = await response.json();

        // 2. Si Google bloquea la petición (Ej: Llave sin facturación o inválida)
        if (!response.ok || data.error) {
            return res.status(200).json([{
                titulo: `Rechazo de Google: ${data.error?.message || response.statusText}`,
                tiempo: "Alerta API"
            }]);
        }

        // 3. Si Google responde pero el formato viene vacío
        if (!data.candidates || !data.candidates[0].content) {
            return res.status(200).json([{ 
                titulo: "Google no envió tareas estructuradas", 
                tiempo: "Error IA" 
            }]);
        }

        // 4. Si todo sale bien, limpiamos y enviamos las tareas
        let respuestaIA = data.candidates[0].content.parts[0].text;
        respuestaIA = respuestaIA.replace(/```json/gi, '').replace(/```/g, '').trim();
        const tareasGeneradas = JSON.parse(respuestaIA);
        
        res.status(200).json(tareasGeneradas);

    } catch (error) {
        // 5. Si hay un problema interno de JavaScript, lo mostramos en pantalla
        res.status(200).json([{ 
            titulo: `Error de código: ${error.message}`, 
            tiempo: "Fallo" 
        }]);
    }
}
