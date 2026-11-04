import { Component, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import AuthScreen from './AuthScreen'
import Dashboard from './Dashboard'

class Boundary extends Component {
  state = { e: null }
  static getDerivedStateFromError(e) { return { e } }
  render() {
    return this.state.e
      ? <div className="boot"><div className="card"><h3>Something went wrong</h3><p className="muted">{String(this.state.e.message)}</p><button className="btn primary" onClick={() => location.reload()}>Reload</button></div></div>
      : this.props.children
  }
}

export default function App() {
  const [user, setUser] = useState(undefined)
  useEffect(() => onAuthStateChanged(auth, setUser), [])
  if (user === undefined) return <div className="boot"><div className="spinner" /></div>
  return <Boundary>{user ? <Dashboard user={user} /> : <AuthScreen />}</Boundary>
}
