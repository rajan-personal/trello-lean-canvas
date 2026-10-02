import { Fragment } from 'react'
import { CanvasSection, type CanvasSectionProps } from './CanvasSection'
import type { CanvasSectionData, SectionId } from '../data/types'
import { panelClass } from './workspace-classes'
const groups: readonly (readonly [SectionId, SectionId])[] = [
  ['problem', 'alternatives'],
  ['solution', 'metrics'],
  ['value', 'concept'],
  ['advantage', 'channels'],
  ['segments', 'adopters'],
]
const columns: Partial<Record<SectionId, string>> = {
  problem: 'col-[1/3]',
  solution: 'col-[3/5]',
  value: 'col-[5/7]',
  advantage: 'col-[7/9]',
  segments: 'col-[9/11]',
}
interface Props {
  sections: CanvasSectionData[]
  sectionProps: Omit<CanvasSectionProps, 'section' | 'bottom' | 'sub'>
}
export function CanvasBoard({ sections, sectionProps }: Props) {
  const byId = Object.fromEntries(
    sections.map((section) => [section.id, section]),
  ) as Record<SectionId, CanvasSectionData>
  return (
    <div className="main-area h-full min-w-0 flex-1">
      <div className="board-scroll h-full w-full overflow-auto p-3 [scrollbar-color:rgba(255,255,255,0.35)_rgba(0,0,0,0.12)]">
        <div className="lean-grid grid w-full min-w-[1000px] grid-cols-10 grid-rows-[auto_auto_auto] content-start gap-2.5 max-[760px]:min-w-[1100px]">
          {groups.map(([top, bottom]) => top === 'solution' || top === 'advantage' ? (
            <Fragment key={top}>
              <div className={`canvas-panel ${top} ${panelClass} ${columns[top]} row-[1] flex min-h-0 flex-col`}>
                <CanvasSection section={byId[top]} {...sectionProps} />
              </div>
              <div className={`canvas-panel ${bottom} ${panelClass} ${columns[top]} row-[2] flex min-h-0 flex-col`}>
                <CanvasSection section={byId[bottom]} {...sectionProps} />
              </div>
            </Fragment>
          ) : (
            <div
              className={`canvas-panel ${top} canvas-column ${panelClass} ${columns[top] ?? ''} row-[1/3] flex min-h-0 flex-col ${top === 'value' ? 'border-t-4 border-[#0c66e4]' : ''}`}
              key={top}
            >
              <CanvasSection section={byId[top]} {...sectionProps} />
              <CanvasSection section={byId[bottom]} sub {...sectionProps} />
            </div>
          ))}
          <div
            className={`canvas-panel bottom-panel cost ${panelClass} col-[1/6] row-start-3 flex min-h-0`}
          >
            <CanvasSection section={byId.cost} bottom {...sectionProps} />
          </div>
          <div
            className={`canvas-panel bottom-panel revenue ${panelClass} col-[6/11] row-start-3 flex min-h-0`}
          >
            <CanvasSection section={byId.revenue} bottom {...sectionProps} />
          </div>
        </div>
      </div>
    </div>
  )
}
