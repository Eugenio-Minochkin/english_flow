ALTER TABLE "User"
ADD COLUMN "scheduleWindows" JSONB NOT NULL DEFAULT '["morning","afternoon","evening"]',
ADD COLUMN "scheduleAuto" BOOLEAN NOT NULL DEFAULT true;
