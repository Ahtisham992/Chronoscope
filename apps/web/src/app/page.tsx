'use client';

import { useState } from 'react';
import styles from './page.module.css';
import DomainForm from './components/DomainForm';
import FeaturedGallery from './components/FeaturedGallery';

export default function Home() {
  const [selectedDomain, setSelectedDomain] = useState<string>('');

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Chronoscope</h1>
        <p className={styles.subtitle}>
          Watch any website live its whole life, in one shot. 
          Enter a domain to generate a playable timelapse of its history.
        </p>
      </div>
      
      <div className={styles.formContainer}>
        <DomainForm prefillDomain={selectedDomain} />
      </div>

      <FeaturedGallery onSelect={setSelectedDomain} />
    </main>
  );
}
