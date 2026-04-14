export interface GuestUser {
  id: string;
  isGuest: true;
  guestToken: string;
  coins: number;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  isGuest: false;
  email: string;
  username: string;
  avatarUrl: string | null;
  coins: number;
  rating: number;
  createdAt: string;
}

export type User = GuestUser | AuthUser;

export interface PublicProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
  rating: number;
  coins: number;
}
