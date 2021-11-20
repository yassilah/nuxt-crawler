import { defineNuxtModule } from '@nuxt/kit'
import { name, version } from './package.json'
import algoliasearch from 'algoliasearch'
import getMetaData from 'metadata-scraper'
import type { MetaData } from 'metadata-scraper/lib/types'
import type { SearchClient, SearchIndex } from 'algoliasearch'

export interface CrawlerOptions {
    fields:
        | ((route: string, html: string, meta: MetaData) => Partial<MetaData>)
        | (keyof MetaData)[]
    include: ((route: string) => boolean) | (string | RegExp)[]
    apiKey: string
    apiAdminKey: string
    appId: string
    indexName: string
}

export default defineNuxtModule<Partial<CrawlerOptions>>(nuxt => ({
    name,
    version,
    configKey: 'crawler',
    defaults: {
        include: undefined,
        fields: ['title', 'description']
    },
    setup(options: CrawlerOptions) {
        const pages: CrawlerPage[] = []

        function shouldInclude(route: string) {
            if (!options.include) return true

            if (Array.isArray(options.include)) {
                return options.include.some(value => route.match(value))
            }

            return options.include(route)
        }

        function getFields(route: string, html: string, meta: MetaData) {
            if (Array.isArray(options.fields)) {
                return options.fields.reduce(
                    (a, k) => ({ ...a, [k]: meta[k] }),
                    {} as Partial<MetaData>
                )
            }

            return options.fields(route, html, meta)
        }

        nuxt.hook('generate:before', () => {
            if (!options.apiAdminKey)
                throw new Error(
                    `Could not start Nuxt Crawler because no API Admin key was given. Please check your configuration.`
                )

            if (!options.apiKey)
                throw new Error(
                    `Could not start Nuxt Crawler because no API key was given. Please check your configuration.`
                )

            if (!options.appId)
                throw new Error(
                    `Could not start Nuxt Crawler because no Application ID was given. Please check your configuration.`
                )

            if (!options.indexName)
                throw new Error(
                    `Could not start Nuxt Crawler because no Index name was given. Please check your configuration.`
                )

            nuxt.options.cli.badgeMessages.push(
                `🔍 Crawler activated. (v${version})`
            )
        })

        nuxt.hook('generate:page', async function ({ route, html }) {
            if (shouldInclude(route)) {
                const meta = await getMetaData({ html })
                const fields = getFields(route, html, meta)
                const page = { href: route, ...fields }
                await nuxt.callHook('crawler:add:before', {
                    route,
                    html,
                    meta,
                    page,
                    fields
                })

                pages.push(page)

                await nuxt.callHook('crawler:add:after', {
                    route,
                    html,
                    meta,
                    page,
                    fields
                })

                nuxt.options.cli.badgeMessages.push(
                    `🔍 Crawler: Added metadata for the route.`
                )
            }
        })

        nuxt.hook('generate:done', async function () {
            if (pages.length > 0) {
                const { apiAdminKey, appId, indexName } = options
                const client = algoliasearch(appId, apiAdminKey)
                const index = client.initIndex(indexName)

                await nuxt.callHook('crawler:index:before', {
                    options,
                    pages,
                    client,
                    index
                })

                await index.replaceAllObjects(pages, {
                    autoGenerateObjectIDIfNotExist: true
                })

                await nuxt.callHook('crawler:index:after', {
                    options,
                    pages,
                    client,
                    index
                })

                nuxt.options.cli.badgeMessages.push(
                    `🔍 Crawler: Successfully added all ${pages.length} pages to your Algolia index.`
                )
            }
        })
    }
}))

export type CrawlerPage = {
    href: string
} & Partial<MetaData>

declare module '@nuxt/kit' {
    interface NuxtHooks {
        'crawler:add:before'(params: {
            route: string
            html: string
            meta: MetaData
            page: CrawlerPage
            fields: Partial<MetaData>
        }): void
        'crawler:add:after'(params: {
            route: string
            html: string
            meta: MetaData
            page: CrawlerPage
            fields: Partial<MetaData>
        }): void
        'crawler:index:before'(params: {
            options: CrawlerOptions
            pages: CrawlerPage[]
            client: SearchClient
            index: SearchIndex
        }): void
        'crawler:index:after'(params: {
            options: CrawlerOptions
            pages: CrawlerPage[]
            client: SearchClient
            index: SearchIndex
        }): void
    }
}
