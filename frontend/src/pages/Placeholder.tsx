export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="card p-10 text-neutral-300">
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p>這個分頁先保留，之後再實作內容。</p>
    </div>
  )
}
