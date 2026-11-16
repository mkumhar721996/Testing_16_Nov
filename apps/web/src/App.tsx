import { DashboardPage } from './dashboard/DashboardPage'

// Sign-in is owned by another story; until a session exists the signed-in user is a placeholder.
const SIGNED_IN_USER = { name: 'Signed-in user', email: 'user@example.com' }

export default function App() {
  return <DashboardPage user={SIGNED_IN_USER} />
}
