import { Hono } from 'hono'
import type { AppBindings } from '../types/env'

const emailRouter = new Hono<AppBindings>()

emailRouter.post('/send', async (c) => {
  const body = await c.req.json<{
    recipient_email: string
    subject: string
    content?: string
  }>()

  const result = await c.env.D1_DB.prepare(
    `INSERT INTO email_logs (recipient_email, subject, content, status)
     VALUES (?, ?, ?, ?)
     RETURNING *`
  )
    .bind(body.recipient_email, body.subject, body.content ?? null, 'pending')
    .first()

  // SMTP sending will be ported from the Python email_service
  return c.json({
    message: 'Email queued (SMTP not wired yet)',
    log: result,
  })
})

emailRouter.post('/send-telegram-invite', async (c) => {
  const body = await c.req.json<{
    recipient_email: string
    telegram_link: string
    team_name?: string
  }>()

  const subject = body.team_name
    ? `دعوة تلغرام — ${body.team_name}`
    : 'دعوة تلغرام'
  const content = `رابط المجموعة: ${body.telegram_link}`

  const result = await c.env.D1_DB.prepare(
    `INSERT INTO email_logs (recipient_email, subject, content, status)
     VALUES (?, ?, ?, ?)
     RETURNING *`
  )
    .bind(body.recipient_email, subject, content, 'pending')
    .first()

  return c.json({
    message: 'Telegram invite queued (SMTP not wired yet)',
    log: result,
  })
})

export default emailRouter
