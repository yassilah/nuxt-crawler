import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
    declaration: true,
    entries: ['module'],
    externals: ['@nuxt/kit', '@nuxt/kit-edge']
})
