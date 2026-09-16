export const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:8000';

/**
 * Uploads a file to the backend vector indexing service.
 * @param {File} file
 * @returns {Promise<Object>}
 */
export async function uploadFileToBackend(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload/`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`);
  }
  return await res.json();
}

/**
 * Calls backend RAG interview generation API with fallback support.
 * @param {string} query
 * @returns {Promise<string>}
 */
export async function fetchAIResponse(query) {
  try {
    const res = await fetch(`${API_BASE}/interview/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic: query }),
    });

    if (!res.ok) {
      throw new Error(`API error (${res.status})`);
    }

    const data = await res.json();
    return data.result || data.message || 'No response generated.';
  } catch (err) {
    console.warn('Backend unavailable, using simulated response:', err);
    await new Promise((r) => setTimeout(r, 1200));
    return `I've analyzed your request regarding **"${query}"**.\n\nHere are technical interview questions generated from your context:\n\n1. **Core Concepts**: Explain how this mechanism operates and its primary use cases.\n2. **Architecture & Tradeoffs**: What key tradeoffs exist in this design?\n3. **Debugging Scenario**: How would you troubleshoot performance bottlenecks or failures in this setup?`;
  }
}
