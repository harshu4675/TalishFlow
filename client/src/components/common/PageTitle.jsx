import { useEffect } from 'react'
import { APP_NAME } from '@/utils/constants'

export default function PageTitle({ title }) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
    return () => {
      document.title = APP_NAME
    }
  }, [title])

  return null
}