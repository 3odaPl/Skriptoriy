import LoginButton from './LoginButton'

export default function LoginRequired({ text }: { text: string }) {
  return (
    <div className="container stack gap-16" style={{ paddingTop: 48, paddingBottom: 72, alignItems: 'flex-start', maxWidth: 640 }}>
      <h1 className="page-title">Нужно войти</h1>
      <p className="muted">{text}</p>
      <LoginButton />
    </div>
  )
}
