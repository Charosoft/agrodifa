// Types TypeScript qui reflètent les tables Supabase (version simplifiée).
// Plus tard on pourra les générer automatiquement avec la CLI Supabase.

export interface Category {
  id: string
  name: string
  slug: string
}

export interface Product {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  price: number // en CDF
  unit: string
  stock_quantity: number
  low_stock_alert: number
  is_organic: boolean
  is_featured: boolean
  is_active: boolean
  created_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  position: number
}

export interface Advert {
  id: string
  kind: 'carousel' | 'promo'
  title: string
  subtitle: string | null
  image_url: string
  link: string | null
  position: number
  is_active: boolean
}

export interface AppSettings {
  usd_rate: number // 1 USD = usd_rate CDF
  rate_updated_at: string
}

// ----- Utilisateurs et droits -----
export type AppRole = 'owner' | 'employee'
export type AppModule = 'stock' | 'sales' | 'staff' | 'accounting' | 'advertising'

export interface Profile {
  id: string
  full_name: string
  role: AppRole
  is_active: boolean
}

// Un compte tel que renvoyé par GET /api/users
export interface TeamUser {
  id: string
  full_name: string
  email: string | null
  role: AppRole
  is_active: boolean
  modules: AppModule[]
}

// Un produit avec ses photos et sa catégorie (requête avec jointures)
export interface ProductWithImages extends Product {
  product_images: { id: string; url: string; position: number }[]
  categories: { name: string } | null
}

// ----- Commandes et messages -----
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled'
export type PayMethod = 'cash' | 'mpesa' | 'airtel_money' | 'orange_money' | 'bank' | 'other'

export interface OrderItem {
  id: string
  product_name: string
  unit_price: number
  quantity: number
}

export interface Order {
  id: string
  order_number: number
  customer_name: string
  customer_phone: string
  customer_address: string | null
  note: string | null
  status: OrderStatus
  payment_method: PayMethod | null
  source: 'online' | 'shop'
  total: number
  usd_rate_used: number | null
  created_at: string
  order_items: OrderItem[]
}

export interface ContactMessage {
  id: string
  name: string
  phone: string | null
  email: string | null
  content: string
  is_read: boolean
  created_at: string
}

export interface DashboardStats {
  today_revenue: number
  month_revenue: number
  today_orders: number
  month_orders: number
  pending_orders: number
  confirmed_orders: number
  unread_messages: number
  low_stock: { id: string; name: string; stock_quantity: number; low_stock_alert: number; unit: string }[]
  daily: { day: string; revenue: number; orders: number }[]
  top_products: { name: string; quantity: number; revenue: number }[]
}

export type PaymentKind = 'salary' | 'advance' | 'bonus'

export interface Employee {
  id: string
  user_id: string | null
  full_name: string
  phone: string | null
  job_title: string | null
  base_salary: number
  hire_date: string | null
  is_active: boolean
  created_at: string
}

export interface EmployeePayment {
  id: string
  employee_id: string
  kind: PaymentKind
  amount: number
  method: PayMethod
  period: string | null
  note: string | null
  paid_at: string
  created_by: string | null
}

export type TxType = 'income' | 'expense'

export interface Transaction {
  id: string
  type: TxType
  amount: number
  category: string
  method: PayMethod
  description: string | null
  order_id: string | null
  employee_payment_id: string | null
  occurred_at: string
  created_by: string | null
  profiles: { full_name: string } | null
}