-- CreateTable
CREATE TABLE "attendance_day" (
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_day_pkey" PRIMARY KEY ("date")
);

-- CreateTable
CREATE TABLE "blocked_date" (
    "date" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_date_pkey" PRIMARY KEY ("date")
);

-- CreateTable
CREATE TABLE "holiday" (
    "date" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "holiday_pkey" PRIMARY KEY ("date")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "employmentStartDate" TEXT,
    "safetyBufferDays" INTEGER NOT NULL DEFAULT 2,
    "workDays" TEXT NOT NULL DEFAULT '1,2,3,4,5',

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
