-- Update any existing sessions that might not have booking_status set
UPDATE sessions 
SET booking_status = 'unassigned' 
WHERE booking_status IS NULL OR booking_status = '';

-- Ensure all sessions have proper booking status
UPDATE sessions 
SET booking_status = 'unassigned' 
WHERE booking_status NOT IN ('unassigned', 'assigned', 'booked');

