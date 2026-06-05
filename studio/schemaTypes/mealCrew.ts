import { defineArrayMember, defineField, defineType } from "sanity";

export const mealCrew = defineType({
  name: "mealCrew",
  title: "Meal Crew",
  type: "document",
  fields: [
    defineField({
      name: "label",
      title: "Meal Label",
      type: "string",
      description: 'e.g. "Thursday Dinner"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "date",
      options: { dateFormat: "YYYY-MM-DD" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "time",
      title: "Time (HH:MM, 24h)",
      type: "string",
      validation: (r) => r.required().regex(/^\d{2}:\d{2}$/, { name: "HH:MM" }),
    }),
    defineField({
      name: "members",
      title: "Crew Members",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "name",
              title: "Name",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "role",
              title: "Role",
              type: "string",
              options: { list: ["youth", "adult"] },
              validation: (r) => r.required(),
            }),
          ],
          preview: {
            select: { title: "name", subtitle: "role" },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "date" },
  },
  orderings: [
    {
      title: "Meal Order",
      name: "sortOrderAsc",
      by: [{ field: "sortOrder", direction: "asc" }],
    },
  ],
});
