import { config } from 'dotenv';
import { resolve } from 'node:path';

export function loadEnvironment() {
  config({ path: resolve(__dirname, '../.env') });
}
