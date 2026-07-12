type ToastProps = {
  message: string
  visible: boolean
}

export function Toast({ message, visible }: ToastProps) {
  return (
    <div className={`toast${visible ? ' toast--visible' : ''}`} role="status" aria-live="polite">
      <span aria-hidden="true">◉</span>
      {message}
    </div>
  )
}
