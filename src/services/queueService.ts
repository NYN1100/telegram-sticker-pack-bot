import Queue from 'bull';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface StickerJobData {
  userId: number;
  username: string;
  chatId: number;
  imageUrl: string;
  imagePath: string;
}

export interface StickerJobResult {
  success: boolean;
  stickerSetName?: string;
  error?: string;
}

// Simple in-memory job implementation
class InMemoryJob {
  id: number;
  data: StickerJobData;


  constructor(id: number, data: StickerJobData) {
    this.id = id;
    this.data = data;
  }

  async progress(_value: number): Promise<void> {
    // Progress tracking disabled for in-memory job
  }
}

// Simple in-memory queue implementation
class InMemoryQueue {
  private jobs: InMemoryJob[] = [];
  private processing: Set<number> = new Set();
  private nextId: number = 1;
  private processor?: (job: InMemoryJob) => Promise<StickerJobResult>;
  private concurrency: number = 1;
  private stats = {
    completed: 0,
    failed: 0,
  };

  async add(data: StickerJobData): Promise<InMemoryJob> {
    const job = new InMemoryJob(this.nextId++, data);
    this.jobs.push(job);
    this.processNext();
    return job;
  }

  process(concurrency: number, processor: (job: InMemoryJob) => Promise<StickerJobResult>): void {
    this.concurrency = concurrency;
    this.processor = processor;
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (!this.processor || this.processing.size >= this.concurrency) {
      return;
    }

    const job = this.jobs.find(j => !this.processing.has(j.id));
    if (!job) {
      return;
    }

    this.processing.add(job.id);

    try {
      await this.processor(job);
      this.stats.completed++;
    } catch (error) {
      this.stats.failed++;
      logger.error(`In-memory job ${job.id} failed:`, error);
    } finally {
      this.processing.delete(job.id);
      this.jobs = this.jobs.filter(j => j.id !== job.id);
      this.processNext();
    }
  }

  async getWaitingCount(): Promise<number> {
    return this.jobs.filter(j => !this.processing.has(j.id)).length;
  }

  async getActiveCount(): Promise<number> {
    return this.processing.size;
  }

  async getCompletedCount(): Promise<number> {
    return this.stats.completed;
  }

  async getFailedCount(): Promise<number> {
    return this.stats.failed;
  }

  async close(): Promise<void> {
    // Nothing to close for in-memory queue
  }
}

export class QueueService {
  private queue: Queue.Queue<StickerJobData> | InMemoryQueue;
  private useRedis: boolean;

  constructor() {
    this.useRedis = !!config.redisUrl;

    if (this.useRedis) {
      // Create Bull queue with Redis
      this.queue = new Queue<StickerJobData>('sticker-generation', {
        redis: config.redisUrl,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });

      // Set up event listeners for Bull queue
      this.setupEventListeners();
      logger.info('Queue service initialized with Redis');
    } else {
      // Use in-memory queue
      this.queue = new InMemoryQueue();
      logger.info('Queue service initialized with in-memory queue (Redis not configured)');
    }
  }

  /**
   * Add a job to the queue
   */
  async addJob(data: StickerJobData): Promise<Queue.Job<StickerJobData> | InMemoryJob> {
    logger.info(`Adding job to queue for user ${data.userId}`);
    
    if (this.useRedis) {
      const job = await (this.queue as Queue.Queue<StickerJobData>).add(data, {
        priority: 1,
      });
      return job;
    } else {
      return await (this.queue as InMemoryQueue).add(data);
    }
  }

  /**
   * Process jobs in the queue
   */
  process(
    concurrency: number,
    processor: (job: Queue.Job<StickerJobData> | InMemoryJob) => Promise<StickerJobResult>
  ): void {
    logger.info(`Starting queue processor with concurrency: ${concurrency}`);
    
    if (this.useRedis) {
      (this.queue as Queue.Queue<StickerJobData>).process(concurrency, async (job) => {
        logger.info(`Processing job ${job.id} for user ${job.data.userId}`);
        
        try {
          const result = await processor(job);
          logger.info(`Job ${job.id} completed successfully`);
          return result;
        } catch (error) {
          logger.error(`Job ${job.id} failed:`, error);
          throw error;
        }
      });
    } else {
      (this.queue as InMemoryQueue).process(concurrency, async (job) => {
        logger.info(`Processing job ${job.id} for user ${job.data.userId}`);
        
        try {
          const result = await processor(job);
          logger.info(`Job ${job.id} completed successfully`);
          return result;
        } catch (error) {
          logger.error(`Job ${job.id} failed:`, error);
          throw error;
        }
      });
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }

  /**
   * Setup event listeners for queue monitoring (Bull only)
   */
  private setupEventListeners(): void {
    if (!this.useRedis) return;

    const bullQueue = this.queue as Queue.Queue<StickerJobData>;
    
    bullQueue.on('completed', (job, result) => {
      logger.debug(`Job ${job.id} completed:`, result);
    });

    bullQueue.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed:`, err);
    });

    bullQueue.on('stalled', (job) => {
      logger.warn(`Job ${job.id} stalled`);
    });

    bullQueue.on('error', (error) => {
      logger.error('Queue error:', error);
    });
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    logger.info('Closing queue service...');
    await this.queue.close();
  }
}
