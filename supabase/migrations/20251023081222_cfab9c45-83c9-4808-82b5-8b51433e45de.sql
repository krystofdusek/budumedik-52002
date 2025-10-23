-- Add new faculty types to enum (must be in separate transaction)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = '1LF' AND enumtypid = 'faculty_type'::regtype) THEN
    ALTER TYPE faculty_type ADD VALUE '1LF';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LFPLZEN' AND enumtypid = 'faculty_type'::regtype) THEN
    ALTER TYPE faculty_type ADD VALUE 'LFPLZEN';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LFOL' AND enumtypid = 'faculty_type'::regtype) THEN
    ALTER TYPE faculty_type ADD VALUE 'LFOL';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LFOSTRAVA' AND enumtypid = 'faculty_type'::regtype) THEN
    ALTER TYPE faculty_type ADD VALUE 'LFOSTRAVA';
  END IF;
END $$;