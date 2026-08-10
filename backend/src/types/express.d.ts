import { UserProfile } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: UserProfile & { isVerified?: boolean };
    }
  }
}
