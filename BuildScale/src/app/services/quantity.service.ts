import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  OperationType,
  OperationRequest,
  ApiResult,
  SavePayload,
  UNIT_MAP,
  UnitCategory
} from '../models/quantity.models';

@Injectable({ providedIn: 'root' })
export class QuantityService {
  private apiBase = environment.apiUrl;

  getUnitsForCategory(category: UnitCategory): string[] {
    return UNIT_MAP[category] || [];
  }

  async performOperation(
    op: OperationType,
    body: OperationRequest
  ): Promise<ApiResult> {
    let endpoint = '';
    if (op === 'convert') {
      endpoint = '/api/QuantityMeasurement/convert';
    } else {
      endpoint = `/api/QuantityMeasurement/${op}`;
    }

    const res = await fetch(this.apiBase + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error((e as { message?: string }).message || 'Operation failed');
    }

    return res.json() as Promise<ApiResult>;
  }

  buildSavePayload(op: OperationType, reqBody: OperationRequest, apiResult: ApiResult): SavePayload {
    const data: Record<string, unknown> =
      op === 'convert'
        ? {
            value: reqBody.value,
            fromUnit: reqBody.fromUnit,
            toUnit: reqBody.toUnit,
            category: reqBody.category
          }
        : { quantity1: reqBody.quantity1, quantity2: reqBody.quantity2 };

    return {
      operation: op.charAt(0).toUpperCase() + op.slice(1),
      data,
      result: {
        success: apiResult.success,
        operation: apiResult.operation,
        operand1: apiResult.operand1 ?? null,
        operand2: apiResult.operand2 ?? null,
        result: apiResult.result ?? null,
        boolResult: apiResult.boolResult ?? null,
        scalarResult: apiResult.scalarResult ?? null
      }
    };
  }

  async loadHistory(token: string): Promise<unknown[]> {
    const res = await fetch(this.apiBase + '/api/QuantityMeasurement/history', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json() as Promise<unknown[]>;
  }

  async deleteHistoryItem(id: string, token: string): Promise<void> {
    const res = await fetch(`${this.apiBase}/api/QuantityMeasurement/history/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete item');
  }

  async clearHistory(token: string): Promise<void> {
    const res = await fetch(this.apiBase + '/api/QuantityMeasurement/history/clear', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to clear history');
  }

  async loadProfile(token: string): Promise<unknown> {
    const res = await fetch(this.apiBase + '/api/User/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  }

  fmt(n: number | null | undefined): string {
    if (n == null) return '—';
    return parseFloat(n.toPrecision(8)).toString();
  }
}
