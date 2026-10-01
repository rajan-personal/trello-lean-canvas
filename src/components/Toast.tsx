export function Toast({ notice }: { notice: string }) {
  return (
    <div
      className="toast fixed bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-120 max-w-[min(420px,calc(100vw-36px))] rounded-[7px] bg-[#172b4d] px-[15px] py-[11px] text-sm wrap-anywhere text-white shadow-[0_6px_18px_rgba(9,30,66,0.3)] empty:p-0"
      role="status"
      aria-atomic="true"
    >
      {notice}
    </div>
  )
}
