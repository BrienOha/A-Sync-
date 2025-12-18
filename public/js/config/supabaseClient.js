// public/js/config/supabaseClient.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://bftbqandlcvhlacahsps.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdGJxYW5kbGN2aGxhY2Foc3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDk4MTgsImV4cCI6MjA4MTYyNTgxOH0.hLNckjMUKdRUnnWXjgzTkLSiYh8TcJWgMbRV47M9-bo';

export const supabase = createClient(supabaseUrl, supabaseKey);