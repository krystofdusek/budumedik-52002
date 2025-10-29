import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid token')
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      throw new Error('User is not an admin')
    }

    // Get the user ID to delete from request body
    const { userId } = await req.json()
    
    if (!userId) {
      throw new Error('User ID is required')
    }

    // Delete user's subscription first
    const { error: subError } = await supabaseClient
      .from('user_subscriptions')
      .delete()
      .eq('user_id', userId)

    if (subError) {
      console.error('Error deleting subscription:', subError)
    }

    // Delete user's statistics
    const { error: statsError } = await supabaseClient
      .from('user_statistics')
      .delete()
      .eq('user_id', userId)

    if (statsError) {
      console.error('Error deleting statistics:', statsError)
    }

    // Delete user's answers
    const { error: answersError } = await supabaseClient
      .from('user_answers')
      .delete()
      .eq('user_id', userId)

    if (answersError) {
      console.error('Error deleting answers:', answersError)
    }

    // Delete user's test results
    const { error: resultsError } = await supabaseClient
      .from('test_results')
      .delete()
      .eq('user_id', userId)

    if (resultsError) {
      console.error('Error deleting test results:', resultsError)
    }

    // Delete user's favorite questions
    const { error: favError } = await supabaseClient
      .from('favorite_questions')
      .delete()
      .eq('user_id', userId)

    if (favError) {
      console.error('Error deleting favorites:', favError)
    }

    // Delete user's profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
    }

    // Finally, delete the user from auth
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      throw deleteError
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in delete-user function:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})