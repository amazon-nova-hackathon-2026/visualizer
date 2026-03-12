"use client";

export default function VideoPanel() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.screen}>
        <p style={styles.placeholder}>Video Feed</p>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: '100%',
    backgroundColor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: '1px solid #333',
  },
  screen: {
    width: '60%',
    aspectRatio: '16/9',
    backgroundColor: '#111',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    color: '#666',
    fontSize: '1rem',
  }
};