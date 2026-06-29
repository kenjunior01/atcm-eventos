import { z } from 'zod'

// Schema para criação de stakeholder
export const createStakeholderSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  nif: z.string().optional(),
  endereco: z.string().optional(),
  tipo: z.enum(['CLIENTE', 'PILOTO', 'FORNECEDOR', 'PATROCINADOR', 'COLABORADOR']),
})

// Schema para criação de evento
export const createEventSchema = z.object({
  titulo: z.string().min(5, 'Título deve ter no mínimo 5 caracteres'),
  descricao: z.string().optional(),
  data: z.string().or(z.date()),
  local: z.string().default('ATCM - Maputo'),
  status: z.enum(['RASCUNHO', 'ATIVO', 'ENCERRADO', 'CANCELADO']).default('RASCUNHO'),
  inscricoesAtivas: z.boolean().default(false),
  categories: z.array(
    z.object({
      nome: z.string().min(2),
      descricao: z.string().optional(),
      vagas: z.number().int().min(1),
      taxaInscricao: z.number().min(0),
    })
  ).min(1, 'Pelo menos uma categoria é obrigatória'),
  requiredFields: z.array(
    z.object({
      fieldName: z.string(),
      fieldLabel: z.string(),
      fieldType: z.enum(['text', 'number', 'select', 'file']),
      isRequired: z.boolean().default(true),
      options: z.string().optional(),
    })
  ).optional(),
})

// Schema para inscrição
export const createRegistrationSchema = z.object({
  eventId: z.string().cuid(),
  stakeholderId: z.string().cuid(),
  categoryId: z.string().cuid(),
  dadosExtra: z.record(z.any()).optional(),
})

// Schema para upload de comprovativo
export const uploadPaymentProofSchema = z.object({
  registrationId: z.string().cuid(),
  file: z.instanceof(File).refine(
    (file) => file.size <= 10 * 1024 * 1024,
    'Arquivo deve ter no máximo 10MB'
  ).refine(
    (file) => ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type),
    'Apenas PDF ou imagens (JPEG, PNG) são permitidos'
  ),
})

// Schema para validação de pagamento
export const validatePaymentSchema = z.object({
  registrationId: z.string().cuid(),
  aprovado: z.boolean(),
  motivo: z.string().optional(),
})

// Schema para atualização de evento
export const updateEventSchema = createEventSchema.partial().extend({
  id: z.string().cuid(),
})

// Schema para login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

// Schema para registro de usuário
export const registerUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  stakeholderId: z.string().cuid().optional(),
  role: z.enum(['SUPERADMIN', 'ADMIN', 'STAFF', 'FINANCEIRO', 'VALIDADOR_PAGAMENTO']).default('STAFF'),
})

export type CreateStakeholderInput = z.infer<typeof createStakeholderSchema>
export type CreateEventInput = z.infer<typeof createEventSchema>
export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>
export type UploadPaymentProofInput = z.infer<typeof uploadPaymentProofSchema>
export type ValidatePaymentInput = z.infer<typeof validatePaymentSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterUserInput = z.infer<typeof registerUserSchema>
