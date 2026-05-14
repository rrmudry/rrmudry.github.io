
const { createClient } = require('@supabase/supabase-js');

const SB_URL = "https://ddekegwvaunpsbxrwdqf.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZWtlZ3d2YXVucHNieHJ3ZHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjI3NjAsImV4cCI6MjA5MDAzODc2MH0.9cP15n9olbF4TWO5Vc9Z3mnroE3FiQPcEYTtFtjNWRI";
const sbClient = createClient(SB_URL, SB_KEY);

async function checkSchema() {
    const { data, error } = await sbClient
        .from('assessments')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching assessments:", error);
    } else {
        console.log("Assessments sample:", JSON.stringify(data, null, 2));
    }

    const { data: resData, error: resError } = await sbClient
        .from('student_results')
        .select('*')
        .limit(1);

    if (resError) {
        console.error("Error fetching student_results:", resError);
    } else {
        console.log("Student Results sample:", JSON.stringify(resData, null, 2));
    }
}

checkSchema();
