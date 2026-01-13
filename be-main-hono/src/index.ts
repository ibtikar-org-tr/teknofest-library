import { Hono } from 'hono'
import type { AppBindings } from './types/env'

const app = new Hono<AppBindings>();

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
