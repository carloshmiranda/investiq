import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.accrue.invest',
  appName: 'Accrue',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
