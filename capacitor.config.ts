import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'games.wenzi.yunyin',
  appName: '云隐修仙录',
  webDir: 'dist',
  server: {
    url: 'https://yunyin.wenzi.games',
    cleartext: false
  },
  android: {
    allowMixedContent: false
  }
}

export default config
