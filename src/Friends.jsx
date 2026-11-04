import { useEffect, useRef, useState } from 'react'
import { addDoc, collection, doc, getDocs, limit, limitToLast, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'

function Chat({ id, user, name, peer }) {
  const [msgs, setMsgs] = useState([])
  const [t, setT] = useState('')
  const box = useRef(null)
  useEffect(() => onSnapshot(query(collection(db, 'chats', id, 'messages'), orderBy('createdAt', 'asc'), limitToLast(80)),
    s => setMsgs(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {}), [id])
  useEffect(() => { box.current?.scrollTo(0, 1e9) }, [msgs])
  async function send(e) {
    e.preventDefault()
    const text = t.trim()
    if (!text) return
    setT('')
    addDoc(collection(db, 'chats', id, 'messages'), { senderId: user.uid, senderName: name, text: text.slice(0, 500), createdAt: serverTimestamp() }).catch(() => setT(text))
  }
  return (
    <div className="card chat">
      <h3>Chat with {peer}</h3>
      <div className="msgs" ref={box} aria-live="polite">
        {msgs.length === 0 && <p className="muted">Say hi 👋</p>}
        {msgs.map(m => <div key={m.id} className={'bubble' + (m.senderId === user.uid ? ' mine' : '')}>{m.text}</div>)}
      </div>
      <form className="send" onSubmit={send}>
        <input className="field" value={t} onChange={e => setT(e.target.value)} placeholder="Message…" maxLength={500} aria-label="Message" />
        <button className="btn primary">Send</button>
      </form>
    </div>
  )
}

export default function Friends({ user, name, friends, requests }) {
  const [q, setQ] = useState('')
  const [res, setRes] = useState(null)
  const [note, setNote] = useState('')
  const [active, setActive] = useState(null)

  async function search(e) {
    e.preventDefault(); setNote('')
    const s = await getDocs(query(collection(db, 'users'), where('name', '>=', q), where('name', '<=', q + '\uf8ff'), limit(8))).catch(() => null)
    setRes(s ? s.docs.filter(d => d.id !== user.uid).map(d => ({ id: d.id, ...d.data() })) : [])
  }
  async function send(to) {
    setNote('')
    try { await setDoc(doc(db, 'friendRequests', `${user.uid}_${to.id}`), { senderId: user.uid, recipientId: to.id, senderName: name, status: 'pending', ts: Date.now() }); setNote(`Request sent to ${to.name}.`) }
    catch { setNote('Request already sent or not allowed.') }
  }
  async function accept(r) {
    const members = [r.senderId, user.uid].sort()
    const b = writeBatch(db)
    b.update(doc(db, 'friendRequests', r.id), { status: 'accepted' })
    b.set(doc(db, 'friendships', members.join('_')), { members, names: { [r.senderId]: r.senderName, [user.uid]: name }, ts: Date.now() })
    await b.commit().catch(() => setNote('Could not accept — check Firestore rules.'))
  }
  const decline = r => updateDoc(doc(db, 'friendRequests', r.id), { status: 'declined' })
  const act = friends.find(f => f.id === active)

  return (
    <div className="grid">
      <div className="card">
        <h3>Find friends</h3>
        <form className="send" onSubmit={search}>
          <input className="field" value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name (case-sensitive)" aria-label="Search users" />
          <button className="btn">Search</button>
        </form>
        {res && res.length === 0 && <p className="muted">No users found.</p>}
        {res?.map(u => <div className="row" key={u.id}><span className="grow">{u.name}</span><button className="tiny" onClick={() => send(u)}>Add</button></div>)}
        {note && <p className="small mint" role="status">{note}</p>}
      </div>
      <div className="card">
        <h3>Requests <span className="pill">{requests.length}</span></h3>
        {requests.length === 0 && <p className="muted">No pending requests.</p>}
        {requests.map(r => <div className="row" key={r.id}><span className="grow">{r.senderName}</span><button className="tiny" onClick={() => accept(r)}>Accept</button><button className="tiny" onClick={() => decline(r)}>Decline</button></div>)}
      </div>
      <div className="card">
        <h3>Friends <span className="pill">{friends.length}</span></h3>
        {friends.length === 0 && <p className="muted">Add a friend to chat and join challenges together.</p>}
        {friends.map(f => <div className="row" key={f.id}><span className="grow">{f.name}</span><button className="tiny" onClick={() => setActive(f.id)}>Chat</button><button className="tiny" onClick={() => deleteDoc(doc(db, 'friendships', f.id)).then(() => active === f.id && setActive(null))}>Remove</button></div>)}
      </div>
      {act && <Chat key={act.id} id={act.id} user={user} name={name} peer={act.name} />}
    </div>
  )
}
