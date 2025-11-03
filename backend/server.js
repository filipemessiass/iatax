// backend/server.js

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        // Chamar Orchestrator Python
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                task_type: 'padrao'
            })
        });
        
        const data = await response.json();
        res.json(data);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});