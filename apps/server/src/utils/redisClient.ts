import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;
const redisToken = process.env.REDIS_TOKEN;

if (!redisUrl || !redisToken) {
    console.warn('⚠️  REDIS_URL or REDIS_TOKEN not found in environment variables. Falling back to in-memory storage.');
}

export const redis = (redisUrl && redisToken)
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

/**
 * Helper to check if Redis is configured and connected
 */
export const isRedisEnabled = () => !!redis;

/**
 * Health check for Redis
 */
export const redisHealthCheck = async (): Promise<boolean> => {
    if (!redis) return false;
    try {
        await redis.ping();
        return true;
    } catch (error) {
        console.error('Redis health check failed:', error);
        return false;
    }
};
