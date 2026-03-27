// Reports API Service for FinSight AI
// Handles report-related API calls

const API_CONFIG = {
  development: {
    baseUrl: 'http://localhost:8000',
    timeout: 10000,
  },
  production: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.finsight.ai',
    timeout: 15000,
  }
}

const config = API_CONFIG[process.env.NODE_ENV as keyof typeof API_CONFIG] || API_CONFIG.development

import { Report } from '@/types/report'

class ReportsService {
  // Get current user token
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jwt_token')
    }
    return null
  }

  // Get all reports for the authenticated user
  async getReports(): Promise<{ data: Report[]; status: string }> {
    const token = this.getToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    console.log('🔍 ReportsService: Making GET request to /api/reports')
    console.log('🔍 ReportsService: Token:', token.substring(0, 20) + '...')
    console.log('🔍 ReportsService: Base URL:', config.baseUrl)

    const response = await fetch(`${config.baseUrl}/api/reports`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    console.log('🔍 ReportsService: Response status:', response.status)
    console.log('🔍 ReportsService: Response headers:', response.headers)

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ ReportsService: API Error:', error)
      throw new Error(error.error || 'Failed to fetch reports')
    }

    const result = await response.json()
    console.log('🔍 ReportsService: API Response:', result)
    return result
  }

  // Generate a new report
  async generateReport(reportData: {
    report_type: 'monthly' | 'quarterly' | 'yearly';
    date_range?: {
      start: string;
      end: string;
    };
    format?: string;
  }): Promise<{ data: Report; status: string }> {
    const token = this.getToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${config.baseUrl}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(reportData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate report')
    }

    return await response.json()
  }

  // Get report by ID
  async getReportById(reportId: string): Promise<{ data: Report; status: string }> {
    const token = this.getToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${config.baseUrl}/api/reports/${reportId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch report')
    }

    return await response.json()
  }

  // Delete report by ID
  async deleteReport(reportId: string): Promise<{ message: string; status: string }> {
    const token = this.getToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${config.baseUrl}/api/reports/${reportId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete report')
    }

    return await response.json()
  }
}

export const reportsService = new ReportsService()
export default reportsService
