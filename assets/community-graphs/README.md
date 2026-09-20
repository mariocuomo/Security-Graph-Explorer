# Contributing a community graph

Each subfolder here is one shared graph. To contribute:

1. Create a new folder: `community-graphs/<short-name>/`
2. Add two files inside it:
   - `graph.sggraph` — exported from the app (Graph Library → Export)
   - `metadata.json` — see schema below
3. Open a pull request. Once merged, the graph appears automatically on the
   Community page — no other step required.

## metadata.json schema

```json
{
  "name": "Short graph title",
  "description": "One sentence describing what the graph investigates.",
  "author": "Your name",
  "githubHandle": "your-github-username",
  "submittedDate": "2026-09-20",
  "tags": ["network", "devices"]
}
```

All fields are required except `tags` (optional, up to 5 short lowercase words).

The `community-index.json` file used by the Community page is generated
automatically by a GitHub Action on merge — do not edit it by hand.
