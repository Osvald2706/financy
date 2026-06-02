export interface DebtType {
  id: string
  userId: string
  name: string
  creditor: string
  type: "personal" | "bank" | "credit_card" | "mortgage" | "student" | "car" | "other"
  totalAmount: number
  interestRate: number
  minimumPayment: number
  paidAmount: number
  status: "active" | "paid" | "defaulted" | "refinanced"
  dueDate: string | null
  startDate: string
  notes: string | null
  category: string
  createdAt: string
  updatedAt: string
  payments?: DebtPaymentType[]
}

export interface DebtPaymentType {
  id: string
  debtId: string
  amount: number
  date: string
  method: string
  notes: string | null
  createdAt: string
}

export interface IncomeType {
  id: string
  userId: string
  amount: number
  description: string | null
  source: string
  categoryId: string | null
  date: string
  isRecurring: boolean
  frequency: string | null
  nextDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ExpenseType {
  id: string
  userId: string
  amount: number
  description: string | null
  categoryId: string | null
  date: string
  isRecurring: boolean
  frequency: string | null
  nextDate: string | null
  isEssential: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface GoalType {
  id: string
  userId: string
  name: string
  type: "savings" | "debt_free" | "investment" | "emergency_fund" | "custom"
  targetAmount: number
  currentAmount: number
  deadline: string | null
  status: "active" | "completed" | "cancelled"
  icon: string
  color: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CategoryType {
  id: string
  userId: string
  name: string
  type: "expense" | "income" | "debt"
  icon: string
  color: string
  budget: number | null
}

export interface DashboardSummary {
  totalDebt: number
  totalPaid: number
  remainingDebt: number
  monthlyIncome: number
  monthlyExpenses: number
  disposableIncome: number
  debtFreeProgress: number
  activeDebts: number
  paidDebts: number
  upcomingPayments: number
  totalGoals: number
  goalsCompleted: number
  cashFlow: number
}

export interface CashFlowProjection {
  month: string
  income: number
  expenses: number
  debtPayments: number
  netFlow: number
}

export interface PaymentCalendarItem {
  id: string
  debtId: string
  debtName: string
  amount: number
  dueDate: string
  status: string
  daysUntilDue: number
}

export interface AIAnalysis {
  summary: string
  totalDebt: number
  disposableIncome: number
  debtFreeDate: string
  recommendations: string[]
  unnecessaryExpenses: string[]
  priorityPayments: { name: string; reason: string; amount: number }[]
  savingsPotential: number
  riskLevel: "low" | "medium" | "high"
}
