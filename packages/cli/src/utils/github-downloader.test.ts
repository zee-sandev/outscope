import { describe, expect, it } from 'vitest'
import { getTemplateConfig } from './github-downloader'

describe('github template config', () => {
  it('scaffolds from GitHub templates paths', () => {
    expect(getTemplateConfig('nova-api').templatePath).toBe('templates/nova-api')
    expect(getTemplateConfig('nova-fn-api').templatePath).toBe('templates/nova-fn-api')
    expect(getTemplateConfig('turbo-nova').templatePath).toBe('templates/turbo-nova')
    expect(getTemplateConfig('turbo-nova-fn').templatePath).toBe('templates/turbo-nova-fn')
  })
})
