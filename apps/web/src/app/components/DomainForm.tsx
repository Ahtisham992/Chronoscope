'use client';

import { useState, useEffect } from 'react';
import styles from './DomainForm.module.css';

type StatusResponse = {
  domain: string;
  status: 'pending' | 'rendering' | 'stitching' | 'done' | 'failed';
  totalSnapshots: number;
  renderedFrames: number;
  videoUrl?: string | null;
};

export default function DomainForm() {
  const [domain, setDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [jobState, setJobState] = useState<StatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setIsSubmitting(true);
    setError(null);

    // Basic domain validation
    let cleanDomain = domain.trim().toLowerCase();
    if (cleanDomain.startsWith('http://') || cleanDomain.startsWith('https://')) {
      cleanDomain = new URL(cleanDomain).hostname;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/domain/${cleanDomain}/render`, {
        method: 'POST'
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start generation');
      }

      // Initialize polling
      setJobState({
        domain: cleanDomain,
        status: 'pending',
        totalSnapshots: 0,
        renderedFrames: 0
      });
      setIsPolling(true);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const pollStatus = async () => {
      if (!jobState?.domain) return;
      
      try {
        const res = await fetch(`http://localhost:4000/api/domain/${jobState.domain}/status`);
        const data: StatusResponse = await res.json();
        
        if (res.ok) {
          setJobState(data);
          
          if (data.status === 'done' || data.status === 'failed') {
            setIsPolling(false);
          }
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    };

    if (isPolling) {
      pollInterval = setInterval(pollStatus, 2000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isPolling, jobState?.domain]);

  const getStatusMessage = () => {
    if (!jobState) return '';
    switch (jobState.status) {
      case 'pending': return 'Waiting in queue...';
      case 'rendering': return `Rendering frames with Playwright... (${jobState.renderedFrames} / ${jobState.totalSnapshots || 5})`;
      case 'stitching': return 'Stitching frames into video via FFmpeg...';
      case 'done': return 'Video generated successfully!';
      case 'failed': return 'Failed to generate video.';
      default: return 'Processing...';
    }
  };

  return (
    <div className={`glass-card ${styles.container}`}>
      {!jobState ? (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              placeholder="e.g. apple.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className={styles.input}
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          <button type="submit" disabled={isSubmitting || !domain.trim()} className={styles.button}>
            {isSubmitting ? 'Starting...' : 'Generate Timelapse'}
          </button>
        </form>
      ) : (
        <div className={styles.statusContainer}>
          <div className={`${styles.statusBadge} ${styles[jobState.status]}`}>
            {jobState.status}
          </div>
          
          <p className={styles.statusText}>{getStatusMessage()}</p>
          
          {(jobState.status === 'pending' || jobState.status === 'rendering' || jobState.status === 'stitching') && (
            <span className={styles.loader}></span>
          )}

          {jobState.status === 'done' && jobState.videoUrl && (
            <div className={styles.videoContainer}>
              <video 
                className={styles.video} 
                src={`http://localhost:4000${jobState.videoUrl}`} 
                controls 
                autoPlay 
                loop 
                playsInline
              />
            </div>
          )}
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
