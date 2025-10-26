import { createTheme } from '@mui/material/styles';

// Modern glassmorphism theme with premium aesthetics
const theme = createTheme({
  palette: {
    primary: {
      main: '#6366F1', // Indigo
      light: '#818CF8',
      dark: '#4F46E5',
    },
    secondary: {
      main: '#EC4899', // Pink
      light: '#F472B6',
      dark: '#DB2777',
    },
    background: {
      default: '#F8FAFC', // Light slate
      paper: 'rgba(255, 255, 255, 0.8)',
    },
    text: {
      primary: '#1E293B', // Slate 800
      secondary: '#64748B', // Slate 500
    },
    error: {
      main: '#EF4444',
    },
    success: {
      main: '#10B981',
    },
  },
  typography: {
    fontFamily: [
      'Inter', 
      '-apple-system', 
      'BlinkMacSystemFont',
      'sans-serif'
    ].join(','),
    h1: {
      fontSize: '3.5rem',
      fontWeight: 800,
      background: 'linear-gradient(90deg, #6366F1, #EC4899)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '1rem',
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#1E293B',
      marginBottom: '1.5rem',
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 600,
      color: '#1E293B',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#334155',
    },
    subtitle1: {
      fontSize: '1.25rem',
      color: '#64748B',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
    cursive: {
      fontFamily: '"Dancing Script", cursive',
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '::selection': {
          background: 'rgba(99, 102, 241, 0.2)',
        },
        '::-webkit-scrollbar': {
          width: '10px',
          height: '10px',
        },
        '::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '10px',
        },
        '::-webkit-scrollbar-thumb': {
          background: '#c7d2fe',
          borderRadius: '10px',
          '&:hover': {
            background: '#a5b4fc',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '12px 28px',
          fontWeight: 600,
          textTransform: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(8px)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          color: 'white',
          boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            boxShadow: '0 6px 20px 0 rgba(99, 102, 241, 0.4)',
          },
        },
        outlined: {
          border: '2px solid',
          borderColor: 'rgba(99, 102, 241, 0.5)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
            borderColor: '#6366F1',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.15)',
          },
        },
        elevation1: {
          boxShadow: '0 4px 20px 0 rgba(31, 38, 135, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '& fieldset': {
              borderColor: 'rgba(203, 213, 225, 0.5)',
              transition: 'all 0.3s ease',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(99, 102, 241, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6366F1',
              boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)',
            },
          },
          '& label.Mui-focused': {
            color: '#6366F1',
          },
        },
      },
    },
  },
});

export default theme;
