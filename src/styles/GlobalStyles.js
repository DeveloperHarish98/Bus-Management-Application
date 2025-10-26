import { GlobalStyles as MuiGlobalStyles } from '@mui/material';

const GlobalStyles = () => {
  return (
    <MuiGlobalStyles
      styles={{
        '*': {
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        },
        'html, body, #root': {
          height: '100%',
          width: '100%',
          scrollBehavior: 'smooth',
        },
        body: {
          fontFamily: 'Inter, sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          backgroundAttachment: 'fixed',
          color: '#1E293B',
          lineHeight: 1.6,
          overflowX: 'hidden',
        },
        'h1, h2, h3, h4, h5, h6': {
          fontWeight: 700,
          lineHeight: 1.2,
          margin: '1.5rem 0 1rem',
        },
        'p, li, span': {
          color: '#475569',
        },
        a: {
          textDecoration: 'none',
          color: 'inherit',
          transition: 'all 0.3s ease',
        },
        'a:hover': {
          color: '#4F46E5',
        },
        'img': {
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
        },
        '.cursive-text': {
          fontFamily: '"Dancing Script", cursive',
          fontWeight: 700,
          background: 'linear-gradient(90deg, #6366F1, #EC4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-block',
        },
        '.glass-card': {
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.15)',
          },
        },
        '.gradient-text': {
          background: 'linear-gradient(90deg, #6366F1, #EC4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        },
      }}
    />
  );
};

export default GlobalStyles;
