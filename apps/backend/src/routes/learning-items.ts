import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createClient } from '@supabase/supabase-js'
import {
  LearningItemInsertSchema,
  LearningItemUpdateSchema,
} from '@learning-tracker/shared-types'

type Bindings = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
type Variables = { userId: string }

// user_id는 JWT에서 주입 — request body에서 제외
const InsertBodySchema = LearningItemInsertSchema.omit({ user_id: true })
const UpdateBodySchema = LearningItemUpdateSchema.omit({ user_id: true })

const learningItems = new Hono<{ Bindings: Bindings; Variables: Variables }>()

learningItems
  .get('/', async (c) => {
    const userId = c.get('userId')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('learning_items')
      .select('*')
      .eq('user_id', userId)
      .order('order_index')
    if (error) return c.json({ error: error.message }, 500)
    return c.json(data)
  })
  .post('/', zValidator('json', InsertBodySchema), async (c) => {
    const userId = c.get('userId')
    const body = c.req.valid('json')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('learning_items')
      .insert({ ...body, user_id: userId })
      .select()
      .single()
    if (error) return c.json({ error: error.message }, 500)
    return c.json(data, 201)
  })
  .get('/:id', async (c) => {
    const userId = c.get('userId')
    const id = c.req.param('id')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('learning_items')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    if (error || !data) return c.json({ error: 'Not found' }, 404)
    return c.json(data)
  })
  .put('/:id', zValidator('json', UpdateBodySchema), async (c) => {
    const userId = c.get('userId')
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('learning_items')
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
      .from('learning_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) return c.json({ error: error.message }, 500)
    return c.json({ success: true })
  })

export default learningItems
