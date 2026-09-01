export function Toast({ notice }: { notice: string }) {
  return notice ? (
    <div
      className="toast fixed right-[18px] bottom-[18px] z-120 max-w-[min(420px,calc(100vw-36px))] rounded-[7px] bg-[#172b4d] px-[15px] py-[11px] text-sm text-white shadow-[0_6px_18px_rgba(9,30,66,0.3)]"
      role="status"
    >
      {notice}
    </div>
  ) : null
}
