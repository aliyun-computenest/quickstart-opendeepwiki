/**
 * Fetches available models from OpenAI API
 */
export async function fetchOpenAIModels(endpoint: string, apiKey: string): Promise<string[]> {
  try {
    const modelsEndpoint = `${endpoint.replace(/\/+$/, '')}/models`;
    
    const response = await fetch(modelsEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    // Extract model IDs from the OpenAI API response
    return data.data.map((model: any) => model.id);
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
    throw error;
  }
}

/**
 * Creates a chat completion using OpenAI API
 */
export async function createChatCompletion(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>
) {
  try {
    const completionsEndpoint = `${endpoint.replace(/\/+$/, '')}/chat/completions`;
    
    const response = await fetch(completionsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Failed to create completion: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating chat completion:', error);
    throw error;
  }
} 