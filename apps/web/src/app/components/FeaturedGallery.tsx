'use client';

import { useEffect, useState } from 'react';
import styles from './FeaturedGallery.module.css';

interface Domain {
  id: number;
  hostname: string;
  status: string;
}

interface FeaturedGalleryProps {
  onSelect: (domain: string) => void;
}

export default function FeaturedGallery({ onSelect }: FeaturedGalleryProps) {
  const [featured, setFeatured] = useState<Domain[]>([]);

  useEffect(() => {
    fetch('http://localhost:4000/api/featured')
      .then(res => res.json())
      .then(data => {
        if (data.domains) {
          setFeatured(data.domains);
        }
      })
      .catch(err => console.error('Failed to fetch featured domains:', err));
  }, []);

  if (featured.length === 0) return null;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Featured Timelapses</h2>
      <div className={styles.grid}>
        {featured.map(domain => (
          <div 
            key={domain.id} 
            className={styles.card}
            onClick={() => onSelect(domain.hostname)}
          >
            <div className={styles.hostname}>{domain.hostname}</div>
            <div className={styles.status}>Ready to play</div>
          </div>
        ))}
      </div>
    </div>
  );
}
