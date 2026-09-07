export interface MenuItem {
  id: number;
  label: string;
  href: string;
  location: "NAVBAR" | "FOOTER";
  sortOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type Role = "ADMIN" | "STAFF" | "CUSTOMER";

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  token: string;
}

export interface ServiceItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  priceFrom: number | null;
  durationMinutes: number;
  icon: string;
  imageUrl?: string;
  image?: string;
  featured: boolean;
  active: boolean;
  sortOrder?: number;
}

export interface PageItem {
  id: number;
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PostItem {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  authorName?: string;
  published: boolean;
  likeCount?: number;
  commentCount?: number;
  createdAt?: string;
}

export interface PostComment {
  id: number;
  postId: number;
  postTitle?: string;
  authorName: string;
  authorEmail: string;
  content: string;
  approved: boolean;
  createdAt?: string;
}

export interface PostEngagement {
  postId: number;
  postTitle: string;
  likeCount: number;
  commentCount: number;
}

export interface BookingItem {
  id: number;
  serviceId: number;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  preferredDate: string;
  preferredTime?: string;
  address: string;
  notes?: string;
  status: string;
  propertyType?: string;
  squareFootage?: number;
  createdAt?: string;
}

export interface ContactItem {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  read: boolean;
  createdAt?: string;
}

export interface SiteSetting {
  id: number;
  settingKey: string;
  settingValue: string;
  label?: string;
  groupName?: string;
}

export interface UserItem {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  active: boolean;
  createdAt?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  pendingBookings: number;
  unreadMessages: number;
  totalServices: number;
  totalPosts: number;
  totalPages: number;
}

export interface Testimonial {
  id: number;
  customerName: string;
  customerTitle?: string;
  content: string;
  rating: number;
  approved: boolean;
}
