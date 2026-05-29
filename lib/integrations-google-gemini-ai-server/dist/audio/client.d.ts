import { googleGemini } from "../client";
export { googleGemini };
import { Buffer } from "node:buffer";
export type AudioFormat = "wav" | "mp3" | "webm" | "mp4" | "ogg" | "unknown";
/**
 * Detect audio format from buffer magic bytes.
 */
export declare function detectAudioFormat(buffer: Buffer): AudioFormat;
/**
 * Convert any audio/video format to WAV using ffmpeg.
 */
export declare function convertToWav(audioBuffer: Buffer): Promise<Buffer>;
/**
 * Auto-detect and convert audio to a compatible format.
 */
export declare function ensureCompatibleFormat(audioBuffer: Buffer): Promise<{
    buffer: Buffer;
    format: "wav" | "mp3";
}>;
/** Voice Chat: audio-in, audio-out using Gemini. */
export declare function voiceChat(audioBuffer: Buffer, voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer", inputFormat?: "wav" | "mp3", outputFormat?: "wav" | "mp3"): Promise<{
    transcript: string;
    audioResponse: Buffer;
}>;
/** Streaming Voice Chat for real-time audio responses. */
export declare function voiceChatStream(audioBuffer: Buffer, voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer", inputFormat?: "wav" | "mp3"): Promise<AsyncIterable<{
    type: "transcript" | "audio";
    data: string;
}>>;
/** Text-to-Speech using Gemini. */
export declare function textToSpeech(text: string, voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer", format?: "wav" | "mp3" | "flac" | "opus" | "pcm16"): Promise<Buffer>;
/** Streaming Text-to-Speech. */
export declare function textToSpeechStream(text: string, voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"): Promise<AsyncIterable<string>>;
/** Speech-to-Text. */
export declare function speechToText(audioBuffer: Buffer, format?: "wav" | "mp3" | "webm"): Promise<string>;
/** Streaming Speech-to-Text. */
export declare function speechToTextStream(audioBuffer: Buffer, format?: "wav" | "mp3" | "webm"): Promise<AsyncIterable<string>>;
//# sourceMappingURL=client.d.ts.map