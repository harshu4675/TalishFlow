import AppRouter from './Router'
import Providers from './Providers'
import NotificationSystem from '@/components/feedback/NotificationSystem'
import CreateDialog from '@/features/upload/components/CreateDialog'

export default function App() {
  return (
    <Providers>
      <AppRouter />
      <CreateDialog />
      <NotificationSystem />
    </Providers>
  )
}
