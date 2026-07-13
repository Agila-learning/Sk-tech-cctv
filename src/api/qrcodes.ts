import { fetchWithAuth } from './client';

export interface QRCodeData {
  _id?: string;
  qrName: string;
  category: string;
  customCategory?: string;
  qrImage?: string;
  description?: string;
  displayOrder?: number;
  status?: boolean;
  isDefault?: boolean;
  icon?: string;
  color?: string;
  targetType?: string;
  targetValue?: string;
}

export const getQRCodes = async (): Promise<QRCodeData[]> => {
  return await fetchWithAuth('/qrcodes');
};

export const getAdminQRCodes = async (): Promise<QRCodeData[]> => {
  return await fetchWithAuth('/qrcodes/admin');
};

export const createQRCode = async (data: QRCodeData): Promise<QRCodeData> => {
  return await fetchWithAuth('/qrcodes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateQRCode = async (id: string, data: Partial<QRCodeData>): Promise<QRCodeData> => {
  return await fetchWithAuth(`/qrcodes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteQRCode = async (id: string): Promise<void> => {
  return await fetchWithAuth(`/qrcodes/${id}`, {
    method: 'DELETE',
  });
};
