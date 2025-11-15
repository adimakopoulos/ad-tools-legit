import { supabase } from '../supabaseClient'

export async function logAdminAction({ admin_id, action_type, entity, entity_id, details }) {
  try {
    await supabase.from('admin_actions').insert({
      admin_id,
      action_type,
      entity,
      entity_id,
      details,
    })
  } catch (err) {
    console.error('Failed to log admin action', err)
  }
}
