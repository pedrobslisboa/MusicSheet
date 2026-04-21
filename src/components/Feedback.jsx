export function Feedback({ msg, type }) {
  return (
    <div className={`feedback${type ? ` ${type}` : ''}`}>
      {msg}
    </div>
  )
}
