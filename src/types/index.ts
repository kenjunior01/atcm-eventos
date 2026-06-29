import { Role, StakeholderType, RegistrationStatus, EventStatus } from '@prisma/client'

export interface User {
  id: string
  email: string
  role: Role
  stakeholderId: string | null
}

export interface Stakeholder {
  id: string
  nome: string
  email: string
  telefone?: string
  nif?: string
  endereco?: string
  tipo: StakeholderType
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  id: string
  titulo: string
  descricao?: string
  data: Date
  local: string
  status: EventStatus
  inscricoesAtivas: boolean
  createdAt: Date
  updatedAt: Date
  createdById: string
}

export interface Registration {
  id: string
  eventId: string
  stakeholderId: string
  categoryId: string
  status: RegistrationStatus
  dadosExtra?: Record<string, any>
  motivoRejeicao?: string
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
