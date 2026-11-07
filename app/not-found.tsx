import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container stack gap-16" style={{ paddingTop: 64, paddingBottom: 72, alignItems: 'flex-start' }}>
      <h1 className="page-title">Такой страницы нет</h1>
      <p className="muted">Возможно, скрипт ещё на проверке или был удалён автором.</p>
      <Link href="/" className="btn btn-primary">На главную</Link>
    </div>
  )
}
