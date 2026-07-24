'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  src: string;
  domain: string;
}

export default function VideoPlayer({ src, domain }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    if (mediaQuery.matches) {
      setIsPlaying(false);
    }
  }, []);

  // Simulated year calculation (1998 - 2024 based on progress)
  const currentYear = Math.floor(1998 + (progress / 100) * (2024 - 1998));

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      togglePlay();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      if (total) {
        setProgress((current / total) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (videoRef.current && duration) {
      const newTime = (value / 100) * duration;
      videoRef.current.currentTime = newTime;
      setProgress(value);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={styles.playerContainer}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Video Player"
    >
      <video
        ref={videoRef}
        src={src}
        className={styles.video}
        autoPlay={!reducedMotion}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        aria-hidden="true"
      />
      
      <div className={styles.yearOverlay} aria-live="polite">
        {isNaN(currentYear) ? 1998 : currentYear}
      </div>

      <div className={styles.controlsOverlay}>
        <div className={styles.scrubberContainer}>
          <div className={styles.scrubberProgress} style={{ width: `${progress}%` }} />
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            onChange={handleScrub}
            className={styles.scrubberInput}
            aria-label="Timeline scrubber"
            aria-valuetext={`Year ${isNaN(currentYear) ? 1998 : currentYear}`}
          />
        </div>
        
        <div className={styles.bottomControls}>
          <button 
            className={styles.playPauseBtn} 
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause timelapse' : 'Play timelapse'}
          >
            {isPlaying ? (
              // Pause Icon
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              // Play Icon
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          
          <div className={styles.timeDisplay} aria-hidden="true">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          <div className={styles.attribution}>
            Historical data via the Internet Archive's Wayback Machine.
          </div>
          <div className={styles.exportControls}>
            <button 
              className={styles.exportBtn}
              onClick={() => window.location.href = `http://localhost:4000/api/export/${domain}/mp4`}
              aria-label="Export as MP4"
            >
              Export MP4
            </button>
            <button 
              className={styles.exportBtn}
              onClick={() => window.location.href = `http://localhost:4000/api/export/${domain}/gif`}
              aria-label="Export as GIF"
            >
              Export GIF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
