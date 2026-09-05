export function SyncError({ message }: { message: string }) {
  return (
    <p
      className="fixed bottom-4 left-1/2 z-50 w-max max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-lg bg-[#ae2e24] px-4 py-2 text-sm font-semibold wrap-anywhere text-white shadow-xl"
      role="alert"
    >
      {message}
    </p>
  )
}
