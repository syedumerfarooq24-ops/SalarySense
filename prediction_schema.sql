-- Create the prediction_history table
CREATE TABLE IF NOT EXISTS prediction_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    age INT NOT NULL,
    gender TEXT,
    education TEXT NOT NULL,
    experience FLOAT NOT NULL,
    department TEXT NOT NULL,
    job_title TEXT NOT NULL,
    company_size TEXT,
    employment_type TEXT,
    remote_work BOOLEAN NOT NULL DEFAULT FALSE,
    city TEXT NOT NULL,
    predicted_salary FLOAT NOT NULL,
    confidence_score FLOAT DEFAULT 0.85,
    status TEXT DEFAULT 'completed'
);

-- Enable Row Level Security (RLS) and allow public read/write
ALTER TABLE prediction_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
ON prediction_history FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access"
ON prediction_history FOR INSERT
WITH CHECK (true);
