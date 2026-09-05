import type { BoardCommand } from '../../data/board-mutations'

// Returns success explicitly so failed saves never dismiss an editor or clear its draft.
export type RunBoardCommand = (command: BoardCommand) => Promise<boolean>
