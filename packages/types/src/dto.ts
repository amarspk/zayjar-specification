import { OrderType, PaymentMethodType } from './enums';

export interface CreateTenantDto {
  companyName: string;
  subdomain: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPassword?: string;
  planId: string;
}

export interface LoginDto {
  email: string;
  password?: string;
  mfaToken?: string;
}

export interface CreateOrderDto {
  branchId: string;
  tableId?: string;
  type: OrderType;
  specialNotes?: string;
  items: Array<{
    productId: string;
    sizeId?: string;
    variantId?: string;
    quantity: number;
    addons?: Array<{
      addonItemId: string;
    }>;
  }>;
  paymentMethod: PaymentMethodType;
}

export interface UpdateOrderStatusDto {
  status: string;
}

export interface CreateBranchDto {
  restaurantId: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phoneNumber: string;
  operatingHours: Record<string, unknown>;
}

export interface CreateTableDto {
  branchId: string;
  number: string;
  seatingCapacity: number;
}
