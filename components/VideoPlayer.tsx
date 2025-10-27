
import React, { useState, useEffect, useRef } from 'react';
import type { Scene } from '../types';
import { BACKGROUND_MUSIC_URL } from '../constants';

interface VideoPlayerProps {
  scenes: Scene[];
  onReplay: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ scenes, onReplay }) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Cleanup blob URLs on unmount
    return () => {
      scenes.forEach(scene => URL.revokeObjectURL(scene.audioUrl));
    };
  }, [scenes]);

  useEffect(() => {
    if (isFinished) {
      setIsPlaying(false);
      if(musicRef.current) musicRef.current.pause();
      return;
    }

    if (isPlaying) {
      if(musicRef.current) {
        musicRef.current.volume = 0.1;
        musicRef.current.play();
      }

      const sceneAudio = new Audio(scenes[currentSceneIndex].audioUrl);
      audioRef.current = sceneAudio;
      
      sceneAudio.play();

      const handleAudioEnd = () => {
        if (currentSceneIndex < scenes.length - 1) {
          setCurrentSceneIndex(prevIndex => prevIndex + 1);
        } else {
          setIsFinished(true);
        }
      };

      sceneAudio.addEventListener('ended', handleAudioEnd);

      return () => {
        sceneAudio.removeEventListener('ended', handleAudioEnd);
        sceneAudio.pause();
      };
    } else {
      if (audioRef.current) audioRef.current.pause();
      if(musicRef.current) musicRef.current.pause();
    }
  }, [isPlaying, currentSceneIndex, scenes, isFinished]);

  const handlePlayPause = () => {
    if (isFinished) {
      setIsFinished(false);
      setCurrentSceneIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(prev => !prev);
    }
  };
  
  const currentScene = scenes[currentSceneIndex];

  return (
    <div className="w-full max-w-4xl mx-auto bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700">
      <div className="relative w-full aspect-video">
        <audio ref={musicRef} src={BACKGROUND_MUSIC_URL} loop />
        {scenes.map((scene, index) => (
          <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSceneIndex ? 'opacity-100' : 'opacity-0'}`}>
            <img src={scene.imageUrl} alt={scene.visual_prompt} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            <p className="absolute bottom-4 left-4 right-4 text-center text-xl md:text-2xl font-bold p-4 bg-black/50 rounded-lg text-shadow">
              {scene.script}
            </p>
          </div>
        ))}
         {isFinished && (
           <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
              <h2 className="text-4xl font-bold mb-4">Video Finished!</h2>
           </div>
         )}
      </div>

      <div className="bg-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={handlePlayPause} className="p-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 transition-colors">
            {isPlaying && !isFinished ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
          </button>
          <span className="text-sm text-slate-400">{currentSceneIndex + 1} / {scenes.length}</span>
        </div>
        <button onClick={onReplay} className="text-sm font-semibold text-cyan-400 hover:text-cyan-300">
          Create New Video
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;
