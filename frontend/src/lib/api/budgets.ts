// Budget API utility for frontend
// Uses fetch API

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

// Helper to get JWT token from localStorage (adjust if you use cookies or context)
function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getBudgets(userId?: string, month?: string) {
  const params = new URLSearchParams();
  if (userId) params.append('user_id', userId);
  if (month) params.append('month', month);
  const res = await fetch(`${API_BASE}/api/budgets?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch budgets');
  return res.json();
}

export async function getBudgetById(budgetId: string) {
  const res = await fetch(`${API_BASE}/api/budgets/${budgetId}`);
  if (!res.ok) throw new Error('Failed to fetch budget');
  return res.json();
}

export async function createBudget(data: any) {
  const res = await fetch(`${API_BASE}/api/budgets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create budget');
  return res.json();
}

export async function updateBudget(budgetId: string, data: any) {
  const res = await fetch(`${API_BASE}/api/budgets/${budgetId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update budget');
  return res.json();
}

export async function deleteBudget(budgetId: string) {
  const res = await fetch(`${API_BASE}/api/budgets/${budgetId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete budget');
  return res.json();
}
