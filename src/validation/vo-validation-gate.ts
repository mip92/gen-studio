/**
 * The single shared invariant behind «нельзя утверждать озвучку, пока проект не
 * прошёл VO-валидацию хотя бы раз». A plain function (no DI, no module import)
 * so TTSService, the controller and the actions page all call the exact same
 * predicate and can never drift.
 *
 * Per-project OPT-IN: the gate only bites when Project.voValidationGateEnabled
 * is true (default false — existing in-flight projects are unaffected). Once a
 * single VoValidationRun completes for the project, the gate is open forever;
 * individual flagged verdicts never re-block approval.
 */
import type { PrismaService } from '../prisma/prisma.service';

export async function voGateBlocksApprove(prisma: PrismaService, projectId: string): Promise<boolean> {
  const project = await (prisma as any).project.findUnique({
    where:  { id: projectId },
    select: { voValidationGateEnabled: true },
  });
  if (!project?.voValidationGateEnabled) return false;
  const completed = await (prisma as any).voValidationRun.count({
    where: { projectId, status: 'completed' },
  });
  return completed === 0;
}
