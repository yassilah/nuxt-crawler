# Features

Automatically crawl and store metadata about your Nuxt generated pages into your Algolia index. Should work with Nuxt 2, Nuxt Bridge & Nuxt 3 🔥.

# Install

```bash
yarn add @yassidev/nuxt-crawler -D
# npm i @yassidev/nuxt-crawler -D
```

# Usage

Within your `nuxt.config` add the following:

```ts
// nuxt.config

export default {
    buildModules: [
        '@yassidev/nuxt-crawler'
    ],

    crawler: {
        fields?: ((route: string, html: string, meta: MetaData) => Partial<MetaData>) | (keyof MetaData)[], // default: ['title', 'description']
        include?: ((route: string) => boolean) | (string | RegExp)[], // default: undefined
        apiKey: string, // required
        apiAdminKey: string, // required
        appId: string, // required
        indexName: string // required
    }
}
```

# Typescript

ForTypescript support, add the module within your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": [
      "@yassidev/nuxt-crawler"
    ]
  }
}
```
  "compilerOptions": {
