/**
 * Centralized cache key patterns.
 * All keys are namespaced with 'pms:' to avoid collisions in shared Redis instances.
 */
export const CacheKeys = {
  projectsAll: () => 'pms:projects:all',
  project: (id: string) => `pms:projects:${id}`,
  tasksByProject: (projectId: string) => `pms:tasks:project:${projectId}`,
  commentsByTask: (taskId: string) => `pms:comments:task:${taskId}`,
  user: (id: string) => `pms:users:${id}`,
};
