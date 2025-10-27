
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Scene, ScriptScene } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateScript = async (topic: string): Promise<ScriptScene[]> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: `You are an expert educational video creator. Create a short, engaging script for an explainer video in Hindi about the topic: "${topic}". The script should be structured for a 45-90 second video. Break the script down into 5 to 8 short scenes. The tone should be friendly and knowledgeable. The script must be in Hindi. Structure the output as a JSON object. Start with an intro title, explain the key concept with simple examples, and end with a motivational or summary line.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    scenes: {
                        type: Type.ARRAY,
                        description: 'An array of scenes for the video. Should be between 5 and 8 scenes.',
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                script: {
                                    type: Type.STRING,
                                    description: 'The Hindi voice-over script for this scene. Should be a short sentence.',
                                },
                                visual_prompt: {
                                    type: Type.STRING,
                                    description: 'A simple English description for a visually appealing, educational, and minimalist image to be generated for this scene.',
                                },
                            },
                            required: ["script", "visual_prompt"],
                        },
                    },
                },
                required: ["scenes"],
            },
        },
    });

    const parsed = JSON.parse(response.text);
    return parsed.scenes;
};

const generateImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `${prompt}, minimalist educational illustration, clean background, visually appealing`,
        config: {
            numberOfImages: 1,
            aspectRatio: '16:9',
            outputMimeType: 'image/jpeg',
        },
    });
    return response.generatedImages[0].image.imageBytes;
};

const generateSpeech = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
        throw new Error("Failed to generate speech: no audio data received.");
    }
    return audioData;
};

const base64ToBlob = (base64: string, contentType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
};

export const createVideoAssets = async (
    topic: string,
    updateProgress: (message: string) => void
): Promise<Scene[]> => {
    updateProgress('1/4: Generating video script...');
    const scriptScenes = await generateScript(topic);
    if (!scriptScenes || scriptScenes.length === 0) {
        throw new Error("Failed to generate a valid script.");
    }

    updateProgress(`2/4: Generating ${scriptScenes.length} images...`);
    const imagePromises = scriptScenes.map(scene => generateImage(scene.visual_prompt));
    const base64Images = await Promise.all(imagePromises);

    updateProgress(`3/4: Synthesizing ${scriptScenes.length} audio clips...`);
    const audioPromises = scriptScenes.map(scene => generateSpeech(scene.script));
    const base64Audios = await Promise.all(audioPromises);

    updateProgress('4/4: Assembling your video...');
    const finalScenes: Scene[] = scriptScenes.map((scene, index) => {
        const audioBlob = base64ToBlob(base64Audios[index], 'audio/mpeg');
        const audioUrl = URL.createObjectURL(audioBlob);

        return {
            ...scene,
            imageUrl: `data:image/jpeg;base64,${base64Images[index]}`,
            audioUrl: audioUrl,
        };
    });

    return finalScenes;
};
