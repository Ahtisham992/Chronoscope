import styles from "./page.module.css";
import { DomainForm } from "./components/DomainForm";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Chronoscope</h1>
        <p className={styles.subtitle}>Watch any website live its whole life, in one shot.</p>
        <DomainForm />
      </main>
    </div>
  );
}
