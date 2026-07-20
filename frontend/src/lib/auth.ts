import api from './api';
import { getAccessToken, getRefreshToken, setTokens, removeTokens, hasAccessToken } from './token';

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
    documento?: string;
    logoUrl?: string;
    corPrimaria: string;
    whatsappConectado: boolean;
    descricao?: string;
    modoEscuro?: boolean;
    bannerUrl?: string;
    tempoPreparoMin?: number;
    entregaTipo?: string;
    taxaEntrega?: number;
    whatsappNumero?: string;
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    endereco?: string;
    horarioFuncionamento?: any;
    assinatura?: any;
  };
}

export async function login(email: string, senha: string) {
  const { data } = await api.post('/api/auth/login', { email, senha });
  setTokens(data.accessToken, data.refreshToken);
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
  setTokens(response.data.accessToken, response.data.refreshToken);
  return response.data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get('/api/auth/me');
  return data;
}

export function logout() {
  removeTokens();
  window.location.href = '/auth/login';
}

export function getToken() {
  return getAccessToken();
}

export function isAuthenticated(): boolean {
  return hasAccessToken();
}
