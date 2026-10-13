/** One badge's computed state — GET /badges/me and GET /badges/user/:userId. */
export interface BadgeContract {
  code: string;
  name: string;
  description: string;
  earned: boolean;
  /** Current progress toward `target`, never above it. */
  progress: number;
  target: number;
}
