import React, { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Sayfa açılınca tercihi hatırla
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        background: isDark ? '#334155' : '#fbbf24', // Koyu gri veya Güneş sarısı
        color: isDark ? '#fbbf24' : '#fff',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        zIndex: 999999, // Her şeyin üstünde
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        transition: 'all 0.3s ease',
        transform: isDark ? 'rotate(360deg)' : 'rotate(0deg)'
      }}
      title={isDark ? "Gündüz Moduna Geç" : "Gece Moduna Geç"}
    >
      {isDark ? '🌙' : '☀️'}
    </button>
  );
}