// geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI client
// This assumes process.env.GEMINI_API_KEY is available in the environment
// where this module is loaded (e.g., loaded via dotenv in server.js)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// *** IMPORTANT CHANGE HERE: Using 'gemini-2.0-flash' as specified in your URL ***
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Generates text suggestions using the Google Gemini API.
 * @param {string} text The input text for which to generate suggestions.
 * @returns {Promise<string[]>} A promise that resolves to an array of suggestion strings.
 */
async function generateGeminiSuggestions(text) {
  console.log('--- generateGeminiSuggestions started ---');
  console.log(`Input text received: "${text}"`);

  try {
    // Construct a prompt for the Gemini model
    // --- MODIFIED PROMPT ---
    const prompt = `Provide 3-4 concise and relevant suggestions for a slogan or caption to improve the following text from a canvas textbox. Do not include any explanatory text, descriptions, or information in brackets or parentheses. Just provide the slogan/caption itself. Format each suggestion on a new line: "${text}"`;
    console.log(`Prompt prepared for Gemini: "${prompt}"`);

    // Call the Gemini API to generate content
    console.log('Attempting to call Gemini API...');
    const result = await model.generateContent(prompt);
    console.log('Gemini API call successful. Processing response...');

    const response = await result.response;
    const aiResponse = response.text();
    console.log(`Raw AI response text: "${aiResponse}"`);

    // Parse the AI response into an array of suggestions
    // We assume suggestions are separated by newlines
    const suggestions = aiResponse.split('\n')
                                  .map(s => s.trim()) // Trim whitespace from each suggestion
                                  .filter(s => s.length > 0) // Remove empty strings
                                  .slice(0, 4); // Return a maximum of 4 suggestions

    console.log('Parsed suggestions:', suggestions);
    console.log('--- generateGeminiSuggestions finished successfully ---');
    return suggestions;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    // Log the full error object for more details
    console.error('Full error details:', error);
    console.log('--- generateGeminiSuggestions finished with error ---');
    // If the Gemini API call fails, return an empty array of suggestions.
    return [];
  }
}

// Export the function so it can be used in other files
module.exports = {
  generateGeminiSuggestions
};