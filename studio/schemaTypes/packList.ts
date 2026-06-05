import { defineArrayMember, defineField, defineType } from "sanity";

export const packList = defineType({
  name: "packList",
  title: "Pack List",
  type: "document",
  fields: [
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Category Title",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "items",
              title: "Items",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  fields: [
                    defineField({
                      name: "name",
                      title: "Item Name",
                      type: "string",
                      validation: (r) => r.required(),
                    }),
                    defineField({
                      name: "note",
                      title: "Note",
                      type: "string",
                      description: "Optional clarification, e.g. "enough for 3 days"",
                    }),
                  ],
                  preview: {
                    select: { title: "name", subtitle: "note" },
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: { title: "title" },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "categories.0.title" },
    prepare: () => ({ title: "Pack List" }),
  },
});
