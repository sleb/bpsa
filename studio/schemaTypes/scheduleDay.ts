import { defineArrayMember, defineField, defineType } from "sanity";

export const scheduleDay = defineType({
  name: "scheduleDay",
  title: "Schedule Day",
  type: "document",
  fields: [
    defineField({
      name: "date",
      title: "Date",
      type: "date",
      options: { dateFormat: "YYYY-MM-DD" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "title",
      title: "Day Title",
      type: "string",
      description: 'e.g. "Day 1 — Arrival"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "entries",
      title: "Schedule Entries",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "id", type: "string", hidden: true }),
            defineField({
              name: "time",
              title: "Time (HH:MM, 24h)",
              type: "string",
              validation: (r) =>
                r.required().regex(/^\d{2}:\d{2}$/, { name: "HH:MM" }),
            }),
            defineField({
              name: "activity",
              title: "Activity",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "location",
              title: "Location",
              type: "string",
            }),
          ],
          preview: {
            select: { title: "time", subtitle: "activity" },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "date" },
  },
  orderings: [
    {
      title: "Date",
      name: "dateAsc",
      by: [{ field: "date", direction: "asc" }],
    },
  ],
});
