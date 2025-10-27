
import React, { useState } from 'react';
import type { Scene } from './types';
import { createVideoAssets } from './services/geminiService';
import Loader from './components/Loader';
import VideoPlayer from './components/VideoPlayer';

const App: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [videoScenes, setVideoScenes] = useState<Scene[] | null>(null);

  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isLoading) return;

    setIsLoading(true);
    setVideoScenes(null);
    setError(null);

    try {
      const scenes = await createVideoAssets(topic, setLoadingMessage);
      setVideoScenes(scenes);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to create video. ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleReplay = () => {
    setVideoScenes(null);
    setTopic('');
    setError(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return <Loader message={loadingMessage} />;
    }
    if (error) {
      return (
        <div className="text-center p-8 bg-red-900/50 border border-red-500 rounded-lg">
          <h3 className="text-xl font-bold text-red-300 mb-2">Oops! Something went wrong.</h3>
          <p className="text-red-400">{error}</p>
          <button onClick={handleReplay} className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors">
            Try Again
          </button>
        </div>
      );
    }
    if (videoScenes) {
      return <VideoPlayer scenes={videoScenes} onReplay={handleReplay} />;
    }
    return (
      <div className="w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center mb-2 text-slate-100">AI Hindi Explainer Video</h2>
        <p className="text-center text-slate-400 mb-8">Enter any topic and our AI will create a short educational video for you.</p>
        <form onSubmit={handleGenerateVideo} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., न्यूटन के गति के नियम"
            className="flex-grow bg-slate-800 border-2 border-slate-700 rounded-md px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !topic.trim()} 
            className="bg-cyan-600 text-white font-bold py-3 px-6 rounded-md hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300 shadow-lg shadow-cyan-900/50"
          >
            Create Video
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="absolute top-0 left-0 p-6">
        <h1 className="text-2xl font-bold text-slate-300">Vidya<span className="text-cyan-400">AI</span></h1>
      </header>
      <main className="flex items-center justify-center w-full">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
