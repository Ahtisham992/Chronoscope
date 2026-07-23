'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import DualVideoPlayer from '../components/DualVideoPlayer';

export default function ComparePage() {
  const [domain1, setDomain1] = useState('');
  const [domain2, setDomain2] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [status1, setStatus1] = useState<string | null>(null);
  const [status2, setStatus2] = useState<string | null>(null);
  const [videoUrl1, setVideoUrl1] = useState<string | null>(null);
  const [videoUrl2, setVideoUrl2] = useState<string | null>(null);

  const cleanDomain = (d: string) => {
    let clean = d.trim().toLowerCase();
    if (clean.startsWith('http')) {
      try {
        clean = new URL(clean).hostname;
      } catch(e) {}
    }
    return clean;
  };

  const startJob = async (d: string) => {
    const res = await fetch(`http://localhost:4000/api/domain/${d}/render`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to start job for ${d}`);
    return res.json();
  };

  const pollStatus = async (d: string, setStatus: (s: string) => void, setUrl: (u: string) => void) => {
    try {
      const res = await fetch(`http://localhost:4000/api/domain/${d}/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
        if (data.status === 'done' && data.videoUrl) {
          setUrl(data.videoUrl);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompare = async () => {
    const d1 = cleanDomain(domain1);
    const d2 = cleanDomain(domain2);
    if (!d1 || !d2) return;

    setIsSubmitting(true);
    setError(null);
    setStatus1('pending');
    setStatus2('pending');

    try {
      await Promise.all([startJob(d1), startJob(d2)]);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if ((status1 && status1 !== 'done' && status1 !== 'failed') || 
        (status2 && status2 !== 'done' && status2 !== 'failed')) {
      
      interval = setInterval(() => {
        const d1 = cleanDomain(domain1);
        const d2 = cleanDomain(domain2);
        if (status1 !== 'done' && status1 !== 'failed') pollStatus(d1, setStatus1, setVideoUrl1);
        if (status2 !== 'done' && status2 !== 'failed') pollStatus(d2, setStatus2, setVideoUrl2);
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status1, status2, domain1, domain2]);

  const bothReady = status1 === 'done' && status2 === 'done' && videoUrl1 && videoUrl2;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Compare History</h1>
      
      {!bothReady ? (
        <>
          <div className={styles.inputs}>
            <input 
              className={styles.input} 
              placeholder="e.g. google.com" 
              value={domain1} 
              onChange={e => setDomain1(e.target.value)} 
              disabled={isSubmitting}
            />
            <span className={styles.vs}>VS</span>
            <input 
              className={styles.input} 
              placeholder="e.g. yahoo.com" 
              value={domain2} 
              onChange={e => setDomain2(e.target.value)} 
              disabled={isSubmitting}
            />
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <button 
              className={styles.btn} 
              onClick={handleCompare}
              disabled={!domain1 || !domain2 || isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Compare Domains'}
            </button>
          </div>

          {(status1 || status2) && (
            <div className={styles.statusArea}>
              <p>{domain1} status: <strong>{status1}</strong></p>
              <p>{domain2} status: <strong>{status2}</strong></p>
            </div>
          )}

          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        </>
      ) : (
        <div className={styles.videosContainer}>
          <DualVideoPlayer 
            src1={`http://localhost:4000${videoUrl1}`} 
            src2={`http://localhost:4000${videoUrl2}`} 
            domain1={cleanDomain(domain1)}
            domain2={cleanDomain(domain2)}
          />
        </div>
      )}
    </div>
  );
}
