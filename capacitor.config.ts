import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.motorwaypetroleum.fuelpro',
  appName: 'FuelPro',
  webDir: 'dist',

  android: {
    backgroundColor: '#0A0F1E',
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,    // DISABLE in production
    loggingBehavior: 'none',
  },

  server: {
    androidScheme: 'https',
    cleartext: false,                       // no HTTP
  },

  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0A0F1E',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0A0F1E',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
      scrollAssist: true,
    },
    NavigationBar: {
      backgroundColor: '#0A0F1E',  // Android bottom bar
      darkButtons: false,
    },
    Haptics: {
      // enabled by default
    },
  },
};
export default config;
