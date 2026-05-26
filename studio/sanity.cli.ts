import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'ucdyt6y8',
    dataset: 'production',
  },
  deployment: {
    appId: 'fnj0lojbcfzpvbpr5dyv1lal',
    autoUpdates: true,
  },
})
