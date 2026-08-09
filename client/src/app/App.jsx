import AppRouter from './Router'
import Providers from './Providers'
import NotificationSystem from '@/components/common/NotificationSystem'
import UploadModal from '@/features/upload/components/UploadModal'

export default function App() {
  return (
    <Providers>
      <AppRouter />
      <UploadModal />
      <NotificationSystem />
    </Providers>
  )
}
