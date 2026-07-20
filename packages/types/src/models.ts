import {
  TenantStatus,
  SubscriptionStatus,
  TableStatus,
  OrderType,
  OrderStatus,
} from './enums';

export interface TenantModel {
  id: string;
  name: string;
  subdomain: string;
  customDomain: string | null;
  status: TenantStatus;
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  stripeCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface SubscriptionPlanModel {
  id: string;
  name: string;
  stripePriceId: string;
  maxBranches: number;
  maxRestaurants: number;
  maxProductsPerBranch: number;
  allowCustomDomains: boolean;
  allowOnlinePayments: boolean;
  allowAnalytics: boolean;
  priceMonthly: number;
  priceYearly: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface SubscriptionModel {
  id: string;
  tenantId: string;
  planId: string;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  trialStart: Date | null;
  trialEnd: Date | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserModel {
  id: string;
  tenantId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  phoneNumber: string | null;
  isActive: boolean;
  mfaSecret: string | null;
  mfaEnabled: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface RoleModel {
  id: string;
  tenantId: string | null;
  name: string;
  displayName: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionModel {
  id: string;
  action: string;
  resource: string;
  description: string;
  createdAt: Date;
}

export interface RestaurantModel {
  id: string;
  tenantId: string;
  name: string;
  currency: string;
  timezone: string;
  taxPercentage: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface BranchModel {
  id: string;
  tenantId: string;
  restaurantId: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phoneNumber: string;
  operatingHours: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TableModel {
  id: string;
  tenantId: string;
  branchId: string;
  number: string;
  seatingCapacity: number;
  qrCodeToken: string;
  status: TableStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CategoryModel {
  id: string;
  tenantId: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ProductModel {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: number;
  isAvailable: boolean;
  calories: number | null;
  preparationTime: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface OrderModel {
  id: string;
  tenantId: string;
  branchId: string;
  customerId: string | null;
  tableId: string | null;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  tipAmount: number;
  total: number;
  specialNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
