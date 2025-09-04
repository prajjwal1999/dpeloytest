import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';
import { DATABASE_CONSTANTS } from '../utils';

export const getDatabaseConfig = (
  configService: ConfigService,
): MongooseModuleOptions => ({
  uri: configService.get<string>('MONGODB_URI') || DATABASE_CONSTANTS.DEFAULT_URI,
  connectionFactory: (connection) => {
    // Optimize for high performance
    connection.plugin(require('mongoose-lean-virtuals'));
    return connection;
  },
  // Connection pool optimization for scalability
  maxPoolSize: DATABASE_CONSTANTS.CONNECTION_POOL.MAX_POOL_SIZE,
  minPoolSize: DATABASE_CONSTANTS.CONNECTION_POOL.MIN_POOL_SIZE,
  maxIdleTimeMS: DATABASE_CONSTANTS.CONNECTION_POOL.MAX_IDLE_TIME_MS,
  serverSelectionTimeoutMS: DATABASE_CONSTANTS.CONNECTION_POOL.SERVER_SELECTION_TIMEOUT_MS,
  socketTimeoutMS: DATABASE_CONSTANTS.CONNECTION_POOL.SOCKET_TIMEOUT_MS,
  // Enable connection compression
  compressors: DATABASE_CONSTANTS.COMPRESSOR,
});
