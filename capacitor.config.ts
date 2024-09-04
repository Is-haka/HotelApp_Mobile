import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fabiodev.hotelapp',
  appName: 'hotel-app',
  webDir: 'dist/hotel-app/browser',
  server: {
    androidScheme: 'http',
  },
};

export default config;
