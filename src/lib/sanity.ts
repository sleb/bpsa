import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: 'ucdyt6y8',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

export interface SanityEntry {
  _key: string
  time: string
  activity: string
  location: string
}

export interface SanityScheduleDay {
  _id: string
  date: string
  title: string
  entries: SanityEntry[]
}

export async function getAllScheduleDays(): Promise<SanityScheduleDay[]> {
  return sanityClient.fetch(
    `*[_type == "scheduleDay"] | order(date asc) {
      _id, date, title,
      entries[] { _key, time, activity, location }
    }`
  )
}

export async function getScheduleDay(date: string): Promise<SanityScheduleDay | null> {
  return sanityClient.fetch(
    `*[_type == "scheduleDay" && date == $date][0] {
      _id, date, title,
      entries[] { _key, time, activity, location }
    }`,
    { date }
  )
}
