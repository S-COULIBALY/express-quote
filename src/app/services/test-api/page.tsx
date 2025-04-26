'use client'

import { useState } from 'react'

export default function TestApi() {
  const [result, setResult] = useState<string>('Pas encore testé');
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    setResult('Test en cours...');
    
    try {
      console.log('🧪 TEST API - Début de la requête');
      
      const response = await fetch('/api/bookings/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'SERVICE',
          data: {
            defaultPrice: 200,
            duration: 8,
            workers: 4,
            defaultDuration: 4,
            defaultWorkers: 2,
          }
        })
      });
      
      console.log('🧪 TEST API - Réponse reçue, status:', response.status);
      
      const text = await response.text();
      console.log('🧪 TEST API - Réponse texte:', text);
      
      let resultText = `Status: ${response.status}\n\nRéponse: ${text}`;
      
      try {
        const json = JSON.parse(text);
        resultText += '\n\nJSON parsé: ' + JSON.stringify(json, null, 2);
      } catch (e) {
        resultText += '\n\nRéponse non-JSON';
      }
      
      setResult(resultText);
    } catch (error) {
      console.error('🧪 TEST API - Erreur:', error);
      setResult(`Erreur: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test API /api/bookings/calculate</h1>
      
      <button
        onClick={testApi}
        disabled={loading}
        className="py-2 px-4 bg-blue-500 text-white rounded disabled:opacity-50 mb-4"
      >
        {loading ? 'Test en cours...' : 'Tester l\'API'}
      </button>
      
      <div className="p-4 border rounded-md bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Résultat:</h2>
        <pre className="whitespace-pre-wrap bg-white p-3 border rounded">
          {result}
        </pre>
      </div>
    </div>
  );
} 