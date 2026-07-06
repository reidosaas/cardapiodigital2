import api from './api';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: 'ADMIN' | 'VENDEDOR' | 'CLIENTE';
  telefone?: string;
  avatarUrl?: string;
  vendedor?: {
    id: string;
    nomeLoja: string;
    slug: string;
    logoUrl?: string;
    corPrimaria: string;
    whatsappConectado: boolean;
    assinatura?: any;
  };
}

export async function login(email: string, senha: string) {
  const { data } = await api.post('/api/auth/login', { email, senha });
  localStorage.setItem('token', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  return data;
}

export async function register(data: {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  nomeLoja?: string;
  slug?: string;
}) {
  const response = await api.post('/api/auth/register', data);
  localStorage.setItem('token', response.data.accessToken);
  localStorage.setItem('refreshToken', response.data.refreshToken);
  return response.data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get('/api/auth/me');
  return data;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  window.location.href = '/auth/login';
}

export function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export function isAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('token');
  }
  return false;
}
