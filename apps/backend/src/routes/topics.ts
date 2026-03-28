import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createClient } from '@supabase/supabase-js'
import { TopicInsertSchema } from '@learning-tracker/shared-types'

type Bindings = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
type Variables = { userId: string }

// user_id는 JWT에서 주입 — request body에서 제외
const TopicBodySchema = TopicInsertSchema.omit({ user_id: true })
const TopicBodyPartialSchema = TopicBodySchema.partial()

const topics = new Hono<{ Bindings: Bindings; Variables: Variables }>()

topics
  .get('/', async (c) => {
    const userId = c.get('userId')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', userId)
      .order('order_index')
    if (error) return c.json({ error: error.message }, 500)
    return c.json(data)
  })
  .post('/', zValidator('json', TopicBodySchema), async (c) => {
    const userId = c.get('userId')
    const body = c.req.valid('json')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('topics')
      .insert({ ...body, user_id: userId })
      .select()
      .single()
    if (error) return c.json({ error: error.message }, 500)
    return c.json(data, 201)
  })
  .put('/:id', zValidator('json', TopicBodyPartialSchema), async (c) => {
    const userId = c.get('userId')
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('topics')
      .update(body)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) return c.json({ error: error.message }, 500)
    if (!data) return c.json({ error: 'Not found' }, 404)
    return c.json(data)
  })
  .delete('/:id', async (c) => {
    const userId = c.get('userId')
    const id = c.req.param('id')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) return c.json({ error: error.message }, 500)
    return c.json({ success: true })
  })

export default topics
