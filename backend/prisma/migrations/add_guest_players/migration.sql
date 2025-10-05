-- Create guests table
CREATE TABLE "guests" (
    "id" TEXT NOT NULL,
    "court_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "added_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "guests_court_id_idx" ON "guests"("court_id");
CREATE INDEX "guests_added_by_id_idx" ON "guests"("added_by_id");

-- Add foreign key constraints
ALTER TABLE "guests" ADD CONSTRAINT "guests_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guests" ADD CONSTRAINT "guests_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

