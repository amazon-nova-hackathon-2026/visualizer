"use client";
import SearchBar from '@/components/SearchBar';
import Image from 'next/image';

export default function Home() {
  return (
    <div style={styles.container}>
      <Image
        src="/thinkova.png"
        alt="ThinkOva — Ask a question. Watch the web teach you."
        width={900}
        height={500}
        style={styles.heroImage}
        priority
      />
      <SearchBar />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#0a0f1e',
    padding: '40px 24px',
    gap: '40px',
  },
  heroImage: {
    width: '100%',
    maxWidth: '900px',
    height: 'auto',
    borderRadius: '16px',
  },
};