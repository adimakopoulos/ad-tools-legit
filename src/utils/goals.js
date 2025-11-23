// src/utils/goals.js
export function computeGoalEndDate(startDate, cadence) {
  // startDate: Date instance
  const end = new Date(startDate)
  if (cadence === 'weekly') {
    end.setDate(end.getDate() + 7)
  } else if (cadence === 'monthly') {
    end.setMonth(end.getMonth() + 1)
  } else if (cadence === 'yearly') {
    end.setFullYear(end.getFullYear() + 1)
  }
  return end.toISOString().slice(0, 10) // YYYY-MM-DD
}

export function isGoalExpired(goal) {
  const today = new Date()
  const end = new Date(goal.end_date)
  // end date is in the past
  return end < new Date(today.toDateString())
}
