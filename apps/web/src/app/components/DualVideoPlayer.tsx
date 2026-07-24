'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './DualVideoPlayer.module.css';

interface DualVideoPlayerProps {
  src1: string;
  src2: string;
  domain1: string;
  domain2: string;
}

export default function DualVideoPlayer({ src1, src2, domain1, domain2 }: DualVideoPlayerProps) {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  
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

  const togglePlay = () => {
    if (video1Ref.current && video2Ref.current) {
      if (isPlaying) {
        video1Ref.current.pause();
        video2Ref.current.pause();
      } else {
        video1Ref.current.play();
        video2Ref.current.play();
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
    // We only need to drive the progress bar from one video (video1)
    if (video1Ref.current) {
      const current = video1Ref.current.currentTime;
      const total = video1Ref.current.duration;
      setCurrentTime(current);
      if (total) {
        setProgress((current / total) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    // Assume duration is driven by video1 (or take max of both)
    if (video1Ref.current) {
      setDuration(video1Ref.current.duration);
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setProgress(value);
    
    if (video1Ref.current && video2Ref.current && duration) {
      const newTime = (value / 100) * duration;
      // Force sync both videos to the exact same time
      video1Ref.current.currentTime = newTime;
      video2Ref.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Simulated year calculation (1998 - 2024 based on progress)
  const currentYear = Math.floor(1998 + (progress / 100) * (2024 - 1998));

  return (
    <div 
      className={styles.dualPlayerContainer}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Comparison Video Player"
    >
      <div className={styles.videoRow}>
        <div className={styles.videoWrapper}>
          <div className={styles.domainLabel} aria-hidden="true">{domain1}</div>
          <video
            ref={video1Ref}
            src={src1}
            className={styles.video}
            autoPlay={!reducedMotion}
            playsInline
            muted
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            aria-label={`${domain1} timelapse`}
          />
        </div>
        
        <div className={styles.videoWrapper}>
          <div className={styles.domainLabel} aria-hidden="true">{domain2}</div>
          <video
            ref={video2Ref}
            src={src2}
            className={styles.video}
            autoPlay={!reducedMotion}
            playsInline
            muted
            aria-label={`${domain2} timelapse`}
          />
        </div>
      </div>

      <div className={styles.unifiedControls}>
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
        
        <div className={styles.bottomBar}>
          <button 
            className={styles.playPauseBtn} 
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause comparison' : 'Play comparison'}
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
        </div>
      </div>
    </div>
  );
}
