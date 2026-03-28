import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createClient } from '@supabase/supabase-js'
import { ProgressLogInsertSchema } from '@learning-tracker/shared-types'

type Bindings = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
type Variables = { userId: string }

// user_id는 JWT에서 주입
const InsertBodySchema = ProgressLogInsertSchema.omit({ user_id: true })

const progressLogs = new Hono<{ Bindings: Bindings; Variables: Variables }>()

progressLogs
  .get('/', async (c) => {
    const userId = c.get('userId')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('progress_logs')
      .select('*')
      .eq('user_id', userId)
      .order('study_date', { ascending: false })
    if (error) return c.json({ error: error.message }, 500)
    return c.json(data)
  })
  .post('/', zValidator('json', InsertBodySchema), async (c) => {
    const userId = c.get('userId')
    const body = c.req.valid('json')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('progress_logs')
      .insert({ ...body, user_id: userId })
      .select()
      .single()
    if (error) return c.json({ error: error.message }, 500)
    return c.json(data, 201)
  })
  .delete('/:id', async (c) => {
    const userId = c.get('userId')
    const id = c.req.param('id')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { error } = await supabase
      .from('progress_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) return c.json({ error: error.message }, 500)
    return c.json({ success: true })
  })

export default progressLogs
