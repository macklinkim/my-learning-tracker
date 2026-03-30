import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'

type Bindings = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
type Variables = { userId: string }

const codes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

codes.get('/', async (c) => {
  const groupCode = c.req.query('group')
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)

  let query = supabase
    .from('codes')
    .select('*')
    .eq('is_active', true)
    .order('group_code')
    .order('order_index')

  if (groupCode) {
    query = query.eq('group_code', groupCode)
  }

  const { data, error } = await query
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

export default codes
