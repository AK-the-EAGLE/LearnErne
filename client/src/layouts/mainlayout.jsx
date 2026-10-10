import StickyHeader from '../components/StickyHeader'
import ApiStatusIndicator from '../components/ApiStatusIndicator'
import { Outlet } from 'react-router-dom'

export default function MainLayout() {
  return (
    <>
      <StickyHeader />
      <Outlet />
      <ApiStatusIndicator />
    </>
  )
}

