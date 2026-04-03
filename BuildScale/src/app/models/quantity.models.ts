export type OperationType = 'add' | 'subtract' | 'divide' | 'compare' | 'convert';
export type UnitCategory = 'Length' | 'Weight' | 'Volume' | 'Temperature';

export interface Quantity {
  value: number;
  unit: string;
  category: string;
}

export interface OperationRequest {
  quantity1?: Quantity;
  quantity2?: Quantity;
  value?: number;
  fromUnit?: string;
  toUnit?: string;
  category?: string;
}

export interface ApiResult {
  success: boolean;
  operation: string;
  operand1?: { value: number; unit: string };
  operand2?: { value: number; unit: string };
  result?: { value: number; unit: string };
  boolResult?: boolean;
  scalarResult?: number;
}

export interface SavePayload {
  operation: string;
  data: Record<string, unknown>;
  result: {
    success: boolean;
    operation: string;
    operand1: { value: number; unit: string } | null;
    operand2: { value: number; unit: string } | null;
    result: { value: number; unit: string } | null;
    boolResult: boolean | null;
    scalarResult: number | null;
  };
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  operation: string;
  operand1Value?: number;
  operand1Unit?: string;
  operand2Value?: number;
  operand2Unit?: string;
  resultValue?: number;
  resultUnit?: string;
  boolResult?: boolean;
  scalarResult?: number;
}

export interface UserProfile {
  username: string;
  email: string;
  createdAt?: string;
  totalOperations?: number;
  savedResults?: number;
  mostUsedOperation?: string;
}

export const UNIT_MAP: Record<UnitCategory, string[]> = {
  Length: ['Feet', 'Inches', 'Yards', 'Centimeters'],
  Weight: ['Kilogram', 'Gram', 'Pound'],
  Volume: ['Litre', 'Millilitre', 'Gallon'],
  Temperature: ['Celsius', 'Fahrenheit', 'Kelvin']
};
