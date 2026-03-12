"use client";
import SearchBar from '@/components/SearchBar';

export default function Home() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Visualizer</h1>
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
    height: '100vh',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: '3.5rem',
    fontWeight: '700',
    letterSpacing: '-1px',
    marginBottom: '2rem',
    color: '#202124',
  }
};
