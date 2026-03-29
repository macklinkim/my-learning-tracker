import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Bindings } from '../index'

type Variables = { userId: string }

const ProfileUpdateSchema = z.object({
  username: z.string().nullable().optional(),
  telegram_chat_id: z.string().nullable().optional(),
  briefing_hour: z.number().int().min(0).max(23).optional(),
})

const profile = new Hono<{ Bindings: Bindings; Variables: Variables }>()

profile
  .get('/', async (c) => {
    const userId = c.get('userId')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error || !data) return c.json({ error: 'Profile not found' }, 404)
    return c.json(data)
  })
  .put('/', zValidator('json', ProfileUpdateSchema), async (c) => {
    const userId = c.get('userId')
    const body = c.req.valid('json')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('profiles')
      .update(body)
      .eq('id', userId)
      .select()
      .single()
    if (error) return c.json({ error: error.message }, 500)
    if (!data) return c.json({ error: 'Profile not found' }, 404)
    return c.json(data)
  })

export default profile
