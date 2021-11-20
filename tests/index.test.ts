import { setupTest } from '@nuxt/test-utils'

describe('module', () => {
    setupTest({
        rootDir: __dirname,
        config: {
            buildModules: ['@yassidev/nuxt-crawler'],
            crawler: {
                test: 123
            }
        }
    })

    test('should be fine', () => {
        expect(true).toBe(true)
    })
})
