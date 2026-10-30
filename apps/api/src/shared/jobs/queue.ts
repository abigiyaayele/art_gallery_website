import PgBoss from 'pg-boss';

export type JobHandler<T> = (data: T) => Promise<void>;

/** Background work (image processing, AI jobs). Handlers must be idempotent: a job can run twice. */
export interface JobQueue {
  register<T extends object>(name: string, handler: JobHandler<T>): void;
  enqueue<T extends object>(name: string, data: T): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

/** Runs jobs in-process right away. Used by tests and single-process development. */
export class InlineJobQueue implements JobQueue {
  private handlers = new Map<string, JobHandler<object>>();
  readonly failures: { name: string; error: unknown }[] = [];

  register<T extends object>(name: string, handler: JobHandler<T>) {
    this.handlers.set(name, handler as JobHandler<object>);
  }

  async enqueue<T extends object>(name: string, data: T) {
    const handler = this.handlers.get(name);
    if (!handler) throw new Error(`No handler registered for job ${name}`);
    try {
      await handler(data);
    } catch (error) {
      this.failures.push({ name, error });
    }
  }

  async start() {}
  async stop() {}
}

/** Durable queue stored in Postgres, so no extra infrastructure is needed. */
export class PgBossJobQueue implements JobQueue {
  private boss: PgBoss;
  private handlers = new Map<string, JobHandler<object>>();

  constructor(connectionString: string) {
    this.boss = new PgBoss({ connectionString });
  }

  register<T extends object>(name: string, handler: JobHandler<T>) {
    this.handlers.set(name, handler as JobHandler<object>);
  }

  async enqueue<T extends object>(name: string, data: T) {
    await this.boss.send(name, data, { retryLimit: 3, retryBackoff: true });
  }

  async start() {
    await this.boss.start();
    for (const [name, handler] of this.handlers) {
      await this.boss.createQueue(name);
      await this.boss.work<object>(name, async jobs => {
        for (const job of jobs) await handler(job.data);
      });
    }
  }

  async stop() {
    await this.boss.stop({ graceful: true });
  }
}
