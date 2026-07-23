import styles from './page.module.css';
import DomainForm from './components/DomainForm';

export default function Home() {
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
        <DomainForm />
      </div>
    </main>
  );
}
