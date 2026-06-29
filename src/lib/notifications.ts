import { Resend } from 'resend'
import { Twilio } from 'twilio'
import { prisma } from './prisma'

const resend = new Resend(process.env.RESEND_API_KEY)
const twilio = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export interface NotificationData {
  type: 'EMAIL' | 'SMS' | 'PUSH'
  recipient: string
  subject?: string
  template?: string
  data?: Record<string, any>
}

/**
 * Enviar notificação (Email ou SMS)
 */
export async function sendNotification({
  type,
  recipient,
  subject,
  template,
  data,
}: NotificationData) {
  try {
    if (type === 'EMAIL') {
      return await sendEmail(recipient, subject || '', template, data)
    } else if (type === 'SMS') {
      return await sendSMS(recipient, template, data)
    }
  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
    throw error
  }
}

/**
 * Enviar email via Resend
 */
async function sendEmail(
  to: string,
  subject: string,
  template?: string,
  data?: Record<string, any>
) {
  const html = generateEmailTemplate(template, data)

  const { data: emailData, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@atcm-eventos.co.mz',
    to,
    subject,
    html,
  })

  if (error) {
    throw new Error(error.message)
  }

  return emailData
}

/**
 * Enviar SMS via Twilio
 */
async function sendSMS(
  to: string,
  template?: string,
  data?: Record<string, any>
) {
  const message = generateSMSTemplate(template, data)

  const response = await twilio.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  })

  return response
}

/**
 * Gerar HTML template para email
 */
function generateEmailTemplate(template?: string, data?: Record<string, any>) {
  if (!template) return ''

  const templates: Record<string, (data: any) => string> = {
    'event-created': (d) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Novo Evento Disponível</h2>
        <p>Olá,</p>
        <p>Um novo evento foi criado no ATCM:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${d.eventName}</h3>
          <p><strong>Data:</strong> ${d.eventDate}</p>
          <p><strong>Local:</strong> ${d.eventLocation}</p>
        </div>
        <p>Acesse o sistema para fazer sua inscrição.</p>
        <p>Atenciosamente,<br>Equipe ATCM</p>
      </div>
    `,
    'registration-approved': (d) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Inscrição Aprovada!</h2>
        <p>Olá,</p>
        <p>Sua inscrição foi aprovada com sucesso:</p>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #22c55e;">
          <h3 style="margin: 0 0 10px 0;">${d.eventName}</h3>
          <p><strong>Categoria:</strong> ${d.category}</p>
        </div>
        <p>Prepare-se para o evento!</p>
        <p>Atenciosamente,<br>Equipe ATCM</p>
      </div>
    `,
    'registration-rejected': (d) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Inscrição Rejeitada</h2>
        <p>Olá,</p>
        <p>Sua inscrição foi rejeitada:</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ef4444;">
          <h3 style="margin: 0 0 10px 0;">${d.eventName}</h3>
          <p><strong>Motivo:</strong> ${d.motivo || 'Não informado'}</p>
        </div>
        <p>Entre em contato para mais informações.</p>
        <p>Atenciosamente,<br>Equipe ATCM</p>
      </div>
    `,
  }

  const templateFn = templates[template]
  return templateFn ? templateFn(data || {}) : ''
}

/**
 * Gerar template para SMS
 */
function generateSMSTemplate(template?: string, data?: Record<string, any>) {
  if (!template) return ''

  const templates: Record<string, (data: any) => string> = {
    'event-created': (d) => 
      `ATCM: Novo evento disponível - ${d.eventName} em ${d.eventDate}. Acesse para inscrever-se.`,
    'registration-approved': (d) => 
      `ATCM: Sua inscrição para ${d.eventName} foi aprovada!`,
    'registration-rejected': (d) => 
      `ATCM: Sua inscrição para ${d.eventName} foi rejeitada. Motivo: ${d.motivo || 'Não informado'}`,
  }

  const templateFn = templates[template]
  return templateFn ? templateFn(data || {}) : ''
}

/**
 * Enviar notificação em massa para stakeholders
 */
export async function sendBulkNotification({
  type,
  stakeholderType,
  subject,
  template,
  data,
}: {
  type: 'EMAIL' | 'SMS'
  stakeholderType?: string
  subject?: string
  template?: string
  data?: Record<string, any>
}) {
  const where: any = {}
  if (stakeholderType) {
    where.tipo = stakeholderType
  }

  const stakeholders = await prisma.stakeholder.findMany({
    where,
    select: {
      email: true,
      telefone: true,
    },
  })

  const results = []

  for (const stakeholder of stakeholders) {
    try {
      const recipient = type === 'EMAIL' ? stakeholder.email : stakeholder.telefone
      if (!recipient) continue

      await sendNotification({
        type,
        recipient,
        subject,
        template,
        data,
      })

      results.push({ success: true, recipient })
    } catch (error) {
      console.error(`Erro ao enviar para ${stakeholder.email}:`, error)
      results.push({ success: false, recipient: stakeholder.email, error })
    }
  }

  return results
}
