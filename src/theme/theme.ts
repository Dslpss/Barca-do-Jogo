export const theme = {
  colors: {
    primary: '#185a9d',
    secondary: '#43a2e3',
    background: '#f0f2f5',
    card: '#ffffff',
    text: '#333333',
    textSecondary: '#777777',
    white: '#ffffff',
    black: '#000000',
    error: '#e74c3c',
    success: '#2ecc71',
    border: '#dddddd',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
    },
    h3: {
      fontSize: 18,
      fontWeight: '700' as const,
    },
    body: {
      fontSize: 16,
    },
    caption: {
      fontSize: 12,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
    },
    label: {
      fontSize: 14,
      fontWeight: '500' as const,
    },
  },
  components: {
    button: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    input: {
      borderWidth: 1,
      borderColor: '#dddddd',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 16,
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 5,
    },
  },
};